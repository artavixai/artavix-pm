import React, { useState, useEffect } from 'react';
import { aiService } from '../../services/apiService';
import toast from 'react-hot-toast';

const ACTIVE_GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Recommended - 128k Context)', tier: 'Fast & High Quality' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (128k Context)', tier: 'Ultra Fast' },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT (Google)', tier: 'Balanced' },
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B (Reasoning)', tier: 'High Precision' },
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B', tier: 'Fast' }
];

const AiSettingsManager = () => {
  const [formData, setFormData] = useState({
    apiKey: '',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    maxTokens: 4096,
    isEnabled: true
  });
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await aiService.getSettings();
      if (res.data) {
        setFormData({
          apiKey: res.data.apiKey || '',
          model: res.data.model || 'llama-3.3-70b-versatile',
          temperature: res.data.temperature ?? 0.3,
          maxTokens: res.data.maxTokens ?? 4096,
          isEnabled: res.data.isEnabled ?? true
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load AI engine configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.apiKey.trim()) {
      toast.error('Please enter a valid Groq API key.');
      return;
    }
    setSaving(true);
    try {
      await aiService.updateSettings(formData);
      toast.success('Groq AI settings saved successfully.');
      setTestResult(null);
    } catch (err) {
      console.error(err);
      toast.error('Error saving AI settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.apiKey.trim()) {
      toast.error('Please provide a Groq API key before testing.');
      return;
    }
    setTesting(true);
    setTestResult(null);
    const toastId = toast.loading('Connecting to Groq LPU API...');
    try {
      const res = await aiService.testConnection({
        apiKey: formData.apiKey,
        model: formData.model
      });
      setTestResult({ success: true, message: res.data?.message || 'Connection successful!' });
      toast.success('Groq AI connection verified!', { id: toastId });
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Connection failed. Please verify your API key and model.';
      setTestResult({ success: false, message: errMsg });
      toast.error(errMsg, { id: toastId });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500 font-medium" dir="ltr">Loading AI configuration...</div>;
  }

  return (
    <div dir="ltr" className="space-y-6 max-w-4xl text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm">🤖</span>
            Groq LPU AI Engine Configuration
          </h2>
          <p className="text-slate-400 text-xs mt-0.5 font-medium">
            Configure ultra-fast LLM models for intelligent project insights and automated health tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${formData.isEnabled ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
            {formData.isEnabled ? 'Active' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <span>⚡</span> Free API Key Setup
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Obtain your free API key at <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline">console.groq.com/keys</a> and paste it below.
          </p>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 whitespace-nowrap shadow-sm">
          Groq Cloud v1
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-5 text-xs">
        {/* API Key */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="font-bold text-slate-700">Groq API Key *</label>
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-[11px] font-semibold text-blue-600 hover:underline"
            >
              {showKey ? 'Hide Key' : 'Show Key'}
            </button>
          </div>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder="gsk_..."
              className="flat-input w-full py-2.5 px-3.5 font-mono rounded-xl text-xs"
              required
            />
          </div>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block font-bold text-slate-700 mb-1.5">Model Architecture</label>
          <select
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            className="flat-input w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold bg-white cursor-pointer"
          >
            {ACTIVE_GROQ_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} [{m.tier}]
              </option>
            ))}
          </select>
        </div>

        {/* Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-700">Sampling Temperature</label>
              <span className="font-mono font-bold text-indigo-600 text-xs px-2 py-0.5 bg-indigo-50 rounded-md">
                {formData.temperature}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
              <span>Deterministic (0.0)</span>
              <span>Creative (1.0)</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <label className="block font-bold text-slate-700">Max Completion Tokens</label>
            <input
              type="number"
              min="512"
              max="8192"
              step="256"
              value={formData.maxTokens}
              onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) || 4096 })}
              className="flat-input w-full py-2 rounded-xl text-xs font-bold text-center"
            />
            <p className="text-[10px] text-slate-400 font-medium">Upper limit for generated tokens per analysis.</p>
          </div>
        </div>

        {/* Feature Toggle */}
        <div className="flex items-center gap-3 p-3 bg-white border border-slate-200/80 rounded-2xl">
          <input
            type="checkbox"
            id="ai-enabled"
            checked={formData.isEnabled}
            onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="ai-enabled" className="font-bold text-slate-700 cursor-pointer select-none text-xs">
            Enable AI Project Analysis across all project views
          </label>
        </div>

        {/* Test Result Feedback */}
        {testResult && (
          <div className={`p-3.5 rounded-2xl text-xs font-bold border flex items-center gap-2 ${testResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
            <span>{testResult.success ? '✓' : '⚠️'}</span>
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all text-xs shadow-md shadow-blue-100"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || !formData.apiKey.trim()}
            className="flat-button px-5 py-2.5 rounded-xl font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all text-xs flex items-center gap-1.5"
          >
            <span>🔌</span>
            {testing ? 'Testing Connection...' : 'Test API Connection'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AiSettingsManager;