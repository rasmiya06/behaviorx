import { StateNode, StateNodeData } from '../types';

export function normalizePath(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.pathname;
  } catch {
    return urlStr;
  }
}

export function computeStateId(pathname: string, landmarks: string[]): string {
  const cleanPath = pathname.replace(/\/$/, '') || '/';
  const landmarkSignature = landmarks.slice(0, 3).join('_').replace(/[^a-zA-Z0-9]/g, '');
  const base = cleanPath.replace(/[^a-zA-Z0-9]/g, '_');
  return `state_${base}_${landmarkSignature || 'view'}`;
}

export function generateStateLabel(pathname: string, title?: string): string {
  // If the page has a real title, prioritize it!
  if (title && title.trim().length > 0 && title.length < 32) {
    return title.trim();
  }

  const clean = pathname.replace(/\/$/, '') || '/';
  if (clean === '/demo-app') return 'NovaStore Catalog';
  if (clean.includes('/cart')) return 'Cart';
  if (clean.includes('/checkout')) return 'Checkout';
  if (clean.includes('/forgot-password')) return 'Recovery Trap';
  if (clean.includes('/login') || clean.includes('/sign-in')) return 'Sign In';

  if (title && title.length < 50) return title.slice(0, 30);
  const parts = clean.split('/').filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1].toUpperCase() : 'Home';
}
