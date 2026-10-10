import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  MinusCircle,
  ExternalLink,
  Save,
  Layers,
  Quote,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { reviewFinding } from '../services/api';

export default function FindingsList({
  findings,
  selectedFindingId,
  onSelectFinding,
  onReviewUpdated
}) {
  const [activeNotes, setActiveNotes] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const handleStatusChange = async (finding, newStatus) => {
    setSavingId(finding.id);
    const note = activeNotes[finding.id] !== undefined ? activeNotes[finding.id] : finding.reviewer_note;
    try {
      const res = await reviewFinding(finding.id, newStatus, note);
      onReviewUpdated(finding.id, newStatus, note, res.reviewed_at);
    } catch (err) {
      alert(`Error saving review: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveNote = async (finding) => {
    setSavingId(finding.id);
    const note = activeNotes[finding.id] || '';
    try {
      const res = await reviewFinding(finding.id, finding.review_status, note);
      onReviewUpdated(finding.id, finding.review_status, note, res.reviewed_at);
    } catch (err) {
      alert(`Error saving note: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  };

  if (!findings || findings.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <Info className="w-6 h-6" />
        </div>
        <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">No findings match this filter</h4>
        <p className="text-xs text-slate-500 mt-1">Try selecting 'All' severities or categories.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {findings.map((f) => {
        const isSelected = selectedFindingId === f.id;
        const currentNote = activeNotes[f.id] !== undefined ? activeNotes[f.id] : (f.reviewer_note || '');

        // Severity styling
        let badgeColor = 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30';
        let badgeIcon = <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
        let borderColor = 'border-slate-200 dark:border-slate-800';

        if (f.severity === 'High') {
          badgeColor = 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
          badgeIcon = <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
          if (isSelected) borderColor = 'border-rose-500 dark:border-rose-500 ring-2 ring-rose-500/20';
        } else if (f.severity === 'Medium') {
          badgeColor = 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
          badgeIcon = <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
          if (isSelected) borderColor = 'border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/20';
        } else {
          if (isSelected) borderColor = 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20';
        }

        return (
          <div
            key={f.id}
            id={`card-${f.id}`}
            onClick={() => onSelectFinding(f)}
            className={`rounded-xl bg-white dark:bg-slate-900 border p-4 sm:p-5 transition-all shadow-sm hover:shadow-md cursor-pointer ${borderColor} ${
              isSelected ? 'scale-[1.008]' : ''
            }`}
          >
            {/* Header: Severity, Rule Name & Category */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}>
                  {badgeIcon}
                  {f.severity.toUpperCase()} RISK
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                  {f.category}
                </span>
              </div>

              {/* Clause Heading Anchor */}
              <div className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline">
                <span>{f.clause_heading}</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>

            {/* Rule Name */}
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              {f.rule_name}
            </h3>

            {/* Plain-Language Explanation */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              {f.explanation}
            </p>

            {/* Verifiable Evidence Quote Box */}
            <div className="bg-slate-50 dark:bg-slate-950/60 rounded-lg p-3 border-l-4 border-brand-500 mb-3 text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
                <span className="flex items-center gap-1">
                  <Quote className="w-3 h-3" /> Exact Source Evidence
                </span>
                <span className="font-mono text-[10px]">
                  chars {f.start_char}–{f.end_char}
                </span>
              </div>
              <p className="font-mono text-slate-800 dark:text-slate-200 leading-normal italic bg-amber-500/10 px-1.5 py-1 rounded border border-amber-500/20">
                "{f.evidence_quote}"
              </p>
            </div>

            {/* Edge Case: De-duplication References ("Also appears in clauses...") */}
            {f.also_appears_in && f.also_appears_in.length > 0 && (
              <div className="mb-3 flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/40">
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>
                  <strong>Also appears in:</strong>{' '}
                  {f.also_appears_in.map((dup) => dup.heading || dup.clause_id).join(', ')}
                </span>
              </div>
            )}

            {/* Human Review Section */}
            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Human Classification:
                </span>
                {f.review_status && f.review_status !== 'Unreviewed' && (
                  <span className="text-[11px] text-slate-400">
                    Status:{' '}
                    <strong className="text-slate-700 dark:text-slate-300">{f.review_status}</strong>
                  </span>
                )}
              </div>

              {/* Three Review Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(f, 'Confirmed risk');
                  }}
                  disabled={savingId === f.id}
                  className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    f.review_status === 'Confirmed risk'
                      ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400/50'
                      : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/40'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Confirm Risk</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(f, 'Needs legal review');
                  }}
                  disabled={savingId === f.id}
                  className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    f.review_status === 'Needs legal review'
                      ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/50'
                      : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-900/40'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Needs Legal</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(f, 'Not a concern');
                  }}
                  disabled={savingId === f.id}
                  className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    f.review_status === 'Not a concern'
                      ? 'bg-slate-700 dark:bg-slate-300 text-white dark:text-slate-900 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <MinusCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Not a Concern</span>
                </button>
              </div>

              {/* Reviewer Note Input */}
              <div className="mt-2.5 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  placeholder="Add human reviewer note / reasoning..."
                  value={currentNote}
                  onChange={(e) => setActiveNotes({ ...activeNotes, [f.id]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveNote(f);
                  }}
                  className="flex-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => handleSaveNote(f)}
                  disabled={savingId === f.id}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-medium transition-colors"
                  title="Save note"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
