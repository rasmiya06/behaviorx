'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, User, Search, Check, ShieldCheck, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  description: string;
  inStock: boolean;
}

const PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Apex Mechanical Keyboard v2',
    category: 'Hardware',
    price: 189,
    rating: 4.9,
    description: 'Hot-swappable tactile switches with milled aluminum chassis.',
    inStock: true,
  },
  {
    id: 'prod-2',
    name: 'Ultra-Low Latency 4K Monitor',
    category: 'Monitors',
    price: 749,
    rating: 4.8,
    description: '144Hz IPS display with dual Thunderbolt 4 passthrough.',
    inStock: true,
  },
  {
    id: 'prod-3',
    name: 'Studio Reference Headphones',
    category: 'Audio',
    price: 320,
    rating: 4.9,
    description: 'Planar magnetic drivers with zero-fatigue velour cushions.',
    inStock: true,
  },
  {
    id: 'prod-4',
    name: 'Ergonomic Aero Task Chair',
    category: 'Furniture',
    price: 590,
    rating: 4.7,
    description: 'Self-adjusting lumbar curve with breathable carbon weave.',
    inStock: true,
  },
];

export default function NovaStorePage() {
  const [cartCount, setCartCount] = useState(0);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('novastore_cart');
      if (saved) {
        const items = JSON.parse(saved);
        setCartCount(Array.isArray(items) ? items.length : 0);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleAddToCart = (product: Product) => {
    try {
      const saved = localStorage.getItem('novastore_cart');
      const items = saved ? JSON.parse(saved) : [];
      items.push(product);
      localStorage.setItem('novastore_cart', JSON.stringify(items));
      setCartCount(items.length);
      setAddedIds((prev) => [...prev, product.id]);
      setTimeout(() => {
        setAddedIds((prev) => prev.filter((id) => id !== product.id));
      }, 1500);
    } catch (e) {
      console.error('Failed to add to cart', e);
    }
  };

  const filteredProducts = PRODUCTS.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top Banner */}
      <div className="bg-zinc-900 border-b border-zinc-800 text-xs px-4 py-1.5 flex justify-between items-center text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>NovaStore Demo Target • Connected to BehaviorX Monitoring</span>
        </div>
        <div className="hidden sm:flex gap-4">
          <span>Same-day dispatch</span>
          <span>•</span>
          <span>Encrypted checkout</span>
        </div>
      </div>

      {/* Main Navigation */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 sticky top-0 z-40 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/demo-app" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-zinc-100 text-zinc-950 font-bold flex items-center justify-center text-sm tracking-tighter">
                NV
              </div>
              <span className="font-semibold tracking-tight text-zinc-100 text-base">NovaStore</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-sm text-zinc-400">
              {['All', 'Hardware', 'Monitors', 'Audio', 'Furniture'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    selectedCategory === cat
                      ? 'text-zinc-100 bg-zinc-800 font-medium'
                      : 'hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block w-48 lg:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
              />
            </div>

            <button
              id="btn-account-modal"
              onClick={() => setIsLoginOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 hover:text-zinc-100 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors"
            >
              <User className="w-3.5 h-3.5 text-zinc-400" />
              <span>Sign In</span>
            </button>

            <Link
              id="nav-cart-btn"
              href="/demo-app/cart"
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-100 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium rounded-md transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Cart</span>
              <span className="w-5 h-5 rounded-full bg-zinc-900 text-zinc-100 flex items-center justify-center text-[10px] font-bold">
                {cartCount}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-zinc-800 py-10 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900 text-[11px] text-zinc-400 mb-3 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>VERIFIED PRODUCTION SIMULATION</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-100 mb-3">
              Precision gear engineered for focus.
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Browse tactile hardware, high-refresh displays, and ergonomic workspaces. Designed for developers and architects.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/demo-app/cart"
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold rounded-md transition-colors"
              >
                Go to Cart ({cartCount})
              </Link>
              <button
                onClick={() => handleAddToCart(PRODUCTS[0])}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-zinc-100 text-xs font-medium rounded-md transition-colors"
              >
                Quick Add: Apex Keyboard
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-200">Featured Catalog</h2>
          <span className="text-xs text-zinc-500 font-mono">{filteredProducts.length} items available</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const isAdded = addedIds.includes(product.id);
            return (
              <div
                key={product.id}
                className="group bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-4 flex flex-col justify-between hover:border-zinc-700 transition-all"
              >
                <div>
                  <div className="h-36 w-full rounded bg-zinc-950 border border-zinc-800/60 flex items-center justify-center mb-3 text-zinc-600 font-mono text-xs group-hover:border-zinc-700 transition-colors">
                    [{product.category.toUpperCase()}_IMG]
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                    {product.category}
                  </div>
                  <h3 className="font-medium text-sm text-zinc-200 mb-1 group-hover:text-zinc-100">
                    {product.name}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
                    {product.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <div className="font-semibold text-sm text-zinc-100">
                    ${product.price}
                  </div>
                  <button
                    id={`add-to-cart-${product.id}`}
                    onClick={() => handleAddToCart(product)}
                    className={`px-3 py-1.5 text-xs font-medium rounded flex items-center gap-1.5 transition-colors ${
                      isAdded
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Login Modal (Houses Bug 1: Forgot Password Dead End link) */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-sm w-full p-6 shadow-2xl relative">
            <button
              id="close-login-modal"
              onClick={() => setIsLoginOpen(false)}
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-semibold text-zinc-100 mb-1">Account Login</h3>
            <p className="text-xs text-zinc-400 mb-4">Sign in to sync your orders and preferences.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="alex@example.com"
                  defaultValue="demo@novastore.internal"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-zinc-400">Password</label>
                  {/* BUG 1 TRIGGER: Navigates to dead end page */}
                  <Link
                    id="link-forgot-password"
                    href="/demo-app/forgot-password"
                    className="text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-2"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  defaultValue="••••••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <button
                id="btn-submit-login"
                onClick={() => setIsLoginOpen(false)}
                className="w-full mt-2 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold text-xs rounded transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
