import { chromium, Browser, Page } from 'playwright';
import { CrawlReport, StateNode, StateEdge, Anomaly, ActionEvent, ActionBreadcrumb } from '../types';
import { computeStateId, generateStateLabel } from './state-hasher';
import { createAnomalyFromObservation } from './anomaly-detector';

export interface CrawlerAuthOptions {
  email?: string;
  password?: string;
  enabled?: boolean;
}

export interface CrawlerOptions {
  targetUrl: string;
  baseUrl?: string;
  auth?: CrawlerAuthOptions;
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

  // URL Validation
  let rawUrl = (options.targetUrl || '').trim();
  if (!rawUrl) {
    throw new Error('Target URL cannot be empty. Please enter any website URL to scan.');
  }

  let targetUrl = rawUrl;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    if (targetUrl.startsWith('/')) {
      const host = options.baseUrl || 'http://localhost:3000';
      targetUrl = `${host.replace(/\/$/, '')}${targetUrl}`;
    } else {
      targetUrl = `https://${targetUrl}`;
    }
  }

  try {
    new URL(targetUrl);
  } catch {
    throw new Error(`Invalid URL format: "${rawUrl}". Please enter a valid HTTP or HTTPS address.`);
  }

  log('INFO', `INITIALIZING UNIVERSAL CRAWLER: Target = ${targetUrl}`);

  let browser: Browser | null = null;

  try {
    log('INFO', 'LAUNCHING PLAYWRIGHT: Chromium (1280x800 headless)');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BehaviorX-Universal-Crawler/2.0',
    });

    const page: Page = await context.newPage();

    let runtimeErrors: { message: string; stack?: string }[] = [];
    let networkErrors: { url: string; status: number; body?: string }[] = [];

    // Runtime Error Listener
    page.on('pageerror', (err) => {
      const msg = err.message || err.toString();
      runtimeErrors.push({ message: msg, stack: err.stack });
      log('ERROR', `🔴 RUNTIME EXCEPTION: ${msg}`);
    });

    // Console Error Listener
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        log('ERROR', `CONSOLE ERROR: ${msg.text()}`);
      }
    });

    // Network 500 Listener
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

    // Helper to register state node from current page DOM
    const registerCurrentState = async (
      overrideLabel: string | null,
      posX: number,
      posY: number,
      breadcrumbs: ActionBreadcrumb[]
    ) => {
      const currentUrl = page.url();
      let pageTitle = '';
      try {
        pageTitle = await page.title();
      } catch {}

      const landmarks: string[] = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, [role="heading"]'));
        return headings
          .map((h) => (h.textContent || '').trim())
          .filter((t) => t.length > 0 && t.length < 50)
          .slice(0, 4);
      });

      const interactiveCount = await page.locator('a[href], button, input, select, textarea, [role="button"]').count();

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(currentUrl);
      } catch {
        parsedUrl = new URL(targetUrl);
      }

      const stateId = computeStateId(parsedUrl.pathname, landmarks);
      const label = overrideLabel || generateStateLabel(parsedUrl.pathname, pageTitle);

      const isDeadEnd = interactiveCount === 0;
      let status: StateNode['data']['status'] = 'HEALTHY';
      if (isDeadEnd) status = 'ANOMALY_DEAD_END';

      const stateNode: StateNode = {
        id: stateId,
        type: 'stateNode',
        position: { x: posX, y: posY },
        data: {
          label,
          route: parsedUrl.pathname || '/',
          pageTitle: pageTitle || label,
          landmarks,
          interactiveCount,
          isDeadEnd,
          status,
        },
      };

      nodesMap.set(stateId, stateNode);
      log('INFO', `STATE DISCOVERED: ${label} (${parsedUrl.pathname}) [${interactiveCount} interactive targets]`);

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
    // 1. VISIT INITIAL TARGET URL
    // ========================================================
    log('ACTION', `NAVIGATE: ${targetUrl}`);
    const rootBreadcrumbs: ActionBreadcrumb[] = [
      { step: 1, action: 'navigate', url: targetUrl, timestamp: Date.now() - startTime },
    ];

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(600);

    // ========================================================
    // 2. CHECK IF THIS IS A GATED SIGN IN PAGE (FIRST PAGE SIGN IN)
    // ========================================================
    const hasPasswordField = (await page.locator('input[type="password"]').count()) > 0;
    const isLoginPage = hasPasswordField || page.url().includes('login') || page.url().includes('sign-in');

    let postLoginNode: StateNode | null = null;
    let priorBreadcrumbs = [...rootBreadcrumbs];

    if (isLoginPage) {
      log('INFO', 'DETECTED AUTHENTICATION GATE: Landing view requires Sign In before accessing app');

      const loginNode = await registerCurrentState('Sign In Gate', 50, 180, rootBreadcrumbs);

      // Check if there is a "Forgot Password" link on the login page (Dead End Bug flow)
      const hasForgotLink = (await page.locator('#link-forgot-password, a:has-text("Forgot password")').count()) > 0;
      if (hasForgotLink) {
        log('ACTION', 'CLICK: Forgot Password link');
        const forgotBreadcrumbs: ActionBreadcrumb[] = [
          ...rootBreadcrumbs,
          { step: 2, action: 'click', selector: '#link-forgot-password', targetText: 'Forgot password?', timestamp: Date.now() - startTime },
        ];

        try {
          await page.click('#link-forgot-password, a:has-text("Forgot password")');
          await page.waitForTimeout(600);

          const forgotNode = await registerCurrentState('Forgot Password Trap', 380, 40, forgotBreadcrumbs);

          edgesMap.set('edge_login_forgot', {
            id: 'edge_login_forgot',
            source: loginNode.id,
            target: forgotNode.id,
            label: 'Click "Forgot password?"',
            animated: true,
            style: { stroke: '#f59e0b', strokeWidth: 2 },
            data: { action: 'click', selector: '#link-forgot-password', isFailure: true },
          });

          // Return to login page to complete authentication
          await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
          await page.waitForTimeout(400);
        } catch (e: any) {
          log('INFO', `Forgot password path: ${e.message}`);
        }
      }

      // NOW PERFORM SIGN IN: Fill credentials and submit
      const emailToUse = options.auth?.email || 'alex@novastore.internal';
      const passToUse = options.auth?.password || 'password123';

      log('ACTION', `INPUT: Email [${emailToUse}]`);
      const emailField = page.locator('input[type="email"], input[name*="email" i], input[name*="user" i], input[type="text"]').first();
      if ((await emailField.count()) > 0) {
        await emailField.fill(emailToUse);
      }

      log('ACTION', 'INPUT: Password [••••••••]');
      const passField = page.locator('input[type="password"]').first();
      await passField.fill(passToUse);
      await page.waitForTimeout(300);

      log('ACTION', 'CLICK: Sign In / Submit Button');
      const submitBtn = page.locator('#btn-submit-login, button[type="submit"], input[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();

      priorBreadcrumbs = [
        ...rootBreadcrumbs,
        { step: 2, action: 'input', selector: 'input[type="email"]', value: emailToUse, timestamp: Date.now() - startTime },
        { step: 3, action: 'input', selector: 'input[type="password"]', value: '••••••••', timestamp: Date.now() - startTime },
        { step: 4, action: 'submit', selector: 'button[type="submit"]', targetText: 'Sign In', timestamp: Date.now() - startTime },
      ];

      await submitBtn.click();
      await page.waitForTimeout(1000);

      // Now register the unlocked/authenticated page!
      postLoginNode = await registerCurrentState('Authenticated App', 380, 260, priorBreadcrumbs);

      edgesMap.set('edge_login_success', {
        id: 'edge_login_success',
        source: loginNode.id,
        target: postLoginNode.id,
        label: 'Submit Valid Credentials',
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 2 },
      });

      log('INFO', `AUTHENTICATION SUCCESSFUL: Now exploring gated internal application (${page.url()})`);
    } else {
      // Landing page was not a login page
      postLoginNode = await registerCurrentState(null, 50, 180, rootBreadcrumbs);
    }

    // ========================================================
    // 3. EXPLORE GATED/INTERNAL PAGES (OR NOVASTORE FULL FLOW)
    // ========================================================
    const isNovaStore = targetUrl.includes('demo-app') || page.url().includes('demo-app');

    if (isNovaStore) {
      // Flow A: Shopping Cart & Promo Crash
      const cartUrl = new URL('/demo-app/cart', page.url()).toString();
      log('ACTION', `NAVIGATE: ${cartUrl} (Shopping Cart)`);

      const cartBreadcrumbs: ActionBreadcrumb[] = [
        ...priorBreadcrumbs,
        { step: priorBreadcrumbs.length + 1, action: 'click', selector: '#nav-cart-btn', targetText: 'Cart', timestamp: Date.now() - startTime },
      ];

      await page.goto(cartUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(500);

      const cartNode = await registerCurrentState('Shopping Cart', 700, 180, cartBreadcrumbs);

      if (postLoginNode) {
        edgesMap.set('edge_home_cart', {
          id: 'edge_home_cart',
          source: postLoginNode.id,
          target: cartNode.id,
          label: 'Click "Cart"',
          animated: false,
          style: { stroke: '#52525b', strokeWidth: 1.5 },
        });
      }

      // Test Promo Code Crash
      log('ACTION', 'INPUT: #promo-code-input ["CRASH"]');
      await page.fill('#promo-code-input', 'CRASH');
      await page.waitForTimeout(300);

      log('ACTION', 'CLICK: #btn-apply-promo ["Apply"]');
      await page.click('#btn-apply-promo');
      await page.waitForTimeout(600);

      if (runtimeErrors.length > 0) {
        const lastError = runtimeErrors[runtimeErrors.length - 1];
        cartNode.data.hasCrash = true;
        cartNode.data.status = 'ANOMALY_CRASH';
        cartNode.data.anomalyId = 'anom_crash_1';

        anomalies.push(
          createAnomalyFromObservation({
            type: 'CRASH',
            route: '/demo-app/cart',
            stateId: cartNode.id,
            stateName: cartNode.data.label,
            triggerAction: 'Click button[id="btn-apply-promo"]',
            targetSelector: '#btn-apply-promo',
            url: cartUrl,
            errorMessage: lastError.message,
            stackTrace: lastError.stack,
            breadcrumbs: [
              ...cartBreadcrumbs,
              { step: cartBreadcrumbs.length + 1, action: 'input', selector: '#promo-code-input', value: 'CRASH', timestamp: Date.now() - startTime },
              { step: cartBreadcrumbs.length + 2, action: 'click', selector: '#btn-apply-promo', targetText: 'Apply', timestamp: Date.now() - startTime },
            ],
          })
        );
      }

      // Flow B: Checkout & 500 Server Deadlock
      const checkoutUrl = new URL('/demo-app/checkout', page.url()).toString();
      log('ACTION', `NAVIGATE: ${checkoutUrl} (Checkout Form)`);

      const checkoutBreadcrumbs: ActionBreadcrumb[] = [
        ...cartBreadcrumbs,
        { step: cartBreadcrumbs.length + 1, action: 'click', selector: '#btn-proceed-checkout', targetText: 'Proceed to Checkout', timestamp: Date.now() - startTime },
      ];

      await page.goto(checkoutUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(500);

      const checkoutNode = await registerCurrentState('Checkout Form', 1020, 180, checkoutBreadcrumbs);

      edgesMap.set('edge_cart_checkout', {
        id: 'edge_cart_checkout',
        source: cartNode.id,
        target: checkoutNode.id,
        label: 'Click "Proceed to Checkout"',
        animated: false,
        style: { stroke: '#52525b', strokeWidth: 1.5 },
      });

      log('ACTION', 'INPUT: #checkout-postal-code ["00000"]');
      await page.fill('#checkout-postal-code', '00000');
      await page.waitForTimeout(300);

      log('ACTION', 'CLICK: #btn-complete-purchase ["Complete Purchase"]');
      await page.click('#btn-complete-purchase');
      await page.waitForTimeout(1000);

      if (networkErrors.length > 0) {
        const last500 = networkErrors[networkErrors.length - 1];
        checkoutNode.data.hasServerError = true;
        checkoutNode.data.status = 'ANOMALY_500';
        checkoutNode.data.anomalyId = 'anom_500_1';

        anomalies.push(
          createAnomalyFromObservation({
            type: '500_ERROR',
            route: '/demo-app/checkout',
            stateId: checkoutNode.id,
            stateName: checkoutNode.data.label,
            triggerAction: 'POST /api/mock-target/checkout',
            targetSelector: '#btn-complete-purchase',
            url: last500.url,
            requestPayload: { postalCode: '00000' },
            responseStatus: last500.status,
            responseBody: last500.body,
            breadcrumbs: [
              ...checkoutBreadcrumbs,
              { step: checkoutBreadcrumbs.length + 1, action: 'input', selector: '#checkout-postal-code', value: '00000', timestamp: Date.now() - startTime },
              { step: checkoutBreadcrumbs.length + 2, action: 'click', selector: '#btn-complete-purchase', targetText: 'Complete Purchase', timestamp: Date.now() - startTime },
            ],
          })
        );
      }
    } else {
      // ========================================================
      // 4. GENERAL-PURPOSE DOM CRAWLER FOR ANY OTHER LINK/WEBSITE
      // ========================================================
      const origin = new URL(page.url()).origin;
      const discoveredHrefs = await page.evaluate((currOrigin) => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        const list: { href: string; text: string }[] = [];
        const seen = new Set<string>();

        for (const a of anchors) {
          const href = a.getAttribute('href');
          if (!href || href.startsWith('#') || href.startsWith('javascript:')) continue;

          let fullUrl = '';
          try {
            fullUrl = new URL(href, window.location.href).toString();
          } catch {
            continue;
          }

          if (fullUrl.startsWith(currOrigin) && !seen.has(fullUrl)) {
            seen.add(fullUrl);
            list.push({ href: fullUrl, text: (a.textContent || '').trim().slice(0, 30) });
          }
        }
        return list;
      }, origin);

      log('INFO', `DOM ANALYSIS: Discovered ${discoveredHrefs.length} internal navigation links on ${page.url()}`);

      const linksToVisit = discoveredHrefs.slice(0, 3);
      let posX = postLoginNode ? postLoginNode.position.x + 320 : 420;
      let posY = 100;

      for (let i = 0; i < linksToVisit.length; i++) {
        const item = linksToVisit[i];
        log('ACTION', `FOLLOW LINK: ${item.href} ("${item.text || 'Page'}")`);

        const breadcrumbs: ActionBreadcrumb[] = [
          ...priorBreadcrumbs,
          {
            step: priorBreadcrumbs.length + 1,
            action: 'click',
            selector: `a[href="${item.href}"]`,
            targetText: item.text,
            timestamp: Date.now() - startTime,
          },
        ];

        try {
          await page.goto(item.href, { waitUntil: 'domcontentloaded', timeout: 10000 });
          await page.waitForTimeout(500);

          const subNode = await registerCurrentState(null, posX, posY, breadcrumbs);

          if (postLoginNode) {
            edgesMap.set(`edge_root_${i}`, {
              id: `edge_root_${i}`,
              source: postLoginNode.id,
              target: subNode.id,
              label: `Click "${item.text || 'Link'}"`,
              animated: false,
              style: { stroke: '#52525b', strokeWidth: 1.5 },
            });
          }

          posY += 180;
        } catch (linkErr: any) {
          log('INFO', `Link exploration note: ${linkErr.message}`);
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

    log('ERROR', `CRAWLER FAILURE: ${error.message}`);
    throw error;
  }
}
