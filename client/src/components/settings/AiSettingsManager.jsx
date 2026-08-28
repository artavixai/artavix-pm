import React, { useState, useEffect } from 'react';
import { aiService } from '../../services/apiService';
import toast from 'react-hot-toast';

const AVAILABLE_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (توصیه شده - قوی‌ترین و دقیق‌ترین)', speed: 'سریع و فوق‌العاده باکیفیت' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (فوق‌العاده سریع)', speed: 'سریع‌ترین زمان پاسخ' },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT (مدل گوگل)', speed: 'سبک و روان' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (پنجره کانتکست ۳۲K)', speed: 'مناسب متن‌های طولانی' }
];

const AiSettingsManager = () => {
  const [formData, setFormData] = useState({
    apiKey: '',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    maxTokens: 4096,
    isEnabled: true
  });
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

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
      toast.error('خطا در دریافت تنظیمات هوش مصنوعی.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.apiKey.trim()) {
      toast.error('لطفاً کلید API گروک را وارد کنید.');
      return;
    }
    setSaving(true);
    try {
      await aiService.updateSettings(formData);
      toast.success('تنظیمات هوش مصنوعی Groq با موفقیت ذخیره شد.');
    } catch (err) {
      console.error(err);
      toast.error('خطا در ذخیره تنظیمات هوش مصنوعی.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.apiKey.trim()) {
      toast.error('لطفاً ابتدا کلید API را وارد کنید.');
      return;
    }
    setTesting(true);
    const toastId = toast.loading('در حال برقراری ارتباط با سرورهای Groq...');
    try {
      const res = await aiService.testConnection({
        apiKey: formData.apiKey,
        model: formData.model
      });
      toast.success(res.data?.message || 'ارتباط با هوش مصنوعی برقرار است!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'اتصال ناموفق بود. کلید API را بررسی کنید.', { id: toastId });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500" dir="ltr">Loading AI settings...</div>;
  }

  return (
    <div dir="ltr" className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className="text-xl">🤖</span> تنظیمات موتور هوش مصنوعی Groq AI
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            پیکربندی کلید ارتباطی، مدل زبانی LPU و تحلیل هوشمند خودکار پروژه‌ها
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${formData.isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {formData.isEnabled ? 'فعال' : 'غیرفعال'}
        </span>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 text-xs text-slate-700 space-y-2">
        <p className="font-bold text-blue-900 flex items-center gap-1.5">
          <span>⚡</span> نحوه دریافت کلید API رایگان از Groq:
        </p>
        <p className="leading-relaxed">
          به وب‌سایت <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold">console.groq.com/keys</a> مراجعه کرده و یک کلید رایگان ایجاد کنید، سپس در کادر زیر قرار دهید.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1.5">Groq API Key *</label>
          <input
            type="password"
            value={formData.apiKey}
            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
            placeholder="gsk_..."
            className="flat-input w-full py-2.5 px-4 font-mono rounded-xl text-xs"
            required
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1.5">انتخاب مدل زبانی (Language Model)</label>
          <select
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            className="flat-input w-full py-2.5 px-4 rounded-xl text-xs font-bold"
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} - ({m.speed})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              دمای پاسخ (Temperature: {formData.temperature})
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>دقیق و تحلیلی (۰.۰)</span>
              <span>خلاقانه (۱.۰)</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">حداکثر طول توکن (Max Output Tokens)</label>
            <input
              type="number"
              min="512"
              max="8192"
              step="256"
              value={formData.maxTokens}
              onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) || 4096 })}
              className="flat-input w-full py-2 rounded-xl text-xs text-center font-bold"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="ai-enabled"
            checked={formData.isEnabled}
            onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="ai-enabled" className="font-bold text-slate-700 cursor-pointer">
            فعال‌سازی سرویس هوش مصنوعی و دکمه تحلیل پروژه در سراسر سامانه
          </label>
        </div>

        <div className="flex items-center gap-3 pt-6 border-t">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-100"
          >
            {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
          </button>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || !formData.apiKey.trim()}
            className="flat-button px-6 py-2.5 rounded-xl font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            {testing ? 'در حال آزمایش...' : '🔌 تست اتصال API'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AiSettingsManager;