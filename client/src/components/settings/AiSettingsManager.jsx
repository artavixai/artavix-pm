import React, { useState, useEffect } from 'react';
import { aiService } from '../../services/apiService';
import toast from 'react-hot-toast';

const ACTIVE_GROQ_MODELS = [
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B (High Precision & Reasoning)' },
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B (Fast & Balanced)' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Ultra Fast)' },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT (Google)' }
];

const AiSettingsManager = () => {
  const [formData, setFormData] = useState({
    apiKey: '',
    model: 'openai/gpt-oss-120b',
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
          model: res.data.model || 'openai/gpt-oss-120b',
          temperature: res.data.temperature ?? 0.3,
          maxTokens: res.data.maxTokens ?? 4096,
          isEnabled: res.data.isEnabled ?? true
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load AI settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.apiKey.trim()) {
      toast.error('Please enter a Groq API key.');
      return;
    }
    setSaving(true);
    try {
      await aiService.updateSettings(formData);
      toast.success('AI settings saved successfully.');
      setTestResult(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.apiKey.trim()) {
      toast.error('Please enter an API key first.');
      return;
    }
    setTesting(true);
    setTestResult(null);
    const toastId = toast.loading('Testing Groq connection...');
    try {
      const res = await aiService.testConnection({
        apiKey: formData.apiKey,
        model: formData.model
      });
      setTestResult({ success: true, message: res.data?.message || 'Connection to Groq API successfully established.' });
      toast.success('Connection verified!', { id: toastId });
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Connection failed. Please check your API key.';
      setTestResult({ success: false, message: errMsg });
      toast.error(errMsg, { id: toastId });
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="p-4 text-center text-slate-500 text-xs" dir="ltr">Loading...</div>;

  return (
    <div dir="ltr" className="max-w-xl text-xs">
      <h2 className="text-base font-bold text-slate-800 mb-6">Groq AI Engine Configuration</h2>
      
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="font-bold text-slate-700">Groq API Key *</label>
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-[11px] font-semibold text-blue-600 hover:underline"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <input
            type={showKey ? 'text' : 'password'}
            value={formData.apiKey}
            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
            placeholder="gsk_..."
            className="flat-input w-full py-2 font-mono"
            required
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1.5">Model</label>
          <select
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            className="flat-input w-full py-2 bg-white"
          >
            {ACTIVE_GROQ_MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Temperature: {formData.temperature}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer accent-blue-600"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Max Tokens</label>
            <input
              type="number"
              min="512"
              max="8192"
              step="256"
              value={formData.maxTokens}
              onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) || 4096 })}
              className="flat-input w-full py-1.5 text-center"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="ai-enabled"
            checked={formData.isEnabled}
            onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
            className="w-4 h-4 rounded text-blue-600"
          />
          <label htmlFor="ai-enabled" className="font-bold text-slate-700 cursor-pointer">
            Enable AI analysis across project views
          </label>
        </div>

        {testResult && (
          <div className={`p-3 rounded-xl font-bold text-xs border ${testResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
            {testResult.message}
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || !formData.apiKey.trim()}
            className="flex-1 flat-button py-2.5 rounded-xl font-bold disabled:opacity-50"
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AiSettingsManager;