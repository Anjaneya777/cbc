import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, BookOpen } from 'lucide-react';
import { uploadContract } from '../services/api';

export default function UploadSection({ onAnalysisSuccess, onError }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [useLlm, setUseLlm] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileProcess = async (file) => {
    if (!file) return;
    setIsLoading(true);
    setLoadingStep('Extracting document & parsing clauses...');

    try {
      const result = await uploadContract(file, useLlm);
      onAnalysisSuccess(result);
    } catch (err) {
      onError(err.message || 'Error processing contract');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const loadSampleContract = async (sampleNum = 1) => {
    setIsLoading(true);
    setLoadingStep(`Loading realistic sample contract #${sampleNum}...`);

    try {
      const filename = sampleNum === 1 ? 'sample_contract.txt' : 'sample_contract_2.txt';
      let text = '';
      try {
        const response = await fetch(`/${filename}`);
        if (response.ok) {
          text = await response.text();
        }
      } catch (fErr) {
        // Ignored, try next
      }

      if (!text) {
        try {
          const altResponse = await fetch(`/api/sample/${filename}`);
          if (altResponse.ok) {
            text = await altResponse.text();
          }
        } catch (apiErr) {
          // Ignored
        }
      }

      if (!text) {
        throw new Error(`Could not load ${filename}. Please upload the file directly using the browse button.`);
      }

      const blob = new Blob([text], { type: 'text/plain' });
      const sampleFile = new File([blob], filename, { type: 'text/plain' });
      await handleFileProcess(sampleFile);
    } catch (err) {
      onError(`Failed to load sample contract: ${err.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      {/* Hero Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold uppercase tracking-wider mb-3 border border-brand-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          Automated Contract Risk Intelligence
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
          Upload Contract for Risk Analysis
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
          Scans agreements across 12 clause categories, detects 17+ high-risk patterns, extracts verifiable source quotes, and highlights missing protections for human review.
        </p>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-brand-400 dark:hover:border-brand-500'
        } ${isLoading ? 'opacity-70 pointer-events-none' : 'shadow-sm hover:shadow-md'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileProcess(e.target.files[0])}
        />

        {isLoading ? (
          <div className="py-6 flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-brand-600 animate-spin mb-4" />
            <p className="text-base font-semibold text-slate-900 dark:text-white">{loadingStep}</p>
            <p className="text-xs text-slate-500 mt-1">Applying TF-IDF categorization & risk rules...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4 border border-brand-200 dark:border-brand-800">
              <UploadCloud className="w-8 h-8" />
            </div>
            <p className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              Drag and drop your contract here, or <span className="text-brand-600 dark:text-brand-400 underline">browse files</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Supported formats: PDF (text-layer required), DOCX, or TXT (up to 20MB)
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 100% Local & Private Processing
              <span className="mx-1">•</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Sentence-Level Evidence Highlighting
            </div>
          </div>
        )}
      </div>

      {/* Quick Load Buttons & Options */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-100/60 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Hackathon Test Contracts:
          </span>
          <button
            onClick={() => loadSampleContract(1)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>Load Sample 1 (High, Med & Low Risks)</span>
          </button>
          <button
            onClick={() => loadSampleContract(2)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all disabled:opacity-50"
          >
            <span>Load Sample 2 (Standard Terms)</span>
          </button>
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={useLlm}
            onChange={(e) => setUseLlm(e.target.checked)}
            className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span>Optional LLM explanation rewrite (if key configured)</span>
        </label>
      </div>
    </div>
  );
}
