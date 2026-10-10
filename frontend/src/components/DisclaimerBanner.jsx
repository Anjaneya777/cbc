import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export default function DisclaimerBanner() {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/25 px-4 py-2 text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>LEGAL DISCLAIMER:</strong> This tool highlights clauses for human review. It is not legal advice. Always consult qualified legal counsel.
          </span>
        </div>
        <span className="hidden md:inline-block px-2 py-0.5 rounded bg-amber-500/20 text-[10px] tracking-wide font-mono uppercase font-bold text-amber-700 dark:text-amber-300">
          Human-in-the-Loop AI
        </span>
      </div>
    </div>
  );
}
