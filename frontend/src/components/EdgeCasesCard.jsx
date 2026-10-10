import React from 'react';
import { AlertCircle, HelpCircle, Layers, ShieldCheck, FileWarning } from 'lucide-react';

export default function EdgeCasesCard({ edgeCases, totalFindings }) {
  if (!edgeCases) return null;

  const {
    unusual_terms_detected = [],
    duplicate_clauses_detected = [],
    no_match_found = false,
    no_match_message = ''
  } = edgeCases;

  return (
    <div className="space-y-4">
      {/* Edge Case 1: No Matching Risk Pattern Found */}
      {(no_match_found || totalFindings === 0) && (
        <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <FileWarning className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">
                No matching risk pattern found. This does not mean the contract is safe.
              </h4>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-1 leading-relaxed">
                {no_match_message ||
                  'The automated risk indicator did not trigger any default patterns on this contract. Subtle or non-standard provisions may still pose legal exposure. Manual review by qualified legal counsel is strongly recommended.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edge Case 2: Unusual Terminology / Rare Phrasing */}
      {unusual_terms_detected.length > 0 && (
        <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/50 text-slate-800 dark:text-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-200">
              Unusual Terminology Detected ({unusual_terms_detected.length})
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
              Review Manually
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
            Contains rare, archaic, or non-standard legal constructs that may alter standard liability or dispute terms:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {unusual_terms_detected.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{item.clause_heading}</span>
                  <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    {item.term}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono italic truncate" title={item.context_snippet}>
                  "{item.context_snippet}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edge Case 3: Duplicate Clauses in Multiple Sections */}
      {duplicate_clauses_detected.length > 0 && (
        <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/50 text-slate-800 dark:text-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h4 className="font-bold text-sm text-purple-900 dark:text-purple-200">
              Repeated Clauses Cross-Referenced ({duplicate_clauses_detected.length})
            </h4>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
            The following clauses have identical or near-identical text in multiple sections. Findings have been de-duplicated:
          </p>
          <div className="space-y-1.5">
            {duplicate_clauses_detected.map((dup, idx) => (
              <div
                key={idx}
                className="text-xs p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Primary: <code className="text-purple-600">{dup.primary_clause_id}</code>
                </span>
                <span className="text-slate-500">
                  Also appears in: {dup.duplicated_in.map((d) => d.heading || d.clause_id).join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
