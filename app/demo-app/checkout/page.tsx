'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';

export default function CheckoutPage() {
  const [formData, setFormData] = useState({
    name: 'Alex Mercer',
    email: 'alex@novastore.internal',
    street: '742 Evergreen Terrace',
    city: 'Springfield',
    // Deliberately default to '00000' or blank to trigger Bug 3 in autonomous crawl
    postalCode: '00000',
    cardNumber: '4242 •••• •••• 4242',
    expDate: '12/28',
    cvv: '912',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCompletePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNetworkError(null);

    try {
      // POST request to mock-target checkout API
      const res = await fetch('/api/mock-target/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postalCode: formData.postalCode,
          name: formData.name,
          email: formData.email,
        }),
      });

      if (!res.ok) {
        // BUG 3 BEHAVIOR:
        // When HTTP 500 happens, the UI intentionally DOES NOT catch or render an alert,
        // and keeps isSubmitting=true so the spinner spins forever, stranding the user.
        console.error('[Checkout] POST /api/mock-target/checkout failed with status:', res.status);
        // We do NOT call setIsSubmitting(false) to simulate the broken UI deadlock bug:
        return;
      }

      const data = await res.json();
      setIsSubmitting(false);
      setOrderSuccess(true);
    } catch (err: any) {
      console.error('[Checkout] Network unhandled error:', err);
      // Deliberately don't show alert to mimic silent spin deadlock
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md w-full p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Order Confirmed</h1>
          <p className="text-xs text-zinc-400 mb-6">
            Your transaction was processed successfully.
          </p>
          <Link
            href="/demo-app"
            className="px-4 py-2 bg-zinc-100 text-zinc-950 text-xs font-semibold rounded"
          >
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-zinc-800">
          <Link
            id="link-back-to-cart"
            href="/demo-app/cart"
            className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RETURN_TO_CART</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-BIT_ENCRYPTED_FLOW</span>
          </div>
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-zinc-100 mb-6">
          Checkout & Dispatch
        </h1>

        <form onSubmit={handleCompletePurchase} className="space-y-6">
          {/* Shipping Details */}
          <div className="p-5 bg-zinc-900/70 border border-zinc-800 rounded-lg space-y-4">
            <h2 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              1. Shipping Address
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Full Name</label>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-zinc-400 mb-1">Street Address</label>
                <input
                  name="street"
                  type="text"
                  value={formData.street}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">City</label>
                <input
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>
              <div>
                {/* POSTAL CODE INPUT (BUG 3 TRIGGER POINT) */}
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-zinc-400 font-mono">Postal Code</label>
                  <span className="text-[10px] text-zinc-500 font-mono">triggers 500 if '00000' or blank</span>
                </div>
                <input
                  id="checkout-postal-code"
                  name="postalCode"
                  type="text"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  placeholder="00000"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-700"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="p-5 bg-zinc-900/70 border border-zinc-800 rounded-lg space-y-4">
            <h2 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              2. Payment Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs text-zinc-400 mb-1">Card Number</label>
                <input
                  name="cardNumber"
                  type="text"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-700"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">CVV</label>
                <input
                  name="cvv"
                  type="text"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-700"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              id="btn-complete-purchase"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 text-xs font-semibold rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                  <span className="font-mono">AUTHORIZING_TRANSACTION...</span>
                </>
              ) : (
                <span>Complete Purchase ($204.00)</span>
              )}
            </button>
            <p className="text-[11px] text-zinc-500 text-center mt-2 font-mono">
              Pressing Complete Purchase sends POST /api/mock-target/checkout
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
