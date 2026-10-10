import React from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function MissingClausesCard({ missingClauses }) {
  if (!missingClauses || missingClauses.length === 0) return null;

  const missingCount = missingClauses.filter((m) => !m.is_present).length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
            Missing Essential Protection Audit
          </h3>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            missingCount > 0
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
          }`}
        >
          {missingCount === 0 ? 'All 7 Standard Clauses Present' : `${missingCount} Critical Clauses Missing`}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {missingClauses.map((item, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border text-xs transition-colors ${
              item.is_present
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-slate-700 dark:text-slate-300'
                : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 font-bold">
                {item.is_present ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <span className={item.is_present ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}>
                  {item.item_name}
                </span>
              </div>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                  item.is_present
                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'
                }`}
              >
                {item.is_present ? 'Present' : `${item.severity} Risk`}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed pl-5">
              {item.rationale}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
