'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  Check,
  ShieldCheck,
  LogOut,
  ArrowRight,
  Lock,
  Star,
  Cpu,
  Zap,
  Sliders,
  Sparkles,
  Info,
  X,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  reviewsCount: number;
  badge?: string;
  specs: string[];
  description: string;
  inStock: boolean;
  stockLeft?: number;
}

const PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Apex Pro Mechanical Keyboard v2',
    category: 'Hardware',
    price: 189,
    rating: 4.9,
    reviewsCount: 1420,
    badge: 'BESTSELLER',
    specs: ['8000Hz Polling', 'Hot-Swappable Gateron Oil Kings', 'CNC 6063 Aluminum'],
    description: 'Ultra-low latency tactile switches milled from solid aerospace aluminum with sound-dampening brass weight.',
    inStock: true,
    stockLeft: 4,
  },
  {
    id: 'prod-2',
    name: 'Ultra-Low Latency 4K Studio Display',
    category: 'Monitors',
    price: 749,
    rating: 4.8,
    reviewsCount: 890,
    badge: 'PRO TIER',
    specs: ['144Hz Fast IPS', '0.5ms GtG Response', 'Dual Thunderbolt 4 (96W PD)'],
    description: 'Color-calibrated reference monitor engineered for high-density code editing and CAD rendering.',
    inStock: true,
    stockLeft: 2,
  },
  {
    id: 'prod-3',
    name: 'Planar Magnetic Reference Headphones',
    category: 'Audio',
    price: 320,
    rating: 4.9,
    reviewsCount: 650,
    badge: 'AUDIOPHILE',
    specs: ['50mm Planar Drivers', 'Open-Back Velour', 'Zero Harmonic Distortion'],
    description: 'Acoustically transparent reference monitors delivering pinpoint spatial separation for deep focus sessions.',
    inStock: true,
  },
  {
    id: 'prod-4',
    name: 'Aero Carbon Ergonomic Task Chair',
    category: 'Furniture',
    price: 590,
    rating: 4.7,
    reviewsCount: 410,
    badge: 'ERGONOMIC',
    specs: ['Self-Adjusting Lumbar', 'Carbon Matrix Weave', '4D Milled Armrests'],
    description: 'Zero-pressure seating engineered to sustain posture during 12+ hour engineering sprints.',
    inStock: true,
    stockLeft: 7,
  },
  {
    id: 'prod-5',
    name: 'Thunderbolt 4 Pro Docking Matrix',
    category: 'Hardware',
    price: 249,
    rating: 4.8,
    reviewsCount: 520,
    specs: ['40Gbps Throughput', 'Triple 4K Displays', 'Dual 2.5GbE Ethernet'],
    description: 'Single-cable workstation command hub with dedicated power delivery and ultra-low jitter signal clocks.',
    inStock: true,
  },
  {
    id: 'prod-6',
    name: 'Precision CNC Micro-Weave Desk Mat',
    category: 'Furniture',
    price: 49,
    rating: 4.9,
    reviewsCount: 2100,
    badge: 'COMMUNITY FAVORITE',
    specs: ['Hydrophobic Coating', 'Non-Slip Natural Rubber', 'Laser-Etched Grid'],
    description: 'Low-friction tracking surface optimized for ultra-high DPI optical sensors.',
    inStock: true,
  },
];

export default function NovaStoreApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductModal, setSelectedProductModal] = useState<Product | null>(null);

  // Sign In Form States
  const [loginEmail, setLoginEmail] = useState('alex@novastore.internal');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('novastore_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u?.email) {
          setIsLoggedIn(true);
        }
      }
      const savedCart = localStorage.getItem('novastore_cart');
      if (savedCart) {
        const items = JSON.parse(savedCart);
        setCartCount(Array.isArray(items) ? items.length : 0);
      }
    } catch (e) {}
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError(null);

    if (!loginEmail || !loginPassword) {
      setAuthError('Email and password are required.');
      setIsSubmitting(false);
      return;
    }

    setTimeout(() => {
      const user = {
        email: loginEmail,
        name: 'Alex Mercer',
        role: 'Verified Buyer',
        token: 'auth_' + Math.random().toString(36).substring(2, 9),
      };

      try {
        localStorage.setItem('novastore_user', JSON.stringify(user));
      } catch (e) {}

      setIsSubmitting(false);
      setIsLoggedIn(true);
    }, 400);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('novastore_user');
    } catch (e) {}
    setIsLoggedIn(false);
  };

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
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // ========================================================
  // 1. FIRST PAGE: SIGN IN PAGE (WHEN NOT LOGGED IN)
  // ========================================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center p-4 selection:bg-zinc-800 font-sans">
        {/* Top Header */}
        <div className="mb-6 text-center max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-950 font-black flex items-center justify-center text-lg tracking-tighter mx-auto mb-3 shadow-xl">
            NV
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">NovaStore Gate</h1>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            High-Performance Developer Hardware & Workstations
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-sm bg-zinc-900/90 border border-zinc-800 rounded-xl p-6 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800 text-[11px] font-mono text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gated Access Protocol</span>
            </span>
            <span className="text-zinc-500">v2.4</span>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {authError && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-800 rounded text-xs font-mono text-rose-300">
                {authError}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                Engineer Email
              </label>
              <input
                id="login-email-input"
                name="email"
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="alex@novastore.internal"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-700"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-mono text-zinc-400">Security Key / Password</label>
                {/* BUG 1: Dead End navigation link */}
                <Link
                  id="link-forgot-password"
                  href="/demo-app/forgot-password"
                  className="text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-2"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="login-password-input"
                name="password"
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="password123"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-700"
              />
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-semibold text-xs font-mono rounded flex items-center justify-center gap-2 transition-colors cursor-pointer mt-2 shadow-md"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Store'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-zinc-800 text-[10px] font-mono text-zinc-500 text-center">
            Demo Credentials: <code>alex@novastore.internal</code> / <code>password123</code>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // 2. NEXT PAGE: STORE CATALOG (ONLY UNLOCKED ONCE SIGNED IN)
  // ========================================================
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-800">
      {/* Top Banner */}
      <div className="bg-zinc-900 border-b border-zinc-800 text-xs px-4 py-1.5 flex justify-between items-center text-zinc-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>AUTHENTICATED: Alex Mercer (Verified Buyer)</span>
        </div>
        <div className="hidden sm:flex gap-4 text-[11px]">
          <span>Free Express Dispatch over $150</span>
          <span>•</span>
          <span className="text-sky-400">BehaviorX Active Monitoring</span>
        </div>
      </div>

      {/* Main Navigation */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 sticky top-0 z-40 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/demo-app" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-950 font-black flex items-center justify-center text-sm tracking-tighter">
                NV
              </div>
              <div>
                <span className="font-bold tracking-tight text-zinc-100 text-base leading-none">NovaStore</span>
                <span className="block text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Engineering Gear</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-xs font-mono text-zinc-400">
              {['All', 'Hardware', 'Monitors', 'Audio', 'Furniture'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    selectedCategory === cat
                      ? 'text-zinc-100 bg-zinc-800 font-semibold'
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
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search gear or specs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 font-mono"
              />
            </div>

            {/* Authenticated Profile with Sign Out */}
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-zinc-200 font-mono text-[11px]">Alex M.</span>
              <button
                id="btn-logout"
                onClick={handleLogout}
                title="Sign out back to login page"
                className="text-zinc-400 hover:text-rose-400 ml-1 p-0.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            <Link
              id="nav-cart-btn"
              href="/demo-app/cart"
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-950 bg-zinc-100 hover:bg-zinc-200 font-semibold rounded-md transition-colors shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Cart</span>
              <span className="w-5 h-5 rounded-full bg-zinc-950 text-zinc-100 flex items-center justify-center text-[10px] font-bold">
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
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>PRODUCTION HARDWARE CATALOG</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-100 mb-3">
              Precision gear engineered for focus.
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6 font-sans">
              Tactile low-jitter keyboards, color-accurate fast IPS panels, and acoustically transparent planar drivers for engineers and creators.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/demo-app/cart"
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-bold rounded-md transition-colors font-mono"
              >
                View Cart ({cartCount})
              </Link>
              <button
                onClick={() => handleAddToCart(PRODUCTS[0])}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-zinc-100 text-xs font-mono rounded-md transition-colors"
              >
                + Quick Add: Apex Keyboard
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-zinc-800/80">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-100">Workstation Gear</h2>
            <p className="text-xs text-zinc-500 font-mono">Showing {filteredProducts.length} high-spec configurations</p>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2 py-0.5 rounded">
            All Items In Stock
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => {
            const isAdded = addedIds.includes(product.id);
            return (
              <div
                key={product.id}
                className="group bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all hover:shadow-xl"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between mb-3 text-[10px] font-mono">
                    <span className="text-zinc-500 uppercase tracking-wider">{product.category}</span>
                    {product.badge && (
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold">
                        {product.badge}
                      </span>
                    )}
                  </div>

                  {/* Product Title & Reviews */}
                  <h3 className="font-semibold text-base text-zinc-100 mb-1 group-hover:text-sky-300 transition-colors">
                    {product.name}
                  </h3>

                  <div className="flex items-center gap-1.5 mb-3 text-xs">
                    <div className="flex items-center text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="font-bold ml-1 text-zinc-200">{product.rating}</span>
                    </div>
                    <span className="text-zinc-500 text-[11px] font-mono">({product.reviewsCount} reviews)</span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    {product.description}
                  </p>

                  {/* Specs Chips */}
                  <div className="space-y-1.5 mb-4">
                    {product.specs.map((spec, sidx) => (
                      <div
                        key={sidx}
                        className="text-[10px] font-mono text-zinc-400 bg-zinc-950 px-2 py-1 rounded border border-zinc-800/80 flex items-center gap-1.5"
                      >
                        <Zap className="w-3 h-3 text-sky-400 flex-shrink-0" />
                        <span className="truncate">{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-zinc-500">MSRP</div>
                    <div className="font-bold text-lg text-zinc-100 font-mono">${product.price}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedProductModal(product)}
                      className="p-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                      title="View details"
                    >
                      <Info className="w-4 h-4" />
                    </button>

                    <button
                      id={`add-to-cart-${product.id}`}
                      onClick={() => handleAddToCart(product)}
                      className={`px-3.5 py-2 text-xs font-mono font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isAdded
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-950 shadow-sm'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Product Spec Modal */}
      {selectedProductModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedProductModal(null)}
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">
              {selectedProductModal.category}
            </div>
            <h3 className="text-xl font-bold text-zinc-100 mb-2">
              {selectedProductModal.name}
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              {selectedProductModal.description}
            </p>

            <div className="space-y-2 mb-6">
              <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">Technical Specifications</h4>
              {selectedProductModal.specs.map((sp, idx) => (
                <div key={idx} className="p-2 bg-zinc-950 border border-zinc-800 rounded text-xs font-mono text-zinc-300 flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-sky-400" />
                  <span>{sp}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <div className="font-mono text-xl font-bold text-zinc-100">
                ${selectedProductModal.price}
              </div>
              <button
                onClick={() => {
                  handleAddToCart(selectedProductModal);
                  setSelectedProductModal(null);
                }}
                className="px-4 py-2 bg-zinc-100 text-zinc-950 font-bold text-xs font-mono rounded hover:bg-zinc-200 transition-colors"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
