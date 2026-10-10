import React from 'react';
import { ShieldCheck, FileText, Sliders, GitCompare, Sun, Moon, CheckCircle, XCircle } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, darkMode, setDarkMode, apiOnline }) {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Titans RiskIndicator
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold border border-brand-500/20">
                v1.0
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              AI-Assisted Contract Clause Risk Scanner
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('analyze')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'analyze'
                ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Analyze</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'rules'
                ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Risk Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'compare'
                ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            <span>Compare</span>
          </button>
        </nav>

        {/* Status & Dark Mode Toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            {apiOnline ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Backend Live
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Backend Offline
              </span>
            )}
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle theme"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
}
