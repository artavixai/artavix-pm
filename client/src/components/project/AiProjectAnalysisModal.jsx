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

const HealthScoreBadge = ({ score }) => {
  let colorClass = 'bg-emerald-500 text-white';
  let label = 'عالی و بدون ریسک';
  if (score < 50) {
    colorClass = 'bg-red-500 text-white animate-pulse';
    label = 'بسیار بحرانی';
  } else if (score < 75) {
    colorClass = 'bg-amber-500 text-white';
    label = 'نیازمند توجه و پیگیری';
  }

  return (
    <div className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-md ${colorClass}`}>
        {score}
      </div>
      <div>
        <div className="text-[11px] font-bold text-slate-400">امتیاز سلامت پروژه (Health Score)</div>
        <div className="text-xs font-black text-slate-800 mt-0.5">{label}</div>
      </div>
    </div>
  );
};

const RiskLevelBadge = ({ risk }) => {
  const map = {
    'Low': { bg: 'bg-emerald-100 text-emerald-800', text: 'ریسک تحویل: پایین (Low)' },
    'Medium': { bg: 'bg-amber-100 text-amber-800', text: 'ریسک تحویل: متوسط (Medium)' },
    'High': { bg: 'bg-red-100 text-red-800 font-black', text: 'ریسک تحویل: بالا (High)' },
    'Critical': { bg: 'bg-rose-600 text-white font-black', text: 'ریسک تحویل: بسیار بحرانی (Critical)' }
  };
  const current = map[risk] || map['Medium'];
  return (
    <span className={`px-3 py-1 rounded-xl text-xs font-bold ${current.bg}`}>
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
      toast.success('تحلیل هوش مصنوعی با موفقیت انجام شد.');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'خطا در انجام تحلیل هوش مصنوعی. لطفاً تنظیمات Groq را بررسی کنید.');
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
    const text = `📊 گزارش تحلیل هوشمند پروژه: ${analysis.projectTitle}\nامتیاز سلامت: ${analysis.healthScore}/100\n\nخلاصه وضعیت:\n${analysis.statusSummary}\n\nتحلیل مشروح:\n${analysis.detailedAnalysis}`;
    navigator.clipboard.writeText(text);
    toast.success('گزارش با موفقیت در کلیپ‌بورد کپی شد.');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose} dir="rtl">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shadow-inner">
                <SparklesIcon className="w-7 h-7 text-amber-300 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black flex items-center gap-2">
                  تحلیل و پایش هوشمند با Groq AI
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5 font-medium">
                  پروژه: <span className="text-white font-bold">{projectTitle}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6 scrollbar-flat text-slate-800">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-black text-slate-700 text-sm animate-pulse">
                  در حال استخراج داده‌های WBS، انحرافات زمانی و تحلیل چندوجهی با موتور Groq LPU...
                </p>
                <span className="text-xs text-slate-400 font-medium">مدل فعال: Llama 3.3 70B Versatile</span>
              </div>
            ) : analysis ? (
              <>
                {/* Score & Risk Banner */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <HealthScoreBadge score={analysis.healthScore} />
                  <div className="flex flex-col justify-center items-start md:items-end gap-2 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <RiskLevelBadge risk={analysis.predictedDeliveryRisk} />
                    <span className="text-[11px] text-slate-400 font-bold">
                      تاریخ تحلیل: {moment(analysis.analyzedAt).format('YYYY/MM/DD HH:mm')}
                    </span>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-100 border-r-4 border-r-indigo-600">
                  <h4 className="font-black text-sm text-indigo-950 mb-2 flex items-center gap-2">
                    <span>📌</span> خلاصه وضعیت مدیریتی
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-700 font-semibold">
                    {analysis.statusSummary}
                  </p>
                </div>

                {/* Critical Bottlenecks & Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {analysis.criticalBottlenecks?.length > 0 && (
                    <div className="bg-red-50/60 p-5 rounded-2xl border border-red-200">
                      <h4 className="font-black text-xs text-red-800 mb-3 flex items-center gap-2">
                        <span>⚠️</span> گلوگاه‌ها و ریسک‌های بحرانی
                      </h4>
                      <ul className="space-y-2 text-xs text-red-900 font-medium list-disc list-inside">
                        {analysis.criticalBottlenecks.map((b, i) => (
                          <li key={i} className="leading-relaxed">{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.recommendedActions?.length > 0 && (
                    <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200">
                      <h4 className="font-black text-xs text-emerald-800 mb-3 flex items-center gap-2">
                        <span>🎯</span> اقدامات اصلاحی و اولویت‌دار
                      </h4>
                      <ul className="space-y-2 text-xs text-emerald-900 font-medium list-disc list-inside">
                        {analysis.recommendedActions.map((a, i) => (
                          <li key={i} className="leading-relaxed">{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Detailed Analysis (Markdown/Text) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h4 className="font-black text-sm text-slate-800 mb-4 pb-2 border-b flex items-center gap-2">
                    <span>🔍</span> تحلیل تخصصی و تفصیلی هوش مصنوعی
                  </h4>
                  <div className="text-xs text-slate-700 leading-loose whitespace-pre-wrap font-medium">
                    {analysis.detailedAnalysis}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-slate-400 text-xs">
                خطا در بارگذاری تحلیل. لطفاً دکمه تحلیل مجدد را بزنید.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-white flex justify-between items-center gap-3">
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <SparklesIcon className="w-4 h-4" />
              {loading ? 'در حال تحلیل...' : 'تحلیل مجدد'}
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                disabled={!analysis || loading}
                className="flat-button px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 disabled:opacity-50"
              >
                📋 کپی گزارش
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-900 transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AiProjectAnalysisModal;