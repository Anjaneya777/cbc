import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { listContracts, compareContracts, uploadContract } from '../services/api';

export default function CompareSection({ currentAnalysis }) {
  const [contracts, setContracts] = useState([]);
  const [c1Id, setC1Id] = useState('');
  const [c2Id, setC2Id] = useState('');
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState('');

  const fetchContractsList = async () => {
    try {
      const data = await listContracts();
      setContracts(data.contracts || []);
      if (data.contracts && data.contracts.length >= 2) {
        setC1Id(data.contracts[0].id);
        setC2Id(data.contracts[1].id);
      } else if (data.contracts && data.contracts.length === 1) {
        setC1Id(data.contracts[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchContractsList();
  }, [currentAnalysis]);

  const handleRunComparison = async () => {
    if (!c1Id || !c2Id) {
      setError('Please select two contracts to compare.');
      return;
    }
    if (c1Id === c2Id) {
      setError('Please select two distinct contracts for side-by-side comparison.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await compareContracts(c1Id, c2Id);
      setComparison(res);
    } catch (err) {
      setError(err.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickBenchmark = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch both sample files
      const f1Res = await fetch('/sample_contract.txt');
      const text1 = await f1Res.text();
      const file1 = new File([text1], 'sample_contract.txt', { type: 'text/plain' });
      const up1 = await uploadContract(file1);

      const f2Res = await fetch('/sample_contract_2.txt');
      const text2 = await f2Res.text();
      const file2 = new File([text2], 'sample_contract_2.txt', { type: 'text/plain' });
      const up2 = await uploadContract(file2);

      setC1Id(up1.contract_id);
      setC2Id(up2.contract_id);

      const comp = await compareContracts(up1.contract_id, up2.contract_id);
      setComparison(comp);
      await fetchContractsList();
    } catch (err) {
      setError(`Failed to run benchmark: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            Cross-Contract Risk Comparator (Stretch Goal)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Compare risk indicator counts, evidence differences, and missing protections side by side across two contracts.
          </p>
        </div>

        <button
          onClick={handleQuickBenchmark}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white shadow-sm transition-all disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>Benchmark Sample 1 vs Sample 2</span>
        </button>
      </div>

      {/* Contract Selectors Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Contract A (Base)
            </label>
            <select
              value={c1Id}
              onChange={(e) => setC1Id(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Select Contract A...</option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.filename} — {c.high_severity_findings || 0} High, {c.medium_severity_findings || 0} Med, {c.low_severity_findings || 0} Low ({c.total_findings} Total)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Contract B (Comparison)
            </label>
            <select
              value={c2Id}
              onChange={(e) => setC2Id(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Select Contract B...</option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.filename} — {c.high_severity_findings || 0} High, {c.medium_severity_findings || 0} Med, {c.low_severity_findings || 0} Low ({c.total_findings} Total)
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs border border-rose-200 dark:border-rose-900/40">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleRunComparison}
            disabled={loading || !c1Id || !c2Id}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitCompare className="w-4 h-4" />}
            <span>Compare Selected Contracts</span>
          </button>
        </div>
      </div>

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="bg-gradient-to-r from-brand-500/10 via-indigo-500/10 to-purple-500/10 border border-brand-500/20 rounded-2xl p-6">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              Executive Risk Assessment
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {comparison.risk_assessment}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-brand-500/20">
              <div className="bg-white/60 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate max-w-[200px]" title={comparison.contract_1_filename}>
                    Contract A: {comparison.contract_1_filename}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    comparison.summary_1.high_count > 0
                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                      : comparison.summary_1.medium_count > 0
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  }`}>
                    {comparison.summary_1.high_count > 0 ? 'HIGH RISK' : comparison.summary_1.medium_count > 0 ? 'MEDIUM RISK' : 'LOW RISK'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                  <span className="text-rose-600 dark:text-rose-400">{comparison.summary_1.high_count} High</span>
                  <span className="text-amber-600 dark:text-amber-400">{comparison.summary_1.medium_count} Med</span>
                  <span className="text-blue-600 dark:text-blue-400">{comparison.summary_1.low_count} Low</span>
                  <span className="text-slate-500 dark:text-slate-400">{comparison.summary_1.total_clauses} Clauses</span>
                </div>
              </div>

              <div className="bg-white/60 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate max-w-[200px]" title={comparison.contract_2_filename}>
                    Contract B: {comparison.contract_2_filename}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    comparison.summary_2.high_count > 0
                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                      : comparison.summary_2.medium_count > 0
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  }`}>
                    {comparison.summary_2.high_count > 0 ? 'HIGH RISK' : comparison.summary_2.medium_count > 0 ? 'MEDIUM RISK' : 'LOW RISK'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                  <span className="text-rose-600 dark:text-rose-400">{comparison.summary_2.high_count} High</span>
                  <span className="text-amber-600 dark:text-amber-400">{comparison.summary_2.medium_count} Med</span>
                  <span className="text-blue-600 dark:text-blue-400">{comparison.summary_2.low_count} Low</span>
                  <span className="text-slate-500 dark:text-slate-400">{comparison.summary_2.total_clauses} Clauses</span>
                </div>
              </div>
            </div>
          </div>

          {/* Missing Clauses Differences Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
              Essential Protections Discrepancies
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                    <th className="py-2 px-3 font-semibold">Clause Item</th>
                    <th className="py-2 px-3 font-semibold text-center">{comparison.contract_1_filename}</th>
                    <th className="py-2 px-3 font-semibold text-center">{comparison.contract_2_filename}</th>
                    <th className="py-2 px-3 font-semibold">Difference Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {Object.entries(comparison.missing_clauses_diff).map(([name, diff], idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">{name}</td>
                      <td className="py-2.5 px-3 text-center">
                        {diff.contract_1_present ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                            <CheckCircle2 className="w-4 h-4" /> Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-500 font-semibold">
                            <XCircle className="w-4 h-4" /> Missing
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {diff.contract_2_present ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                            <CheckCircle2 className="w-4 h-4" /> Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-500 font-semibold">
                            <XCircle className="w-4 h-4" /> Missing
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            diff.difference_status === 'Both Present'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : diff.difference_status === 'Both Missing'
                              ? 'bg-rose-500/10 text-rose-600'
                              : 'bg-amber-500/10 text-amber-600'
                          }`}
                        >
                          {diff.difference_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Side-by-Side Rules Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
              Triggered Risk Indicators Side-by-Side Breakdown ({comparison.rules_comparison.length} Rules Flagged)
            </h4>

            <div className="space-y-3">
              {comparison.rules_comparison.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{item.rule_name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {item.category}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.risk_delta === 'Contract 1 Higher'
                          ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          : item.risk_delta === 'Contract 2 Higher'
                          ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Delta: {item.risk_delta}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Contract A Matches */}
                    <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60">
                      <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                        <span className="text-slate-500">Contract A ({item.contract_1_matches} matches)</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {item.contract_1_clauses.join(', ') || 'None'}
                        </span>
                      </div>
                      {item.contract_1_quotes.length > 0 ? (
                        <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300 italic bg-amber-500/10 p-1.5 rounded">
                          "{item.contract_1_quotes[0]}"
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No violations detected</p>
                      )}
                    </div>

                    {/* Contract B Matches */}
                    <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60">
                      <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                        <span className="text-slate-500">Contract B ({item.contract_2_matches} matches)</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {item.contract_2_clauses.join(', ') || 'None'}
                        </span>
                      </div>
                      {item.contract_2_quotes.length > 0 ? (
                        <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300 italic bg-amber-500/10 p-1.5 rounded">
                          "{item.contract_2_quotes[0]}"
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No violations detected</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
