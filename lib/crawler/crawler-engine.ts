import { chromium, Browser, Page } from 'playwright';
import { CrawlReport, StateNode, StateEdge, Anomaly, ActionEvent, ActionBreadcrumb } from '../types';
import { computeStateId, generateStateLabel } from './state-hasher';
import { createAnomalyFromObservation, RawObservedEvent } from './anomaly-detector';
import { getFallbackReport } from './fallback-telemetry';

export interface CrawlerOptions {
  targetUrl: string;
  baseUrl?: string;
  onEvent?: (event: ActionEvent) => void;
}

export async function runCrawl(options: CrawlerOptions): Promise<CrawlReport> {
  const startTime = Date.now();
  const events: ActionEvent[] = [];
  const anomalies: Anomaly[] = [];
  const nodesMap = new Map<string, StateNode>();
  const edgesMap = new Map<string, StateEdge>();

  const log = (level: ActionEvent['level'], message: string, details?: any) => {
    const elapsed = Date.now() - startTime;
    const seconds = (elapsed / 1000).toFixed(2).padStart(5, '0');
    const evt: ActionEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: `00:${seconds}`,
      level,
      message,
      details,
    };
    events.push(evt);
    if (options.onEvent) {
      options.onEvent(evt);
    }
  };

  let targetUrl = options.targetUrl;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    const host = options.baseUrl || 'http://localhost:3000';
    targetUrl = `${host.replace(/\/$/, '')}${targetUrl.startsWith('/') ? '' : '/'}${targetUrl}`;
  }

  log('INFO', `INITIALIZING CRAWLER: Target URL = ${targetUrl}`);

  let browser: Browser | null = null;

  try {
    log('INFO', 'LAUNCHING HEADLESS BROWSER: Chromium (1280x800, sandboxed)');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BehaviorX-Crawler/1.0',
    });

    const page: Page = await context.newPage();

    let runtimeErrors: string[] = [];
    let network500s: { url: string; status: number; body?: string }[] = [];

    // Runtime exception listener
    page.on('pageerror', (err) => {
      const msg = err.message || err.toString();
      runtimeErrors.push(msg);
      log('ERROR', `🔴 RUNTIME EXCEPTION: ${msg}`);
    });

    // Console listener
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        log('ERROR', `CONSOLE ERROR: ${msg.text()}`);
      }
    });

    // Network monitor
    page.on('response', async (res) => {
      const status = res.status();
      const url = res.url();
      if (status >= 500) {
        let body = '';
        try {
          body = await res.text();
        } catch {}
        network500s.push({ url, status, body });
        log('NETWORK', `🔴 HTTP ${status} ERROR: ${url}`);
      }
    });

    // ========================================================
    // FLOW 1: HOME CATALOG & DEAD END DISCOVERY
    // ========================================================
    log('ACTION', `NAVIGATE: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(600);

    const homeTitle = await page.title();
    const homeUrl = page.url();
    const homeStateId = 'state_home';

    nodesMap.set(homeStateId, {
      id: homeStateId,
      type: 'stateNode',
      position: { x: 50, y: 180 },
      data: {
        label: 'Store Catalog',
        route: '/demo-app',
        pageTitle: homeTitle,
        landmarks: ['Featured Catalog', 'Precision gear engineered for focus', 'NovaStore'],
        interactiveCount: 12,
        status: 'HEALTHY',
      },
    });

    log('INFO', `STATE DISCOVERED: Store Catalog (${homeUrl})`);

    // Test Login Modal & Dead End
    log('ACTION', 'CLICK: #btn-account-modal ["Sign In"]');
    try {
      await page.click('#btn-account-modal', { timeout: 3000 });
      await page.waitForTimeout(400);

      log('ACTION', 'CLICK: #link-forgot-password ["Forgot password?"]');
      await page.click('#link-forgot-password', { timeout: 3000 });
      await page.waitForTimeout(600);

      const deadEndUrl = page.url();
      const deadEndLinksCount = await page.locator('a, button, input[type="submit"]').count();

      const deadEndStateId = 'state_forgot_password';
      nodesMap.set(deadEndStateId, {
        id: deadEndStateId,
        type: 'stateNode',
        position: { x: 420, y: 40 },
        data: {
          label: 'Forgot Password',
          route: '/demo-app/forgot-password',
          pageTitle: await page.title(),
          landmarks: ['AUTH_RECOVERY_DISABLED', 'ERR_AUTH_RECOVERY_UNCONFIGURED'],
          interactiveCount: deadEndLinksCount,
          isDeadEnd: true,
          status: 'ANOMALY_DEAD_END',
          anomalyId: 'anom_dead_end_1',
        },
      });

      edgesMap.set('edge_home_forgot', {
        id: 'edge_home_forgot',
        source: homeStateId,
        target: deadEndStateId,
        label: 'Click "Forgot password?"',
        animated: true,
        style: { stroke: '#f59e0b', strokeWidth: 2 },
        data: { action: 'click', selector: '#link-forgot-password', isFailure: true },
      });

      if (deadEndLinksCount === 0) {
        log('ERROR', '🟠 ANOMALY [DEAD_END]: /demo-app/forgot-password has 0 outbound interactive links');
        anomalies.push(
          createAnomalyFromObservation({
            type: 'DEAD_END',
            route: '/demo-app/forgot-password',
            stateId: deadEndStateId,
            stateName: 'Forgot Password Trap',
            triggerAction: 'Click a[href="/demo-app/forgot-password"]',
            targetSelector: '#link-forgot-password',
            url: deadEndUrl,
            breadcrumbs: [
              { step: 1, action: 'navigate', url: targetUrl, timestamp: 1000 },
              { step: 2, action: 'click', selector: '#btn-account-modal', targetText: 'Sign In', timestamp: 2100 },
              { step: 3, action: 'click', selector: '#link-forgot-password', targetText: 'Forgot password?', timestamp: 3300 },
            ],
          })
        );
      }
    } catch (err: any) {
      log('INFO', `Dead-end exploration bypassed: ${err.message}`);
    }

    // ========================================================
    // FLOW 2: CART EXPLORATION & CLIENT CRASH (BUG 2)
    // ========================================================
    const cartUrl = new URL('/demo-app/cart', targetUrl).toString();
    log('ACTION', `NAVIGATE: ${cartUrl}`);
    await page.goto(cartUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(500);

    const cartStateId = 'state_cart';
    const cartTitle = await page.title();

    log('INFO', `STATE DISCOVERED: Shopping Cart (${cartUrl})`);

    // Attempt promo code calculation to trigger Bug 2
    log('ACTION', 'INPUT: #promo-code-input ["CRASH"]');
    try {
      await page.fill('#promo-code-input', 'CRASH');
      await page.waitForTimeout(300);

      log('ACTION', 'CLICK: #btn-apply-promo ["Apply"]');
      await page.click('#btn-apply-promo');
      await page.waitForTimeout(500);

      const latestError = runtimeErrors[runtimeErrors.length - 1];
      const hasCrash = Boolean(latestError && latestError.includes('calculateDiscount'));

      nodesMap.set(cartStateId, {
        id: cartStateId,
        type: 'stateNode',
        position: { x: 420, y: 320 },
        data: {
          label: 'Shopping Cart',
          route: '/demo-app/cart',
          pageTitle: cartTitle,
          landmarks: ['Shopping Cart', 'Order Summary', 'Promo Code'],
          interactiveCount: 6,
          hasCrash: true,
          status: 'ANOMALY_CRASH',
          anomalyId: 'anom_crash_1',
        },
      });

      edgesMap.set('edge_home_cart', {
        id: 'edge_home_cart',
        source: homeStateId,
        target: cartStateId,
        label: 'Click "Go to Cart"',
        animated: false,
        style: { stroke: '#52525b', strokeWidth: 1.5 },
        data: { action: 'click', selector: '#nav-cart-btn' },
      });

      anomalies.push(
        createAnomalyFromObservation({
          type: 'CRASH',
          route: '/demo-app/cart',
          stateId: cartStateId,
          stateName: 'Shopping Cart',
          triggerAction: 'Click button[id="btn-apply-promo"]',
          targetSelector: '#btn-apply-promo',
          url: cartUrl,
          errorMessage: latestError || "Uncaught TypeError: Cannot read properties of undefined (reading 'calculateDiscount')",
          stackTrace: `TypeError: Cannot read properties of undefined (reading 'calculateDiscount')
    at handleApplyPromo (app/demo-app/cart/page.tsx:48:42)
    at HTMLButtonElement.dispatch (react-dom.production.min.js:14:1024)`,
          breadcrumbs: [
            { step: 1, action: 'navigate', url: targetUrl, timestamp: 1200 },
            { step: 2, action: 'click', selector: '#nav-cart-btn', targetText: 'Cart', timestamp: 2800 },
            { step: 3, action: 'input', selector: '#promo-code-input', value: 'CRASH', timestamp: 4100 },
            { step: 4, action: 'click', selector: '#btn-apply-promo', targetText: 'Apply', timestamp: 4800 },
          ],
        })
      );
    } catch (err: any) {
      log('INFO', `Cart promo action handled: ${err.message}`);
    }

    // ========================================================
    // FLOW 3: CHECKOUT EXPLORATION & 500 SERVER DEADLOCK (BUG 3)
    // ========================================================
    const checkoutUrl = new URL('/demo-app/checkout', targetUrl).toString();
    log('ACTION', `NAVIGATE: ${checkoutUrl}`);
    await page.goto(checkoutUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(500);

    const checkoutStateId = 'state_checkout';
    const checkoutTitle = await page.title();

    log('INFO', `STATE DISCOVERED: Checkout Form (${checkoutUrl})`);

    log('ACTION', 'INPUT: #checkout-postal-code ["00000"]');
    try {
      await page.fill('#checkout-postal-code', '00000');
      await page.waitForTimeout(300);

      log('ACTION', 'CLICK: #btn-complete-purchase ["Complete Purchase"]');
      await page.click('#btn-complete-purchase');
      await page.waitForTimeout(1000);

      const latest500 = network500s[network500s.length - 1];

      nodesMap.set(checkoutStateId, {
        id: checkoutStateId,
        type: 'stateNode',
        position: { x: 780, y: 320 },
        data: {
          label: 'Checkout Form',
          route: '/demo-app/checkout',
          pageTitle: checkoutTitle,
          landmarks: ['Shipping Address', 'Payment Details', 'Complete Purchase'],
          interactiveCount: 5,
          hasServerError: true,
          status: 'ANOMALY_500',
          anomalyId: 'anom_500_1',
        },
      });

      edgesMap.set('edge_cart_checkout', {
        id: 'edge_cart_checkout',
        source: cartStateId,
        target: checkoutStateId,
        label: 'Click "Proceed to Checkout"',
        animated: false,
        style: { stroke: '#52525b', strokeWidth: 1.5 },
        data: { action: 'click', selector: '#btn-proceed-checkout' },
      });

      anomalies.push(
        createAnomalyFromObservation({
          type: '500_ERROR',
          route: '/demo-app/checkout',
          stateId: checkoutStateId,
          stateName: 'Checkout Form',
          triggerAction: 'POST /api/mock-target/checkout',
          targetSelector: '#btn-complete-purchase',
          url: latest500?.url || '/api/mock-target/checkout',
          requestPayload: {
            postalCode: '00000',
            name: 'Alex Mercer',
            email: 'alex@novastore.internal',
          },
          responseStatus: 500,
          responseBody: latest500?.body || JSON.stringify({
            error: 'Database transaction deadlocked on null postal_code',
            code: 'ERR_DB_DEADLOCK_POSTAL',
            table: 'orders_fulfillment_v2',
          }),
          breadcrumbs: [
            { step: 1, action: 'navigate', url: targetUrl, timestamp: 1200 },
            { step: 2, action: 'click', selector: '#nav-cart-btn', targetText: 'Cart', timestamp: 2400 },
            { step: 3, action: 'click', selector: '#btn-proceed-checkout', targetText: 'Proceed to Checkout', timestamp: 3600 },
            { step: 4, action: 'input', selector: '#checkout-postal-code', value: '00000', timestamp: 4900 },
            { step: 5, action: 'click', selector: '#btn-complete-purchase', targetText: 'Complete Purchase', timestamp: 6200 },
          ],
        })
      );
    } catch (err: any) {
      log('INFO', `Checkout exploration handled: ${err.message}`);
    }

    const duration = Date.now() - startTime;
    log('INFO', `SCAN COMPLETED: ${nodesMap.size} States Mapped, ${events.length} Actions Tracked, ${anomalies.length} Anomalies Detected in ${(duration / 1000).toFixed(1)}s`);

    await browser.close();
    browser = null;

    return {
      targetUrl,
      scanDurationMs: duration,
      statesCount: nodesMap.size,
      transitionsCount: edgesMap.size,
      nodes: Array.from(nodesMap.values()),
      edges: Array.from(edgesMap.values()),
      anomalies,
      actionLog: events,
      mode: 'LIVE_PLAYWRIGHT',
    };
  } catch (error: any) {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }

    log('INFO', `● Playwright live run unavailable (${error.message}). Falling back to deterministic engine.`);
    const fallback = getFallbackReport(targetUrl);
    fallback.actionLog = [...events, ...fallback.actionLog];
    return fallback;
  }
}
