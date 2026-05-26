import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { Save, ShieldAlert, CheckCircle, Percent, AlertCircle, Building, ShieldCheck } from 'lucide-react';

const Settings = () => {
  const { user } = useContext(AuthContext);
  const [settings, setSettings] = useState({
    companyName: '',
    interestRate: '',
    penaltyRate: '',
    supportPhone: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings(data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const { data } = await api.put('/settings', settings);
      setSettings(data);
      setMessage({ type: 'success', text: 'System settings saved successfully!' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-violet-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-semibold text-sm animate-pulse">Syncing configurations...</p>
      </div>
    );
  }

  if (user?.role !== 'Admin') {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-rose-100 p-8 max-w-lg mx-auto shadow-sm text-left space-y-4">
        <ShieldAlert size={36} className="text-rose-500" />
        <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Access Restricted</h3>
        <p className="text-xs text-slate-500">Only authorized System Administrators can edit default microfinance rates, penalties, or configurations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Building size={24} className="text-violet-600" /> System Configurations
        </h1>
        <p className="text-sm text-slate-500 mt-1">Configure company profiles, default interest margins, daily penalty fines, and notification rules</p>
      </div>

      <div className="max-w-2xl bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl text-xs font-bold flex items-center gap-2 border ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
          }`}>
            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Company Name</label>
              <input 
                type="text" required
                className="w-full border border-slate-350 focus:ring-2 focus:ring-violet-500 rounded-xl p-3 outline-none text-xs font-semibold text-slate-850"
                value={settings.companyName}
                onChange={e => setSettings({...settings, companyName: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Default Interest Rate (% p.a.)</label>
                <div className="relative">
                  <input 
                    type="number" required min="0" max="100" step="0.1"
                    className="w-full border border-slate-350 focus:ring-2 focus:ring-violet-500 rounded-xl p-3 outline-none text-xs font-semibold text-slate-850 pr-8"
                    value={settings.interestRate}
                    onChange={e => setSettings({...settings, interestRate: parseFloat(e.target.value) || 0})}
                  />
                  <span className="absolute right-3 top-3.5 text-slate-400 font-black text-xs">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Overdue Penalty (₹ per day)</label>
                <div className="relative">
                  <input 
                    type="number" required min="0" step="1"
                    className="w-full border border-slate-350 focus:ring-2 focus:ring-violet-500 rounded-xl p-3 outline-none text-xs font-semibold text-slate-850 pl-8"
                    value={settings.penaltyRate}
                    onChange={e => setSettings({...settings, penaltyRate: parseInt(e.target.value) || 0})}
                  />
                  <span className="absolute left-3 top-3 text-slate-400 font-black text-xs">₹</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Support & Notification Contact (WhatsApp/Phone)</label>
              <input 
                type="text" required
                className="w-full border border-slate-350 focus:ring-2 focus:ring-violet-500 rounded-xl p-3 outline-none text-xs font-semibold text-slate-850"
                value={settings.supportPhone}
                placeholder="e.g. 917999049627"
                onChange={e => setSettings({...settings, supportPhone: e.target.value})}
              />
              <span className="text-[10px] text-slate-400 block mt-1">This number is used as the default sender profile for SMS and WhatsApp collection receipts notifications.</span>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={saving}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer text-xs uppercase tracking-wider shadow-md shadow-violet-500/15"
            >
              <Save size={16} /> {saving ? 'Saving Settings...' : 'Save Configurations'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
