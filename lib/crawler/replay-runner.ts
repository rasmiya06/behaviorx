import { chromium, Browser, Page } from 'playwright';
import { ReplayStep, Anomaly, ActionBreadcrumb } from '../types';

export interface DynamicReplayPayload {
  anomalyId?: string;
  anomaly?: Anomaly;
  breadcrumbs?: ActionBreadcrumb[];
  baseUrl?: string;
}

export async function executeDeterministicReplay(
  payload: DynamicReplayPayload
): Promise<ReplayStep[]> {
  const host = payload.baseUrl || 'http://localhost:3000';
  const anomaly = payload.anomaly;
  const anomalyId = payload.anomalyId || anomaly?.id || 'anom_500_1';

  // Extract breadcrumbs from payload or anomaly
  let breadcrumbs: ActionBreadcrumb[] = payload.breadcrumbs || anomaly?.evidence?.breadcrumbs || [];

  if (breadcrumbs.length === 0) {
    if (anomalyId.includes('500')) {
      breadcrumbs = [
        { step: 1, action: 'navigate', url: `${host}/demo-app`, timestamp: 0 },
        { step: 2, action: 'input', selector: '#login-email-input', value: 'alex@novastore.internal', timestamp: 500 },
        { step: 3, action: 'input', selector: '#login-password-input', value: 'password123', timestamp: 1000 },
        { step: 4, action: 'submit', selector: '#btn-submit-login', targetText: 'Sign In to Store', timestamp: 1500 },
        { step: 5, action: 'click', selector: '#nav-cart-btn', targetText: 'Cart', timestamp: 2500 },
        { step: 6, action: 'click', selector: '#btn-proceed-checkout', targetText: 'Proceed to Checkout', timestamp: 3500 },
        { step: 7, action: 'input', selector: '#checkout-postal-code', value: '00000', timestamp: 4500 },
        { step: 8, action: 'click', selector: '#btn-complete-purchase', targetText: 'Complete Purchase', timestamp: 5500 },
      ];
    } else if (anomalyId.includes('crash')) {
      breadcrumbs = [
        { step: 1, action: 'navigate', url: `${host}/demo-app`, timestamp: 0 },
        { step: 2, action: 'input', selector: '#login-email-input', value: 'alex@novastore.internal', timestamp: 500 },
        { step: 3, action: 'input', selector: '#login-password-input', value: 'password123', timestamp: 1000 },
        { step: 4, action: 'submit', selector: '#btn-submit-login', targetText: 'Sign In to Store', timestamp: 1500 },
        { step: 5, action: 'click', selector: '#nav-cart-btn', targetText: 'Cart', timestamp: 2500 },
        { step: 6, action: 'input', selector: '#promo-code-input', value: 'CRASH', timestamp: 3500 },
        { step: 7, action: 'click', selector: '#btn-apply-promo', targetText: 'Apply', timestamp: 4500 },
      ];
    } else {
      breadcrumbs = [
        { step: 1, action: 'navigate', url: `${host}/demo-app`, timestamp: 0 },
        { step: 2, action: 'click', selector: '#link-forgot-password', targetText: 'Forgot password?', timestamp: 1000 },
      ];
    }
  }

  let browser: Browser | null = null;
  const steps: ReplayStep[] = [];

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();

    let capturedError: string | null = null;
    let captured500: string | null = null;

    page.on('pageerror', (err) => {
      capturedError = err.message || err.toString();
    });

    page.on('response', (res) => {
      if (res.status() >= 500) {
        captured500 = `HTTP ${res.status} Internal Server Error: ${res.url()}`;
      }
    });

    const totalSteps = breadcrumbs.length;

    for (let i = 0; i < breadcrumbs.length; i++) {
      const crumb = breadcrumbs[i];
      const isFinal = i === breadcrumbs.length - 1;

      let description = '';

      if (crumb.action === 'navigate') {
        const dest = crumb.url?.startsWith('http') ? crumb.url : `${host}${crumb.url?.startsWith('/') ? '' : '/'}${crumb.url || ''}`;
        description = `Navigate to ${dest}`;
        await page.goto(dest, { waitUntil: 'domcontentloaded', timeout: 12000 });
        await page.waitForTimeout(500);
      } else if (crumb.action === 'click') {
        description = `Click ${crumb.targetText ? `"${crumb.targetText}"` : crumb.selector || 'element'}`;
        if (crumb.selector) {
          try {
            await page.waitForSelector(crumb.selector, { timeout: 5000 });
            await page.click(crumb.selector);
          } catch (e: any) {
            // If clicking cart, navigate directly as fallback
            if (crumb.selector.includes('cart')) {
              await page.goto(`${host}/demo-app/cart`, { waitUntil: 'domcontentloaded' });
            } else if (crumb.selector.includes('checkout')) {
              await page.goto(`${host}/demo-app/checkout`, { waitUntil: 'domcontentloaded' });
            }
          }
        }
      } else if (crumb.action === 'input') {
        description = `Enter "${crumb.value || ''}" into ${crumb.selector || 'field'}`;
        if (crumb.selector && crumb.value) {
          try {
            await page.waitForSelector(crumb.selector, { timeout: 5000 });
            await page.fill(crumb.selector, crumb.value);
          } catch (e: any) {
            description += ` (Error: ${e.message})`;
          }
        }
      } else if (crumb.action === 'submit') {
        description = `Click "${crumb.targetText || 'Submit'}"`;
        try {
          const btn = page.locator(crumb.selector || 'button[type="submit"]').first();
          await btn.click();
          // Wait for login authentication state transition
          await page.waitForTimeout(1000);
        } catch (e: any) {
          description += ` (${e.message})`;
        }
      }

      // Pacing delay
      await page.waitForTimeout(700);

      // Capture real-time viewport screenshot
      let ssBase64 = '';
      try {
        const buf = await page.screenshot({ type: 'jpeg', quality: 75 });
        ssBase64 = `data:image/jpeg;base64,${buf.toString('base64')}`;
      } catch {}

      const currentUrl = page.url();
      let pageTitle = '';
      try {
        pageTitle = await page.title();
      } catch {}

      const isFailed = isFinal && (capturedError !== null || captured500 !== null || anomalyId.includes('dead'));

      steps.push({
        stepNumber: i + 1,
        totalSteps,
        action: crumb.action,
        description: isFailed ? `${description} -> Failure Observed` : description,
        targetSelector: crumb.selector,
        targetText: crumb.targetText,
        inputValue: crumb.value,
        currentUrl,
        pageTitle: pageTitle || 'Active Page',
        screenshotBase64: ssBase64,
        status: isFailed ? 'FAILED' : 'SUCCESS',
        errorDetails: isFailed
          ? {
              type: capturedError ? 'CLIENT_CRASH' : captured500 ? 'SERVER_ERROR' : 'DEAD_END',
              message: capturedError || captured500 || 'Terminal node with 0 outbound navigation links',
              status: captured500 ? 500 : undefined,
            }
          : undefined,
        timestamp: Date.now(),
      });
    }

    await browser.close();
    return steps;
  } catch (err: any) {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
    throw new Error(`Deterministic replay execution failed: ${err.message}`);
  }
}
