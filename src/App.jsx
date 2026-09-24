import React, { useEffect, useState } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SafeZones from './pages/SafeZones';
import { Shield, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ShaderBackground from './components/ui/shader-background';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentRoute, setRoute] = useState('dashboard'); // 'dashboard' | 'safe-zones'

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff9fb] flex flex-col items-center justify-center gap-4 text-slate-800 relative overflow-hidden">
        <ShaderBackground />
        <div className="relative p-5 rounded-full bg-gradient-to-br from-[#f45b8d] to-[#db3f75] shadow-xl shadow-pink-200/70 z-10">
          <Shield className="w-9 h-9 text-white" />
        </div>
        <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-600 z-10 tracking-wide">
          <Loader2 className="w-4 h-4 animate-spin text-[#FF5F8A]" />
          <span>Initializing Guardian Sentinel System...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="light-guardian-theme relative min-h-screen overflow-hidden bg-[#fff9fb] text-slate-800">
        <ShaderBackground />
        <Login />
      </div>
    );
  }

  return (
    <div className="light-guardian-theme min-h-screen bg-[#fff9fb] text-slate-800 relative overflow-x-hidden selection:bg-[#f45b8d] selection:text-white flex flex-col">
      <ShaderBackground />

      {/* Header / Navbar */}
      <Navbar 
        currentRoute={currentRoute} 
        setRoute={setRoute} 
        user={user} 
      />

      {/* Main Body View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 pt-24 sm:pt-28 relative z-10">
        <AnimatePresence mode="wait">
          {currentRoute === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <Dashboard user={user} />
            </motion.div>
          ) : (
            <motion.div
              key="safe-zones"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <SafeZones user={user} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      {currentRoute !== 'safe-zones' && (
        <footer className="relative z-10 w-full px-4 pb-5 pt-2 sm:px-6 sm:pb-7">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 rounded-3xl border border-pink-100 bg-white/80 px-5 py-5 shadow-[0_14px_40px_rgba(151,67,99,0.10)] backdrop-blur-xl sm:flex-row sm:px-7">
            <div className="flex items-center gap-3 text-left">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-600 ring-1 ring-pink-100">
                <Shield className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-extrabold tracking-tight text-slate-900">Shrimati Setu</span>
                <span className="mt-0.5 block text-[11px] font-medium text-slate-500">Safety, connection and confidence.</span>
              </span>
            </div>
            <p className="text-center text-[11px] font-medium text-slate-500 sm:text-right">
              © {new Date().getFullYear()} Shrimati Setu. Guardian Emergency Console.
            </p>
          </div>
        </footer>
      )}

    </div>
  );
}
