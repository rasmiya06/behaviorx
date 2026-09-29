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
  const clean = pathname.replace(/\/$/, '') || '/';
  if (clean === '/demo-app' || clean === '/') return 'Store Catalog';
  if (clean.includes('/cart')) return 'Shopping Cart';
  if (clean.includes('/checkout')) return 'Checkout Form';
  if (clean.includes('/forgot-password')) return 'Forgot Password Trap';
  
  if (title && title.length < 24) return title;
  const parts = clean.split('/').filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1].toUpperCase() : 'ROOT';
}
