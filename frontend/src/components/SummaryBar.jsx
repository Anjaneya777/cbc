import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Filter,
  RefreshCw,
  Download,
  CheckSquare,
  ShieldAlert,
  ShieldCheck,
  Shield,
  HelpCircle,
  X
} from 'lucide-react';
import { getExportUrl } from '../services/api';

export default function SummaryBar({
  analysis,
  selectedCategory,
  setSelectedCategory,
  selectedSeverity,
  setSelectedSeverity,
  onReanalyze,
  isReanalyzing
}) {
  const [showScoringModal, setShowScoringModal] = useState(false);
  const { summary, contract_id, filename, findings } = analysis;

  // Determine overall risk level & score with backward compatibility
  const overallRisk = summary.overall_risk_level || (
    summary.high_count > 0 ? 'High' : (summary.medium_count > 0 || (summary.missing_items_count && summary.missing_items_count > 0) ? 'Medium' : 'Low')
  );
  
  const riskScore = summary.overall_risk_score !== undefined
    ? summary.overall_risk_score
    : Math.min(100, Math.max(0, (summary.high_count * 20) + (summary.medium_count * 8) + (summary.low_count * 2) + ((summary.missing_items_count || 0) * 10)));

  // Gather unique categories from findings
  const categories = ['All', ...Array.from(new Set(findings.map((f) => f.category)))];
  const reviewedCount = findings.filter((f) => f.review_status && f.review_status !== 'Unreviewed').length;

  // Styling config for the Overall Risk Indicator badge
  let overallBadge = {
    bg: 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
    bar: 'bg-rose-500',
    label: 'HIGH RISK CONTRACT',
    icon: <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
  };

  if (overallRisk === 'Medium') {
    overallBadge = {
      bg: 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300',
      dot: 'bg-amber-500',
      bar: 'bg-amber-500',
      label: 'MEDIUM RISK CONTRACT',
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
    };
  } else if (overallRisk === 'Low') {
    overallBadge = {
      bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500',
      bar: 'bg-emerald-500',
      label: 'LOW RISK CONTRACT',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
    };
  }

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        {/* Top Row: File info, Primary Overall Risk Indicator & Actions */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Left: Document info & Overall Risk Indicator */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="mr-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                Analyzed Document
              </span>
              <span
                className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-xs block"
                title={filename}
              >
                {filename}
              </span>
            </div>

            {/* PROMINENT CONTRACT RISK INDICATOR BADGE */}
            <div className="relative">
              <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border ${overallBadge.bg} shadow-sm`}>
                <div className="flex items-center gap-1.5 font-extrabold text-xs tracking-wide">
                  {overallBadge.icon}
                  <span>{overallBadge.label}</span>
                </div>
                <span className="text-[11px] opacity-70">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold font-mono">Score: {riskScore}/100</span>
                  <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full ${overallBadge.bar} transition-all duration-500`}
                      style={{ width: `${Math.max(5, riskScore)}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowScoringModal(!showScoringModal)}
                    className="p-0.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    title="How is this risk level and score counted? Click for calculation details"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[11px] opacity-70 hidden md:inline">•</span>
                <div className="hidden md:flex items-center gap-2 text-xs font-bold font-mono">
                  <span className="text-rose-600 dark:text-rose-400">{summary.high_count} High</span>
                  <span className="opacity-40">|</span>
                  <span className="text-amber-600 dark:text-amber-400">{summary.medium_count} Med</span>
                  <span className="opacity-40">|</span>
                  <span className="text-blue-600 dark:text-blue-400">{summary.low_count} Low</span>
                </div>
              </div>

              {/* Scoring Formula & Risk Level Criteria Popover */}
              {showScoringModal && (
                <div className="absolute z-30 mt-2 top-full left-0 w-80 sm:w-96 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                      How Risk Levels & Scores are Counted
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowScoringModal(false)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 text-slate-700 dark:text-slate-300">
                    <div className="p-2.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
                      <div className="flex items-center justify-between font-bold text-rose-700 dark:text-rose-300 mb-0.5">
                        <span>🔴 High Risk Contract</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-rose-200/50 dark:bg-rose-900/60">≥ 1 High OR Score ≥ 50</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-rose-800/90 dark:text-rose-300/90">
                        Triggered if there is <strong>even 1 High Risk clause</strong> (e.g. unilateral termination without cause, unlimited liability, steep penalties) or overall risk score reaches 50+.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50">
                      <div className="flex items-center justify-between font-bold text-amber-700 dark:text-amber-300 mb-0.5">
                        <span>🟡 Medium Risk Contract</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-200/50 dark:bg-amber-900/60">≥ 1 Med OR Score ≥ 20</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                        Triggered if there are <strong>1 or more Medium Risks</strong>, missing essential clauses, or risk score is 20–49 (with 0 High risks).
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50">
                      <div className="flex items-center justify-between font-bold text-emerald-700 dark:text-emerald-300 mb-0.5">
                        <span>🟢 Low Risk Contract</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-200/50 dark:bg-emerald-900/60">0 High & Score &lt; 20</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-emerald-800/90 dark:text-emerald-300/90">
                        Assigned when all standard safeguards exist, there are <strong>0 High risks</strong>, 0 Medium risks, and score stays below 20.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] space-y-1.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Point Formula (Max 100):
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                      <div className="p-1 rounded bg-slate-50 dark:bg-slate-800 flex justify-between">
                        <span>Each High Risk:</span>
                        <strong className="text-rose-600 dark:text-rose-400">+20 pts</strong>
                      </div>
                      <div className="p-1 rounded bg-slate-50 dark:bg-slate-800 flex justify-between">
                        <span>Each Med Risk:</span>
                        <strong className="text-amber-600 dark:text-amber-400">+8 pts</strong>
                      </div>
                      <div className="p-1 rounded bg-slate-50 dark:bg-slate-800 flex justify-between">
                        <span>Each Low Risk:</span>
                        <strong className="text-blue-600 dark:text-blue-400">+2 pts</strong>
                      </div>
                      <div className="p-1 rounded bg-slate-50 dark:bg-slate-800 flex justify-between">
                        <span>Missing Clause:</span>
                        <strong className="text-purple-600 dark:text-purple-400">+10 pts</strong>
                      </div>
                    </div>
                    <div className="mt-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 font-mono text-[11px] text-slate-800 dark:text-slate-200 font-semibold text-center">
                      Current Score: ({summary.high_count}×20) + ({summary.medium_count}×8) + ({summary.low_count}×2) + ({(summary.missing_items_count || 0)}×10) = <span className="text-brand-600 dark:text-brand-400 font-bold">{riskScore}/100</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Review Progress Tracker */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
              <span>Reviewed: {reviewedCount} / {findings.length}</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto">
            {/* Re-analyze Button */}
            <button
              onClick={onReanalyze}
              disabled={isReanalyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50"
              title="Re-run analysis against updated rules"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReanalyzing ? 'animate-spin text-brand-600' : ''}`} />
              <span>Re-analyze</span>
            </button>

            {/* Export Dropdown */}
            <div className="flex items-center gap-1">
              <a
                href={getExportUrl(contract_id, 'csv')}
                download={`contract_${contract_id}_review.csv`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </a>
              <a
                href={getExportUrl(contract_id, 'json')}
                download={`contract_${contract_id}_review.json`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all"
              >
                <span>JSON</span>
              </a>
            </div>
          </div>
        </div>

        {/* PROMINENT RISK SEVERITY BREAKDOWN KPI METRIC CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-1">
          {/* Total Risks Card */}
          <button
            type="button"
            onClick={() => setSelectedSeverity('All')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              selectedSeverity === 'All'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md ring-2 ring-slate-400/40'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
            title="Click to view all detected risks"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">Total Risks</span>
              <Shield className="w-4 h-4 opacity-70" />
            </div>
            <div className="text-2xl font-black font-mono leading-none">
              {findings.length}
            </div>
            <div className="text-[11px] opacity-75 mt-1.5 truncate">
              Across {categories.length - 1} categories
            </div>
          </button>

          {/* High Risks Card */}
          <button
            type="button"
            onClick={() => setSelectedSeverity(selectedSeverity === 'High' ? 'All' : 'High')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedSeverity === 'High'
                ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400 border-rose-600'
                : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 hover:border-rose-400 hover:shadow-sm text-slate-800 dark:text-slate-200'
            }`}
            title="Click to filter by High Risk"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${selectedSeverity === 'High' ? 'text-white' : 'text-rose-700 dark:text-rose-400'}`}>
                High Risks
              </span>
              <AlertCircle className={`w-4 h-4 ${selectedSeverity === 'High' ? 'text-white' : 'text-rose-600 dark:text-rose-400'}`} />
            </div>
            <div className={`text-2xl font-black font-mono leading-none ${selectedSeverity === 'High' ? 'text-white' : 'text-rose-600 dark:text-rose-400'}`}>
              {summary.high_count}
            </div>
            <div className={`text-[11px] mt-1.5 truncate ${selectedSeverity === 'High' ? 'text-rose-100' : 'text-rose-600/80 dark:text-rose-400/80 font-medium'}`}>
              Severe exposure • Legal focus
            </div>
          </button>

          {/* Medium Risks Card */}
          <button
            type="button"
            onClick={() => setSelectedSeverity(selectedSeverity === 'Medium' ? 'All' : 'Medium')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedSeverity === 'Medium'
                ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-400 border-amber-500'
                : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 hover:border-amber-400 hover:shadow-sm text-slate-800 dark:text-slate-200'
            }`}
            title="Click to filter by Medium Risk"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${selectedSeverity === 'Medium' ? 'text-white' : 'text-amber-700 dark:text-amber-400'}`}>
                Medium Risks
              </span>
              <AlertTriangle className={`w-4 h-4 ${selectedSeverity === 'Medium' ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`} />
            </div>
            <div className={`text-2xl font-black font-mono leading-none ${selectedSeverity === 'Medium' ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`}>
              {summary.medium_count}
            </div>
            <div className={`text-[11px] mt-1.5 truncate ${selectedSeverity === 'Medium' ? 'text-amber-100' : 'text-amber-600/80 dark:text-amber-400/80 font-medium'}`}>
              Moderate commercial obligations
            </div>
          </button>

          {/* Low Risks Card */}
          <button
            type="button"
            onClick={() => setSelectedSeverity(selectedSeverity === 'Low' ? 'All' : 'Low')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedSeverity === 'Low'
                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400 border-blue-600'
                : 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 hover:border-blue-400 hover:shadow-sm text-slate-800 dark:text-slate-200'
            }`}
            title="Click to filter by Low Risk"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${selectedSeverity === 'Low' ? 'text-white' : 'text-blue-700 dark:text-blue-400'}`}>
                Low Risks
              </span>
              <Info className={`w-4 h-4 ${selectedSeverity === 'Low' ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
            </div>
            <div className={`text-2xl font-black font-mono leading-none ${selectedSeverity === 'Low' ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`}>
              {summary.low_count}
            </div>
            <div className={`text-[11px] mt-1.5 truncate ${selectedSeverity === 'Low' ? 'text-blue-100' : 'text-blue-600/80 dark:text-blue-400/80 font-medium'}`}>
              Standard / advisory clauses
            </div>
          </button>

          {/* Missing Clauses Card */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-3.5 rounded-xl border bg-purple-50/80 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50 text-slate-800 dark:text-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                Missing Clauses
              </span>
              <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-black font-mono leading-none text-purple-600 dark:text-purple-400">
              {summary.missing_items_count !== undefined ? summary.missing_items_count : 0}
            </div>
            <div className="text-[11px] text-purple-600/80 dark:text-purple-400/80 font-medium mt-1.5 truncate">
              Standard safeguards omitted
            </div>
          </div>
        </div>

        {/* Bottom Row: Clear Risk Level Filter Buttons & Category Selection */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {/* Severity Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
              Filter by Risk:
            </span>

            {/* All Risks */}
            <button
              onClick={() => setSelectedSeverity('All')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedSeverity === 'All'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm ring-2 ring-slate-400/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Risks ({findings.length})
            </button>

            {/* High Risk Button */}
            <button
              onClick={() => setSelectedSeverity(selectedSeverity === 'High' ? 'All' : 'High')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedSeverity === 'High'
                  ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-400/40'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>High Risk ({summary.high_count})</span>
            </button>

            {/* Medium Risk Button */}
            <button
              onClick={() => setSelectedSeverity(selectedSeverity === 'Medium' ? 'All' : 'Medium')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedSeverity === 'Medium'
                  ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/40'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Medium Risk ({summary.medium_count})</span>
            </button>

            {/* Low Risk Button */}
            <button
              onClick={() => setSelectedSeverity(selectedSeverity === 'Low' ? 'All' : 'Low')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedSeverity === 'Low'
                  ? 'bg-blue-500 text-white shadow-sm ring-2 ring-blue-400/40'
                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Low Risk ({summary.low_count})</span>
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

