import React, { useState, useEffect } from 'react';
import DisclaimerBanner from './components/DisclaimerBanner';
import Navbar from './components/Navbar';
import UploadSection from './components/UploadSection';
import SummaryBar from './components/SummaryBar';
import FindingsList from './components/FindingsList';
import ContractViewer from './components/ContractViewer';
import MissingClausesCard from './components/MissingClausesCard';
import EdgeCasesCard from './components/EdgeCasesCard';
import RulesManager from './components/RulesManager';
import CompareSection from './components/CompareSection';
import { checkHealth, reanalyzeContract } from './services/api';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('analyze');
  const [darkMode, setDarkMode] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [errorMessage, setErrorMessage] = useState('');
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  // Synchronize dark mode class on HTML document root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Periodic health check
  useEffect(() => {
    const ping = async () => {
      try {
        await checkHealth();
        setApiOnline(true);
      } catch {
        setApiOnline(false);
      }
    };
    ping();
    const interval = setInterval(ping, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAnalysisSuccess = (data) => {
    setAnalysis(data);
    setSelectedFinding(data.findings && data.findings.length > 0 ? data.findings[0] : null);
    setSelectedCategory('All');
    setSelectedSeverity('All');
    setErrorMessage('');
  };

  const handleReviewUpdated = (findingId, newStatus, newNote, reviewedAt) => {
    if (!analysis) return;
    const updatedFindings = analysis.findings.map((f) => {
      if (f.id === findingId) {
        return {
          ...f,
          review_status: newStatus,
          reviewer_note: newNote,
          reviewed_at: reviewedAt || new Date().toISOString(),
        };
      }
      return f;
    });

    const reviewedCount = updatedFindings.filter((f) => f.review_status !== 'Unreviewed').length;

    setAnalysis({
      ...analysis,
      findings: updatedFindings,
      summary: {
        ...analysis.summary,
        reviewed_count: reviewedCount,
      },
    });

    if (selectedFinding && selectedFinding.id === findingId) {
      setSelectedFinding({
        ...selectedFinding,
        review_status: newStatus,
        reviewer_note: newNote,
      });
    }
  };

  const handleReanalyze = async () => {
    if (!analysis) return;
    setIsReanalyzing(true);
    try {
      const refreshed = await reanalyzeContract(analysis.contract_id);
      handleAnalysisSuccess(refreshed);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to reanalyze');
    } finally {
      setIsReanalyzing(false);
    }
  };

  // Filter findings according to active category and severity
  const filteredFindings = analysis
    ? analysis.findings.filter((f) => {
        const catMatch = selectedCategory === 'All' || f.category === selectedCategory;
        const sevMatch = selectedSeverity === 'All' || f.severity === selectedSeverity;
        return catMatch && sevMatch;
      })
    : [];

  // Automatically keep selected finding synchronized when filter changes
  useEffect(() => {
    if (filteredFindings.length > 0) {
      if (!selectedFinding || !filteredFindings.some((f) => f.id === selectedFinding.id)) {
        setSelectedFinding(filteredFindings[0]);
      }
    } else {
      setSelectedFinding(null);
    }
  }, [selectedCategory, selectedSeverity, analysis]);


  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* 1. Mandatory Non-Dismissible Legal Disclaimer Banner */}
      <DisclaimerBanner />

      {/* 2. Top Header & Tab Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        apiOnline={apiOnline}
      />

      {/* Global Error Alert */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto w-full px-4 pt-4">
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between text-rose-700 dark:text-rose-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-xs font-semibold underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Views */}
      <main className="flex-1">
        {/* Tab 1: Analyze Contract */}
        {activeTab === 'analyze' && (
          <div>
            {!analysis ? (
              <UploadSection
                onAnalysisSuccess={handleAnalysisSuccess}
                onError={(err) => setErrorMessage(err)}
              />
            ) : (
              <div>
                {/* Back to upload button & Summary Bar */}
                <div className="bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 px-4 py-2">
                  <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <button
                      onClick={() => setAnalysis(null)}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Upload Another Contract</span>
                    </button>
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: {analysis.contract_id}
                    </span>
                  </div>
                </div>

                <SummaryBar
                  analysis={analysis}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  selectedSeverity={selectedSeverity}
                  setSelectedSeverity={setSelectedSeverity}
                  onReanalyze={handleReanalyze}
                  isReanalyzing={isReanalyzing}
                />

                {/* Split Dual-Pane View */}
                <div className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column (5 cols): Findings Cards, Edge Cases, Missing Protections */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Edge Cases Alerts (Unusual Wording, Duplicates, No Match Safety Banner) */}
                    <EdgeCasesCard
                      edgeCases={analysis.edge_cases}
                      totalFindings={analysis.findings.length}
                    />

                    {/* Findings List */}
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          Detected Risk Indicators ({filteredFindings.length} of {analysis.findings.length})
                        </h3>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            {analysis.summary.high_count} High
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            {analysis.summary.medium_count} Medium
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            {analysis.summary.low_count} Low
                          </span>
                          {selectedCategory !== 'All' && (
                            <span className="text-[11px] text-brand-600 font-medium ml-1">
                              • {selectedCategory}
                            </span>
                          )}
                        </div>
                      </div>

                      <FindingsList
                        findings={filteredFindings}
                        selectedFindingId={selectedFinding?.id}
                        onSelectFinding={(f) => setSelectedFinding(f)}
                        onReviewUpdated={handleReviewUpdated}
                      />
                    </div>

                    {/* Missing Essential Clauses */}
                    <MissingClausesCard missingClauses={analysis.missing_clauses} />
                  </div>

                  {/* Right Column (7 cols): Full Interactive Contract Viewer with Highlights */}
                  <div className="lg:col-span-7 sticky top-20">
                    <ContractViewer
                      clauses={analysis.clauses}
                      findings={analysis.findings}
                      selectedFinding={selectedFinding}
                      onClauseClicked={(clause) => {
                        const match = analysis.findings.find((f) => f.clause_id === clause.clause_id);
                        if (match) setSelectedFinding(match);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Configurable Risk Rules */}
        {activeTab === 'rules' && (
          <RulesManager
            onRulesChanged={() => {
              if (analysis) handleReanalyze();
            }}
          />
        )}

        {/* Tab 3: Contract Comparison (Stretch) */}
        {activeTab === 'compare' && (
          <CompareSection currentAnalysis={analysis} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI-Based Contract Risk Indicator • Team Titans (Hackathon Problem 46)</span>
          <span className="text-[11px] text-slate-400">
            Powered by FastAPI, scikit-learn, React & Tailwind CSS
          </span>
        </div>
      </footer>
    </div>
  );
}
