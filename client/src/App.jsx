import React, { useState } from 'react';
import { LayoutGrid, TrendingUp, ShieldCheck, HelpCircle, Loader2, Sparkles, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Search from './components/Search';
import Matrix from './components/Matrix';
import DevInspector from './components/DevInspector';

function App() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [attributions, setAttributions] = useState(null);

  const API_BASE = import.meta.env.MODE === 'development' ? 'http://localhost:8787' : '';

  const handleSearch = async (courseName) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseName }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      
      setData(result.data);
      setMetadata(result.metadata);
      setAttributions(result.attributions);
    } catch (err) {
      setError(err.message);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-700/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -ml-40 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center p-2.5 shadow-lg shadow-cyan-500/10">
            <Sparkles className="w-full h-full text-white" />
          </div>
          <span className="text-xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent uppercase tracking-tight">
            EduBank <span className="text-cyan-400">PH</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-100 uppercase tracking-widest transition-colors">University Directory</a>
          <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-100 uppercase tracking-widest transition-colors">Financial Guide</a>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full relative z-10 space-y-20">
        <section className="text-center space-y-8 animate-in fade-in slide-in-from-top-6 duration-700">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-bold text-cyan-400 uppercase tracking-widest leading-none drop-shadow-sm">
                <Navigation className="w-3 h-3" />
                Philippine Higher Ed Budget Planner
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1]">
              Plan for the <br />
              <span className="gradient-text drop-shadow-[0_0_25px_rgba(34,211,238,0.2)]">Big 4 Future</span>
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
              Compare 2024-2025 tuition fees for UP, Ateneo, DLSU, and UST. 
              Grounded in real-time search data with AI-powered forecasting.
            </p>
          </div>

          <Search onSearch={handleSearch} isLoading={loading} />

          <div className="flex flex-wrap items-center justify-center gap-12 pt-8 opacity-60">
             <div className="flex flex-col items-center gap-1">
                <LayoutGrid className="w-5 h-5 text-slate-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Cross-Compare</span>
             </div>
             <div className="flex flex-col items-center gap-1">
                <TrendingUp className="w-5 h-5 text-slate-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">6% Inflation</span>
             </div>
             <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-5 h-5 text-slate-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Smart Grounding</span>
             </div>
          </div>
        </section>

        <AnimatePresence mode="wait">
          {loading && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 space-y-6"
            >
              <div className="relative">
                 <Loader2 className="w-16 h-16 animate-spin text-cyan-500 absolute inset-0" />
                 <Loader2 className="w-16 h-16 animate-spin text-indigo-500 blur-md opacity-50" />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">
                Fetching Real-Time 2024 Data...
              </p>
            </motion.div>
          )}

          {error && (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 border border-red-500/20 bg-red-500/5 rounded-3xl text-center space-y-2"
            >
              <HelpCircle className="w-8 h-8 text-red-500 mx-auto" />
              <h3 className="text-red-400 font-bold uppercase">Query Failed</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">{error}</p>
            </motion.div>
          )}

          {!loading && data && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Matrix data={data} attributions={attributions} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-12 border-t border-slate-900 bg-slate-950/50 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 grayscale opacity-30">
             <span className="text-lg font-black uppercase tracking-tight">EduBank PH</span>
          </div>
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">
            © 2026 EduBank PH. Built for Financial Transparency.
          </p>
        </div>
      </footer>

      <DevInspector metadata={metadata} />
    </div>
  );
}

export default App;
