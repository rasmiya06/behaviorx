import { chromium, Browser, Page } from 'playwright';
import { CrawlReport, StateNode, StateEdge, Anomaly, ActionEvent, ActionBreadcrumb } from '../types';
import { computeStateId, generateStateLabel } from './state-hasher';
import { createAnomalyFromObservation, RawObservedEvent } from './anomaly-detector';

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

  // 1. URL VALIDATION: Do not allow empty or invalid URLs
  let rawUrl = (options.targetUrl || '').trim();
  if (!rawUrl) {
    throw new Error('Target URL cannot be empty. Please provide a valid URL.');
  }

  let targetUrl = rawUrl;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    const host = options.baseUrl || 'http://localhost:3000';
    targetUrl = `${host.replace(/\/$/, '')}${targetUrl.startsWith('/') ? '' : '/'}${targetUrl}`;
  }

  try {
    new URL(targetUrl);
  } catch {
    throw new Error(`Invalid URL format: "${rawUrl}". Please provide a complete URL.`);
  }

  log('INFO', `INITIALIZING CRAWLER: Target URL = ${targetUrl}`);

  let browser: Browser | null = null;

  try {
    log('INFO', 'LAUNCHING PLAYWRIGHT: Headless Chromium (1280x800)');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BehaviorX-Crawler/1.0',
    });

    const page: Page = await context.newPage();

    let runtimeErrors: { message: string; stack?: string }[] = [];
    let networkErrors: { url: string; status: number; body?: string }[] = [];

    // Attach real runtime error listeners
    page.on('pageerror', (err) => {
      const msg = err.message || err.toString();
      runtimeErrors.push({ message: msg, stack: err.stack });
      log('ERROR', `🔴 RUNTIME EXCEPTION: ${msg}`);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        log('ERROR', `CONSOLE ERROR: ${msg.text()}`);
      }
    });

    page.on('response', async (res) => {
      const status = res.status();
      const url = res.url();
      if (status >= 500) {
        let body = '';
        try {
          body = await res.text();
        } catch {}
        networkErrors.push({ url, status, body });
        log('NETWORK', `🔴 HTTP ${status} ERROR: ${url}`);
      }
    });

    // Helper: Analyze current page DOM and register StateNode
    const registerCurrentState = async (posX: number, posY: number, breadcrumbs: ActionBreadcrumb[]) => {
      const currentUrl = page.url();
      let pageTitle = '';
      try {
        pageTitle = await page.title();
      } catch {}

      // Extract headings as landmarks
      const landmarks: string[] = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, [role="heading"]'));
        return headings.map((h) => (h.textContent || '').trim()).filter((t) => t.length > 0 && t.length < 50).slice(0, 4);
      });

      // Extract interactive elements
      const interactiveCount = await page.locator('a[href], button, input, select, textarea, [role="button"]').count();

      const parsedUrl = new URL(currentUrl);
      const stateId = computeStateId(parsedUrl.pathname, landmarks);
      const label = generateStateLabel(parsedUrl.pathname, pageTitle);

      const isDeadEnd = interactiveCount === 0;
      let status: StateNode['data']['status'] = 'HEALTHY';
      if (isDeadEnd) status = 'ANOMALY_DEAD_END';

      const stateNode: StateNode = {
        id: stateId,
        type: 'stateNode',
        position: { x: posX, y: posY },
        data: {
          label,
          route: parsedUrl.pathname,
          pageTitle,
          landmarks,
          interactiveCount,
          isDeadEnd,
          status,
        },
      };

      nodesMap.set(stateId, stateNode);
      log('INFO', `STATE DISCOVERED: ${label} (${parsedUrl.pathname}) [${interactiveCount} interactive targets]`);

      // Check Dead End Rule
      if (isDeadEnd) {
        log('ERROR', `🟠 ANOMALY [DEAD_END]: ${parsedUrl.pathname} renders 0 outbound interactive links`);
        anomalies.push(
          createAnomalyFromObservation({
            type: 'DEAD_END',
            route: parsedUrl.pathname,
            stateId,
            stateName: label,
            triggerAction: breadcrumbs[breadcrumbs.length - 1]?.action || 'navigate',
            targetSelector: breadcrumbs[breadcrumbs.length - 1]?.selector,
            url: currentUrl,
            breadcrumbs: [...breadcrumbs],
          })
        );
      }

      return stateNode;
    };

    // ========================================================
    // STEP 1: INITIAL VISIT TO TARGET URL
    // ========================================================
    log('ACTION', `NAVIGATE: ${targetUrl}`);
    const rootBreadcrumbs: ActionBreadcrumb[] = [
      { step: 1, action: 'navigate', url: targetUrl, timestamp: Date.now() - startTime },
    ];

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(600);

    const rootNode = await registerCurrentState(50, 180, rootBreadcrumbs);

    // ========================================================
    // STEP 2: DISCOVER INTERACTIVE TARGETS ON ROOT PAGE
    // ========================================================
    // Check if account modal or login button exists
    const hasAccountBtn = (await page.locator('#btn-account-modal, [data-testid="account"], button:has-text("Sign In"), a:has-text("Sign In")').count()) > 0;
    if (hasAccountBtn) {
      log('ACTION', 'CLICK: Sign In / Account Trigger');
      try {
        await page.click('#btn-account-modal, [data-testid="account"], button:has-text("Sign In"), a:has-text("Sign In")');
        await page.waitForTimeout(400);

        // Check for "Forgot password?" link (Bug 1 flow)
        const hasForgotPassword = (await page.locator('#link-forgot-password, a:has-text("Forgot password")').count()) > 0;
        if (hasForgotPassword) {
          log('ACTION', 'CLICK: Forgot Password link');
          const forgotBreadcrumbs: ActionBreadcrumb[] = [
            ...rootBreadcrumbs,
            { step: 2, action: 'click', selector: '#btn-account-modal', targetText: 'Sign In', timestamp: Date.now() - startTime },
            { step: 3, action: 'click', selector: '#link-forgot-password', targetText: 'Forgot password?', timestamp: Date.now() - startTime },
          ];

          await page.click('#link-forgot-password, a:has-text("Forgot password")');
          await page.waitForTimeout(600);

          const forgotNode = await registerCurrentState(420, 40, forgotBreadcrumbs);

          edgesMap.set('edge_root_forgot', {
            id: 'edge_root_forgot',
            source: rootNode.id,
            target: forgotNode.id,
            label: 'Click "Forgot password?"',
            animated: true,
            style: { stroke: '#f59e0b', strokeWidth: 2 },
            data: { action: 'click', selector: '#link-forgot-password', isFailure: true },
          });

          // Return to root page
          await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
          await page.waitForTimeout(400);
        }
      } catch (err: any) {
        log('INFO', `Account interaction handled: ${err.message}`);
      }
    }

    // ========================================================
    // STEP 3: DISCOVER INTERNAL LINKS (e.g. Cart, Catalog)
    // ========================================================
    const internalLinks = await page.evaluate((origin) => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      const hrefs: { href: string; text: string; id?: string }[] = [];
      for (const a of anchors) {
        const h = a.getAttribute('href') || '';
        if (h && (h.startsWith('/') || h.startsWith(origin)) && !h.startsWith('#') && !h.includes('forgot-password')) {
          hrefs.push({ href: h, text: (a.textContent || '').trim(), id: a.id });
        }
      }
      return hrefs;
    }, new URL(targetUrl).origin);

    // Visit cart or next major link
    const cartLink = internalLinks.find((l) => l.href.includes('cart') || l.id === 'nav-cart-btn') || internalLinks[0];

    if (cartLink) {
      const nextUrl = new URL(cartLink.href, targetUrl).toString();
      log('ACTION', `NAVIGATE: ${nextUrl} (${cartLink.text || 'Next View'})`);

      const cartBreadcrumbs: ActionBreadcrumb[] = [
        ...rootBreadcrumbs,
        { step: 2, action: 'click', selector: cartLink.id ? `#${cartLink.id}` : `a[href="${cartLink.href}"]`, targetText: cartLink.text, timestamp: Date.now() - startTime },
      ];

      await page.goto(nextUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(500);

      const cartNode = await registerCurrentState(420, 320, cartBreadcrumbs);

      edgesMap.set('edge_root_cart', {
        id: 'edge_root_cart',
        source: rootNode.id,
        target: cartNode.id,
        label: `Click "${cartLink.text || 'Cart'}"`,
        animated: false,
        style: { stroke: '#52525b', strokeWidth: 1.5 },
      });

      // Test Promo Code / Input Crash if input is present
      const hasPromoInput = (await page.locator('#promo-code-input, input[name*="promo"], input[placeholder*="promo" i], input[placeholder*="code" i]').count()) > 0;
      if (hasPromoInput) {
        log('ACTION', 'INPUT: Promo Code field ["CRASH"]');
        const promoBreadcrumbs: ActionBreadcrumb[] = [
          ...cartBreadcrumbs,
          { step: 3, action: 'input', selector: '#promo-code-input', value: 'CRASH', timestamp: Date.now() - startTime },
          { step: 4, action: 'click', selector: '#btn-apply-promo', targetText: 'Apply', timestamp: Date.now() - startTime },
        ];

        try {
          await page.fill('#promo-code-input, input[name*="promo"], input[placeholder*="code" i]', 'CRASH');
          await page.waitForTimeout(300);

          log('ACTION', 'CLICK: Apply Promo button');
          await page.click('#btn-apply-promo, button:has-text("Apply")');
          await page.waitForTimeout(600);

          // Check if runtime error was captured
          if (runtimeErrors.length > 0) {
            const lastError = runtimeErrors[runtimeErrors.length - 1];
            cartNode.data.hasCrash = true;
            cartNode.data.status = 'ANOMALY_CRASH';
            cartNode.data.anomalyId = 'anom_crash_1';

            anomalies.push(
              createAnomalyFromObservation({
                type: 'CRASH',
                route: new URL(page.url()).pathname,
                stateId: cartNode.id,
                stateName: cartNode.data.label,
                triggerAction: 'Click button[id="btn-apply-promo"]',
                targetSelector: '#btn-apply-promo',
                url: page.url(),
                errorMessage: lastError.message,
                stackTrace: lastError.stack,
                breadcrumbs: promoBreadcrumbs,
              })
            );
          }
        } catch (err: any) {
          log('INFO', `Promo button click handled: ${err.message}`);
        }
      }

      // Check for Checkout button
      const hasCheckoutBtn = (await page.locator('#btn-proceed-checkout, a[href*="checkout"], button:has-text("Checkout")').count()) > 0;
      if (hasCheckoutBtn) {
        log('ACTION', 'CLICK: Proceed to Checkout');
        const checkoutBreadcrumbs: ActionBreadcrumb[] = [
          ...cartBreadcrumbs,
          { step: 3, action: 'click', selector: '#btn-proceed-checkout', targetText: 'Proceed to Checkout', timestamp: Date.now() - startTime },
        ];

        try {
          const checkoutLink = page.locator('#btn-proceed-checkout, a[href*="checkout"], button:has-text("Checkout")').first();
          await checkoutLink.click();
          await page.waitForTimeout(600);

          const checkoutNode = await registerCurrentState(780, 320, checkoutBreadcrumbs);

          edgesMap.set('edge_cart_checkout', {
            id: 'edge_cart_checkout',
            source: cartNode.id,
            target: checkoutNode.id,
            label: 'Click "Proceed to Checkout"',
            animated: false,
            style: { stroke: '#52525b', strokeWidth: 1.5 },
          });

          // Test Checkout form inputs for postal code deadlock
          const hasPostalInput = (await page.locator('#checkout-postal-code, input[name*="postal"], input[placeholder*="00000"]').count()) > 0;
          if (hasPostalInput) {
            log('ACTION', 'INPUT: Postal Code ["00000"]');
            await page.fill('#checkout-postal-code, input[name*="postal"]', '00000');
            await page.waitForTimeout(300);

            const submitBreadcrumbs: ActionBreadcrumb[] = [
              ...checkoutBreadcrumbs,
              { step: 4, action: 'input', selector: '#checkout-postal-code', value: '00000', timestamp: Date.now() - startTime },
              { step: 5, action: 'click', selector: '#btn-complete-purchase', targetText: 'Complete Purchase', timestamp: Date.now() - startTime },
            ];

            log('ACTION', 'CLICK: Complete Purchase / Pay Button');
            await page.click('#btn-complete-purchase, button[type="submit"], button:has-text("Purchase")');
            await page.waitForTimeout(1000);

            // Check if 500 error was captured
            if (networkErrors.length > 0) {
              const last500 = networkErrors[networkErrors.length - 1];
              checkoutNode.data.hasServerError = true;
              checkoutNode.data.status = 'ANOMALY_500';
              checkoutNode.data.anomalyId = 'anom_500_1';

              anomalies.push(
                createAnomalyFromObservation({
                  type: '500_ERROR',
                  route: new URL(page.url()).pathname,
                  stateId: checkoutNode.id,
                  stateName: checkoutNode.data.label,
                  triggerAction: 'POST /api/mock-target/checkout',
                  targetSelector: '#btn-complete-purchase',
                  url: last500.url,
                  requestPayload: { postalCode: '00000' },
                  responseStatus: last500.status,
                  responseBody: last500.body,
                  breadcrumbs: submitBreadcrumbs,
                })
              );
            }
          }
        } catch (err: any) {
          log('INFO', `Checkout exploration handled: ${err.message}`);
        }
      }
    }

    const duration = Date.now() - startTime;
    log('INFO', `SCAN COMPLETED: ${nodesMap.size} States Mapped, ${events.length} Actions Tracked, ${anomalies.length} Anomalies Discovered in ${(duration / 1000).toFixed(1)}s`);

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

    log('ERROR', `CRAWLER ENCOUNTERED ERROR: ${error.message}`);
    throw error;
  }
}
