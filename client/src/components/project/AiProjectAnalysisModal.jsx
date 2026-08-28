import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '../../services/apiService';
import moment from 'jalali-moment';
import toast from 'react-hot-toast';

const SparklesIcon = (props) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const HealthScoreGauge = ({ score }) => {
  let strokeColor = '#10b981';
  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let label = 'Optimal Health & Trajectory';

  if (score < 50) {
    strokeColor = '#ef4444';
    badgeColor = 'bg-red-50 text-red-700 border-red-200';
    label = 'Critical Deviation - Action Required';
  } else if (score < 75) {
    strokeColor = '#f59e0b';
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
    label = 'Moderate Timeline Variance';
  }

  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const strokePct = ((100 - score) * circ) / 100;

  return (
    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
      <div className="relative flex items-center justify-center">
        <svg width="90" height="90" className="transform -rotate-90">
          <circle
            cx="45"
            cy="45"
            r={radius}
            stroke="#f1f5f9"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="45"
            cy="45"
            r={radius}
            stroke={strokeColor}
            strokeWidth="8"
            strokeDasharray={circ}
            strokeDashoffset={strokePct}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <span className="absolute font-black text-xl text-slate-800">{score}%</span>
      </div>
      <div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Health Index</div>
        <div className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border mt-1 inline-block ${badgeColor}`}>
          {label}
        </div>
      </div>
    </div>
  );
};

const RiskLevelBadge = ({ risk }) => {
  const map = {
    'Low': { bg: 'bg-emerald-500 text-white', text: 'Low Delivery Risk' },
    'Medium': { bg: 'bg-amber-500 text-white', text: 'Medium Delivery Risk' },
    'High': { bg: 'bg-red-500 text-white font-bold', text: 'High Delivery Risk' },
    'Critical': { bg: 'bg-rose-700 text-white font-black animate-pulse', text: 'Critical Risk Warning' }
  };
  const current = map[risk] || map['Medium'];
  return (
    <span className={`px-3.5 py-1.5 rounded-xl text-xs font-black shadow-sm ${current.bg}`}>
      {current.text}
    </span>
  );
};

const AiProjectAnalysisModal = ({ isOpen, onClose, projectId, projectTitle }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const runAnalysis = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await aiService.analyzeProject(projectId);
      setAnalysis(res.data);
      toast.success('AI strategic analysis generated.');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to complete AI analysis.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen && projectId) {
      runAnalysis();
    } else {
      setAnalysis(null);
    }
  }, [isOpen, projectId, runAnalysis]);

  const handleCopy = () => {
    if (!analysis) return;
    const text = `📊 Strategic AI Project Evaluation: ${analysis.projectTitle}\nHealth Score: ${analysis.healthScore}%\nRisk Tier: ${analysis.predictedDeliveryRisk}\n\nExecutive Summary:\n${analysis.statusSummary}\n\nIn-Depth Evaluation:\n${analysis.detailedAnalysis}`;
    navigator.clipboard.writeText(text);
    toast.success('Evaluation report copied.');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/75 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={onClose} dir="ltr">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sharp Modern Blue Header */}
          <div className="p-6 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner backdrop-blur-sm">
                <SparklesIcon className="w-7 h-7 text-yellow-300 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black flex items-center gap-2 tracking-tight">
                  Strategic AI Project Evaluation
                </h3>
                <p className="text-xs text-blue-100 mt-0.5 font-semibold">
                  Project: <span className="text-white font-bold">{projectTitle}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6 scrollbar-flat text-slate-800">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-extrabold text-slate-700 text-sm animate-pulse">
                  Evaluating schedule variance, critical path bottlenecks & capacity metrics...
                </p>
                <span className="text-xs text-slate-400 font-medium">Groq LPU Engine Active</span>
              </div>
            ) : analysis ? (
              <>
                {/* Metric Cards Banner */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <HealthScoreGauge score={analysis.healthScore} />
                  <div className="flex flex-col justify-center items-start md:items-end gap-2 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <RiskLevelBadge risk={analysis.predictedDeliveryRisk} />
                    <span className="text-[11px] text-slate-400 font-bold">
                      Evaluated: {moment(analysis.analyzedAt).format('YYYY/MM/DD HH:mm')}
                    </span>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 border-l-4 border-l-blue-600">
                  <h4 className="font-extrabold text-xs text-blue-900 mb-2 uppercase tracking-wider flex items-center gap-2">
                    <span>📌</span> Executive Briefing
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-700 font-semibold">
                    {analysis.statusSummary}
                  </p>
                </div>

                {/* Critical Bottlenecks & Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {analysis.criticalBottlenecks?.length > 0 && (
                    <div className="bg-red-50/80 p-5 rounded-2xl border border-red-200 shadow-sm">
                      <h4 className="font-extrabold text-xs text-red-900 mb-3 flex items-center gap-2 uppercase tracking-wider">
                        <span>⚠️</span> Identified Bottlenecks & Risks
                      </h4>
                      <ul className="space-y-2 text-xs text-red-950 font-semibold list-disc list-inside">
                        {analysis.criticalBottlenecks.map((b, i) => (
                          <li key={i} className="leading-relaxed">{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.recommendedActions?.length > 0 && (
                    <div className="bg-emerald-50/80 p-5 rounded-2xl border border-emerald-200 shadow-sm">
                      <h4 className="font-extrabold text-xs text-emerald-900 mb-3 flex items-center gap-2 uppercase tracking-wider">
                        <span>🎯</span> Prioritized Actionable Roadmap
                      </h4>
                      <ul className="space-y-2 text-xs text-emerald-950 font-semibold list-disc list-inside">
                        {analysis.recommendedActions.map((a, i) => (
                          <li key={i} className="leading-relaxed">{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* In-Depth Evaluation (Markdown/Text) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h4 className="font-extrabold text-xs text-slate-900 mb-4 pb-2 border-b uppercase tracking-wider flex items-center gap-2">
                    <span>🔍</span> In-Depth Comprehensive Analysis
                  </h4>
                  <div className="text-xs text-slate-700 leading-loose whitespace-pre-wrap font-medium">
                    {analysis.detailedAnalysis}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-slate-400 text-xs">
                No evaluation data available. Click re-analyze to generate.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-white flex justify-between items-center gap-3 shadow-inner">
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="px-5 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <SparklesIcon className="w-4 h-4" />
              {loading ? 'Evaluating...' : 'Re-Evaluate'}
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                disabled={!analysis || loading}
                className="flat-button px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 disabled:opacity-50"
              >
                📋 Copy Report
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-900 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AiProjectAnalysisModal;