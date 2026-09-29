'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, Tag, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  category: string;
  price: number;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoSuccess, setPromoSuccess] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('novastore_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
          return;
        }
      }
      // Default fallback item if empty so user can proceed
      setItems([
        {
          id: 'prod-1',
          name: 'Apex Mechanical Keyboard v2',
          category: 'Hardware',
          price: 189,
        },
      ]);
    } catch (e) {
      setItems([]);
    }
  }, []);

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    localStorage.setItem('novastore_cart', JSON.stringify(updated));
  };

  const handleApplyPromo = () => {
    const cleanPromo = promoCode.trim().toUpperCase();

    // BUG 2: CLIENT RUNTIME CRASH
    // If the promoCode is 'CRASH', empty, or promoData is uninitialized:
    // Calling (window as any).promoData.calculateDiscount() throws Uncaught TypeError:
    // "Cannot read properties of undefined (reading 'calculateDiscount')"
    if (cleanPromo === 'CRASH' || cleanPromo === '' || items.length === 0) {
      console.warn('[Cart] Executing discount processor for promo code:', cleanPromo);
      // Intentionally unhandled runtime exception:
      const discount = (window as any).promoData.calculateDiscount();
      console.log('Discount applied:', discount);
      return;
    }

    if (cleanPromo === 'SAVE10') {
      setPromoSuccess(true);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Nav */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-zinc-800">
          <Link
            id="link-back-to-store"
            href="/demo-app"
            className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK_TO_CATALOG</span>
          </Link>
          <div className="text-xs font-mono text-zinc-500">
            SESSION_ID: <span className="text-zinc-300">NS-9042</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-100 flex items-center justify-between">
              <span>Shopping Cart</span>
              <span className="text-xs font-mono text-zinc-500 font-normal">{items.length} items</span>
            </h1>

            {items.length === 0 ? (
              <div className="p-8 border border-dashed border-zinc-800 rounded-lg text-center">
                <p className="text-xs text-zinc-400 mb-4">Your cart is currently empty.</p>
                <Link
                  href="/demo-app"
                  className="px-4 py-2 bg-zinc-100 text-zinc-950 text-xs font-medium rounded"
                >
                  Browse Store
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <div className="text-[11px] font-mono text-zinc-500 uppercase">{item.category}</div>
                      <div className="text-sm font-medium text-zinc-200">{item.name}</div>
                      <div className="text-xs font-mono text-zinc-400 mt-1">${item.price}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary & Promo Code Section */}
          <div className="space-y-6">
            <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-lg">
              <h2 className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-4">
                Order Summary
              </h2>

              <div className="space-y-2 text-xs text-zinc-400 pb-4 border-b border-zinc-800 font-mono">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-zinc-200">${subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax</span>
                  <span className="text-zinc-200">${tax}</span>
                </div>
                <div className="flex justify-between text-zinc-200 font-semibold pt-2 border-t border-zinc-800/60">
                  <span>Total</span>
                  <span className="text-sm text-zinc-100">${total}</span>
                </div>
              </div>

              {/* Promo Code Box (BUG 2 LOCATION) */}
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <label className="block text-xs font-mono text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Promo Code</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="promo-code-input"
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter code (or 'CRASH')"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono uppercase focus:outline-none focus:border-zinc-700"
                  />
                  <button
                    id="btn-apply-promo"
                    onClick={handleApplyPromo}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-mono text-zinc-200 rounded transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {promoSuccess && (
                  <p className="text-[11px] text-emerald-400 mt-2 font-mono">
                    ✓ Promo SAVE10 applied (10% off)
                  </p>
                )}
                <div className="mt-2 text-[10px] text-zinc-500 font-mono">
                  * Tip: Click Apply without code or 'CRASH' to test Bug 2
                </div>
              </div>

              {/* Checkout CTA */}
              <Link
                id="btn-proceed-checkout"
                href="/demo-app/checkout"
                className="mt-6 w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold rounded flex items-center justify-center gap-2 transition-colors"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
