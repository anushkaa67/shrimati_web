import React, { useEffect, useState } from 'react';
import { Shield, LogOut, Navigation, Radio, Menu, X } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function Navbar({ currentRoute, setRoute, user }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    const closeAtDesktopWidth = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', closeAtDesktopWidth);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeAtDesktopWidth);
    };
  }, [isMobileMenuOpen]);

  const handleMobileNavigation = (route) => {
    setRoute(route);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <header className="fixed inset-x-0 top-3 sm:top-4 z-40 px-3 sm:px-6 pointer-events-none">
      <div className="max-w-6xl mx-auto px-3 sm:px-5 h-16 flex items-center justify-between gap-2 rounded-full border border-pink-200/70 bg-white/55 backdrop-blur-2xl shadow-lg shadow-pink-200/30 transition-all pointer-events-auto">
        
        {/* Brand Header */}
        <div className="flex min-w-0 items-center gap-2">
          <div
            onClick={() => setRoute('dashboard')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-[#FF5F8A] via-pink-600 to-rose-500 shadow-lg shadow-[#FF5F8A]/30 group-hover:scale-105 group-hover:shadow-[#FF5F8A]/50 transition-all duration-300">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center">
                <h1 className="text-base sm:text-lg font-extrabold tracking-wide text-white group-hover:text-pink-200 transition-colors">
                  Shrimati Setu
                </h1>
              </div>
              <p className="text-[9px] sm:text-[10px] font-bold tracking-widest text-slate-400 uppercase hidden xs:block">
                Guardian Emergency Console
              </p>
            </div>
          </div>
        </div>

        {user && (
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="pointer-events-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-pink-200/80 bg-white/85 text-slate-700 shadow-sm transition-colors hover:bg-pink-50 hover:text-pink-600 md:hidden"
            aria-label="Open navigation menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation-menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        )}

        {/* Navigation & Logout Actions */}
        {user && (
          <div className="hidden items-center gap-2 sm:gap-3 shrink-0 md:flex">
            
            {/* Overview Tab */}
            <button
              onClick={() => setRoute('dashboard')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                currentRoute === 'dashboard'
                  ? 'bg-gradient-to-r from-[#FF5F8A] to-rose-500 text-white shadow-lg shadow-[#FF5F8A]/25 border border-white/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/10 border border-transparent'
              }`}
            >
              <Radio className={`w-4 h-4 ${currentRoute === 'dashboard' ? 'text-white' : 'text-[#FF5F8A]'}`} />
              <span className="inline">Overview</span>
            </button>

            {/* Safe Zones Tab */}
            <button
              onClick={() => setRoute('safe-zones')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                currentRoute === 'safe-zones'
                  ? 'bg-gradient-to-r from-rose-500 to-[#FF5F8A] text-white shadow-lg shadow-rose-500/25 border border-white/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/10 border border-transparent'
              }`}
            >
              <Navigation className={`w-4 h-4 ${currentRoute === 'safe-zones' ? 'text-white' : 'text-pink-500'}`} />
              <span className="inline">Safe Zones</span>
            </button>

            <div className="h-5 w-px bg-white/10 mx-1" />

            {/* Sign Out */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/30 transition-all active:scale-95"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}

      </div>

      {user && isMobileMenuOpen && (
        <div
          id="mobile-navigation-menu"
          className="pointer-events-auto fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <nav className="absolute inset-0 flex min-h-[100dvh] w-full flex-col overflow-hidden bg-white/82 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-2xl">
            <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-pink-200/45 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -right-28 bottom-20 h-80 w-80 rounded-full bg-rose-100/70 blur-3xl" aria-hidden="true" />

            <div className="relative flex items-center justify-between border-b border-pink-200/70 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF5F8A] to-rose-500 text-white shadow-md shadow-pink-200">
                  <Shield className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-extrabold tracking-wide text-slate-900">Shrimati Setu</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Navigation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-pink-50 hover:text-pink-600"
                aria-label="Close navigation menu"
                autoFocus
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-3 py-8">
              <button
                type="button"
                onClick={() => handleMobileNavigation('dashboard')}
                className={`flex w-full items-center gap-4 rounded-3xl border px-5 py-5 text-left text-base font-extrabold shadow-sm transition-all active:scale-[0.98] ${
                  currentRoute === 'dashboard'
                    ? 'border-pink-200 bg-pink-50/95 text-pink-700 shadow-pink-100'
                    : 'border-white/90 bg-white/85 text-slate-800 hover:border-pink-100 hover:bg-pink-50/60'
                }`}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-pink-600 shadow-sm">
                  <Radio className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block">Overview</span>
                  <span className="mt-0.5 block text-xs font-medium text-slate-500">Guardian dashboard and live telemetry</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleMobileNavigation('safe-zones')}
                className={`flex w-full items-center gap-4 rounded-3xl border px-5 py-5 text-left text-base font-extrabold shadow-sm transition-all active:scale-[0.98] ${
                  currentRoute === 'safe-zones'
                    ? 'border-pink-200 bg-pink-50/95 text-pink-700 shadow-pink-100'
                    : 'border-white/90 bg-white/85 text-slate-800 hover:border-pink-100 hover:bg-pink-50/60'
                }`}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-pink-600 shadow-sm">
                  <Navigation className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block">Safe Zone</span>
                  <span className="mt-0.5 block text-xs font-medium text-slate-500">Manage trusted geofence locations</span>
                </span>
              </button>
            </div>

            <div className="relative flex justify-center pt-4">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full max-w-xs items-center justify-center gap-2.5 rounded-full border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-extrabold text-red-600 shadow-sm transition-colors hover:bg-red-100 hover:text-red-700"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
                Logout
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
