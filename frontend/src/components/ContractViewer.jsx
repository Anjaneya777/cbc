import React, { useEffect, useRef } from 'react';
import { FileText, Eye, CheckCircle2, Bookmark } from 'lucide-react';

export default function ContractViewer({
  clauses,
  findings,
  selectedFinding,
  onClauseClicked
}) {
  const clauseRefs = useRef({});

  // Auto-scroll to clause when finding changes
  useEffect(() => {
    if (selectedFinding && selectedFinding.clause_id) {
      const el = clauseRefs.current[selectedFinding.clause_id];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedFinding]);

  // Map findings to clauses for highlighting
  const findingsByClause = {};
  findings.forEach((f) => {
    if (!findingsByClause[f.clause_id]) {
      findingsByClause[f.clause_id] = [];
    }
    findingsByClause[f.clause_id].push(f);
  });

  const renderHighlightedText = (clause, clauseFindings) => {
    const fullText = clause.full_text;
    if (!clauseFindings || clauseFindings.length === 0) {
      return <span>{fullText}</span>;
    }

    // Collect all evidence quotes to highlight
    const quotes = clauseFindings.map((f) => ({
      quote: f.evidence_quote,
      severity: f.severity,
      isSelected: selectedFinding && selectedFinding.id === f.id,
      ruleName: f.rule_name,
    }));

    // Find occurrences in text
    let segments = [];
    let lastIdx = 0;

    // Find all quote matches
    const matches = [];
    quotes.forEach((q) => {
      const pos = fullText.indexOf(q.quote);
      if (pos !== -1) {
        matches.push({
          start: pos,
          end: pos + q.quote.length,
          severity: q.severity,
          isSelected: q.isSelected,
          ruleName: q.ruleName,
        });
      }
    });

    // Sort matches by start position
    matches.sort((a, b) => a.start - b.start);

    // Build rendered text segments
    matches.forEach((m, i) => {
      if (m.start > lastIdx) {
        segments.push(
          <span key={`text-${lastIdx}`}>{fullText.slice(lastIdx, m.start)}</span>
        );
      }

      let highlightClass =
        'bg-amber-300/40 text-amber-950 dark:bg-amber-500/30 dark:text-amber-100 border-b-2 border-amber-500 font-medium px-1 rounded';
      if (m.severity === 'High') {
        highlightClass =
          'bg-rose-300/50 text-rose-950 dark:bg-rose-500/30 dark:text-rose-100 border-b-2 border-rose-500 font-semibold px-1 rounded';
      } else if (m.severity === 'Low') {
        highlightClass =
          'bg-blue-300/40 text-blue-950 dark:bg-blue-500/30 dark:text-blue-100 border-b-2 border-blue-500 font-medium px-1 rounded';
      }

      if (m.isSelected) {
        highlightClass += ' ring-2 ring-brand-500 ring-offset-1 dark:ring-offset-slate-900';
      }

      segments.push(
        <mark
          key={`match-${i}`}
          title={`Detected by rule: ${m.ruleName} (${m.severity} Risk)`}
          className={highlightClass}
        >
          {fullText.slice(m.start, m.end)}
        </mark>
      );

      lastIdx = Math.max(lastIdx, m.end);
    });

    if (lastIdx < fullText.length) {
      segments.push(<span key={`text-end`}>{fullText.slice(lastIdx)}</span>);
    }

    return segments;
  };

  const highRiskCount = findings.filter((f) => f.severity === 'High').length;
  const medRiskCount = findings.filter((f) => f.severity === 'Medium').length;
  const lowRiskCount = findings.filter((f) => f.severity === 'Low').length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Contract Clause Viewer
          </h3>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
            {clauses.length} clauses parsed
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold border border-rose-500/20">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> High Risk ({highRiskCount})
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Medium Risk ({medRiskCount})
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold border border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Low Risk ({lowRiskCount})
          </span>
        </div>
      </div>

      <div className="space-y-6 max-h-[750px] overflow-y-auto pr-2">
        {clauses.map((clause, idx) => {
          const clauseFindings = findingsByClause[clause.clause_id] || [];
          const isFocused = selectedFinding && selectedFinding.clause_id === clause.clause_id;

          return (
            <div
              key={clause.clause_id}
              ref={(el) => (clauseRefs.current[clause.clause_id] = el)}
              id={`clause-${clause.clause_id}`}
              onClick={() => onClauseClicked && onClauseClicked(clause)}
              className={`p-4 rounded-xl transition-all border ${
                isFocused
                  ? 'clause-focused bg-brand-50/20 dark:bg-brand-950/20 border-brand-500 dark:border-brand-500 shadow-md'
                  : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Clause Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    {clause.clause_id}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {clause.heading}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium">
                    {clause.category}
                  </span>
                  {clauseFindings.length > 0 && (
                    <div className="flex items-center gap-1">
                      {clauseFindings.some((f) => f.severity === 'High') && (
                        <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/25">
                          High Risk
                        </span>
                      )}
                      {clauseFindings.some((f) => f.severity === 'Medium') && (
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/25">
                          Med Risk
                        </span>
                      )}
                      {clauseFindings.some((f) => f.severity === 'Low') && (
                        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/25">
                          Low Risk
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Clause Body with Exact Sentence Highlights */}
              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                {renderHighlightedText(clause, clauseFindings)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
