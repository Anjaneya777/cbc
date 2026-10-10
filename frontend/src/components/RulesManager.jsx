import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Search,
  Check,
  X,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2
} from 'lucide-react';
import { getRules, createRule, updateRule, deleteRule, resetRules } from '../services/api';

export default function RulesManager({ onRulesChanged }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Termination');
  const [formSeverity, setFormSeverity] = useState('High');
  const [formPatternType, setFormPatternType] = useState('regex');
  const [formPatterns, setFormPatterns] = useState('');
  const [formExplanation, setFormExplanation] = useState('');

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await getRules();
      setRules(data);
    } catch (err) {
      alert(`Error loading rules: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleToggleEnabled = async (rule) => {
    try {
      const updated = await updateRule(rule.id, { enabled: !rule.enabled });
      setRules(rules.map((r) => (r.id === rule.id ? updated : r)));
      if (onRulesChanged) onRulesChanged();
    } catch (err) {
      alert(`Error toggling rule: ${err.message}`);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this risk indicator rule?')) return;
    try {
      await deleteRule(ruleId);
      setRules(rules.filter((r) => r.id !== ruleId));
      if (onRulesChanged) onRulesChanged();
    } catch (err) {
      alert(`Error deleting rule: ${err.message}`);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Reset all rules back to original system defaults (17 standard rules)?')) return;
    try {
      const res = await resetRules();
      setRules(res);
      if (onRulesChanged) onRulesChanged();
    } catch (err) {
      alert(`Error resetting rules: ${err.message}`);
    }
  };

  const openAddModal = () => {
    setEditingRule(null);
    setFormName('');
    setFormCategory('Termination');
    setFormSeverity('High');
    setFormPatternType('regex');
    setFormPatterns('');
    setFormExplanation('');
    setModalOpen(true);
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormCategory(rule.category);
    setFormSeverity(rule.severity);
    setFormPatternType(rule.pattern_type);
    setFormPatterns(rule.patterns.join('\n'));
    setFormExplanation(rule.explanation);
    setModalOpen(true);
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    const patternList = formPatterns
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);

    if (patternList.length === 0) {
      alert('Please provide at least one pattern or keyword.');
      return;
    }

    try {
      if (editingRule) {
        const updated = await updateRule(editingRule.id, {
          name: formName,
          category: formCategory,
          severity: formSeverity,
          pattern_type: formPatternType,
          patterns: patternList,
          explanation: formExplanation,
        });
        setRules(rules.map((r) => (r.id === editingRule.id ? updated : r)));
      } else {
        const created = await createRule({
          name: formName,
          category: formCategory,
          severity: formSeverity,
          pattern_type: formPatternType,
          patterns: patternList,
          enabled: true,
          explanation: formExplanation,
        });
        setRules([...rules, created]);
      }
      setModalOpen(false);
      if (onRulesChanged) onRulesChanged();
    } catch (err) {
      alert(`Error saving rule: ${err.message}`);
    }
  };

  const categories = ['All', ...Array.from(new Set(rules.map((r) => r.category)))];

  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.explanation.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            Configurable Risk Indicators
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage patterns, severity tiers, and plain-language risk explanations. Edits apply immediately to re-analysis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Rule</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search rules or explanations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rules List / Table */}
      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading risk rules...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRules.map((rule) => {
            let badgeClass = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
            let icon = <Info className="w-3 h-3" />;
            if (rule.severity === 'High') {
              badgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
              icon = <AlertCircle className="w-3 h-3" />;
            } else if (rule.severity === 'Medium') {
              badgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
              icon = <AlertTriangle className="w-3 h-3" />;
            }

            return (
              <div
                key={rule.id}
                className={`p-4 rounded-xl border bg-white dark:bg-slate-900 transition-all ${
                  rule.enabled
                    ? 'border-slate-200 dark:border-slate-800 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50 dark:bg-slate-950'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                        {icon}
                        {rule.severity} Risk
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                        {rule.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{rule.name}</h3>
                  </div>

                  {/* Toggle Active Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleToggleEnabled(rule)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                  {rule.explanation}
                </p>

                <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800/60 text-[11px] font-mono text-slate-700 dark:text-slate-300 mb-3 overflow-x-auto">
                  <span className="text-[10px] text-slate-400 font-sans block mb-0.5">
                    Pattern ({rule.pattern_type}):
                  </span>
                  {rule.patterns.slice(0, 2).map((p, i) => (
                    <div key={i} className="truncate" title={p}>
                      • {p}
                    </div>
                  ))}
                  {rule.patterns.length > 2 && (
                    <span className="text-[10px] text-slate-400 font-sans">
                      +{rule.patterns.length - 2} more patterns
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                  <button
                    onClick={() => openEditModal(rule)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors"
                    title="Edit rule"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors"
                    title="Delete rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingRule ? 'Edit Risk Indicator' : 'Add New Risk Indicator'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Short Notice Period"
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {[
                      'Termination',
                      'Payment',
                      'Penalties',
                      'Renewal',
                      'Liability',
                      'Indemnity',
                      'Confidentiality',
                      'IP',
                      'Non-compete/Exclusivity',
                      'Governing law/Disputes',
                      'Unilateral changes',
                      'Data/Privacy',
                    ].map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Severity
                  </label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="High">High Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="Low">Low Risk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pattern Type
                </label>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="ptype"
                      value="regex"
                      checked={formPatternType === 'regex'}
                      onChange={() => setFormPatternType('regex')}
                    />
                    <span>Regular Expression (Regex)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="ptype"
                      value="keyword"
                      checked={formPatternType === 'keyword'}
                      onChange={() => setFormPatternType('keyword')}
                    />
                    <span>Keyword List</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Patterns (one per line)
                </label>
                <textarea
                  rows={3}
                  required
                  value={formPatterns}
                  onChange={(e) => setFormPatterns(e.target.value)}
                  placeholder="(?i)terminate.{0,30}sole discretion"
                  className="w-full font-mono text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Plain-Language Risk Explanation
                </label>
                <textarea
                  rows={2}
                  required
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Explain clearly why this clause presents business or operational risk..."
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
                >
                  Save Indicator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
