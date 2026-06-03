import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { 
  User, Mail, Phone, Shield, Calendar, IdCard, Camera, 
  Edit3, Save, X, ShieldCheck, CheckCircle2, AlertCircle 
} from 'lucide-react';

// Image compression helper
const compressImage = (file, maxWidth = 400, quality = 0.6) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const Profile = () => {
  const { user: authUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Edit Form Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    profilePhoto: '',
  });
  
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/profile');
      setProfile(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        profilePhoto: data.profilePhoto || '',
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setMessage({ type: 'error', text: 'Failed to fetch user profile details.' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file);
      setFormData({ ...formData, profilePhoto: base64 });
    } catch (err) {
      console.error('Error compressing profile photo:', err);
      alert('Failed to process image file. Please try another one.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const { data } = await api.put('/auth/profile', formData);
      setProfile(data);
      setEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save profile changes.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-violet-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-bold text-xs animate-pulse uppercase tracking-wider">Syncing Profile Details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2 font-display">
          <User size={24} className="text-violet-600" /> User Profile
        </h1>
        <p className="text-sm text-slate-500 mt-1">Manage your administrator details, operational contacts, and avatar photo credentials</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 border w-full max-w-2xl ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
        
        {/* Left Column: Avatar & Meta Details Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center space-y-4 hover:shadow-md transition-premium">
            
            {/* Avatar Photo */}
            <div className="relative group">
              <div className="p-1 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 shadow-md">
                {editing ? (
                  <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-white shadow-inner bg-slate-500">
                    {formData.profilePhoto ? (
                      <img src={formData.profilePhoto} alt="Upload Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/70">
                        <User size={32} />
                      </div>
                    )}
                    <label className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white/90 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={20} />
                      <span className="text-[8px] font-black uppercase mt-1 tracking-wider">Change</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageChange} 
                      />
                    </label>
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-white shadow-inner bg-slate-100 flex items-center justify-center">
                    {profile?.profilePhoto ? (
                      <img src={profile.profilePhoto} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={40} className="text-slate-400" />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-lg font-black text-slate-800 tracking-tight font-display">{profile?.name}</h2>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase mt-1 block tracking-wider">@{profile?.username}</span>
              
              <span className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                profile?.role === 'Admin' 
                  ? 'bg-violet-50 text-violet-700 border-violet-100 shadow-sm shadow-violet-500/5' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm shadow-emerald-500/5'
              }`}>
                <Shield size={12} className={profile?.role === 'Admin' ? 'text-violet-500 animate-pulse' : 'text-emerald-500'} />
                {profile?.role === 'Admin' ? 'System Administrator' : 'Field Operations Desk'}
              </span>
            </div>

            <div className="w-full pt-4 border-t border-slate-100 text-left space-y-3.5 text-xs">
              <div className="flex items-center gap-2.5 text-slate-650 font-bold">
                <IdCard size={14} className="text-slate-400 shrink-0" />
                <span className="font-mono">ID: {profile?.employeeId || 'Generating...'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-650 font-bold">
                <Calendar size={14} className="text-slate-400 shrink-0" />
                <span>Joined: {new Date(profile?.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>

            {!editing && (
              <button 
                onClick={() => setEditing(true)}
                className="w-full bg-violet-50 hover:bg-violet-100 border border-violet-100 text-violet-755 font-extrabold p-2.5 rounded-xl transition-premium flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider cursor-pointer shadow-xs"
              >
                <Edit3 size={13} /> Edit Profile Info
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Editable Profile particulars Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-premium text-left">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 font-display mb-6 border-b border-slate-50 pb-3">
              <ShieldCheck size={16} className="text-violet-600" /> Account Particulars
            </h3>

            {editing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Full Name *</label>
                    <input 
                      type="text" required
                      className="premium-input"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Mobile Number</label>
                    <input 
                      type="text"
                      className="premium-input"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="text-left">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email Address *</label>
                  <input 
                    type="email" required
                    className="premium-input"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="pt-6 border-t border-slate-100 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => { setEditing(false); setMessage({ type: '', text: '' }); }}
                    className="w-1/2 btn-secondary"
                  >
                    <X size={15} className="inline mr-1" /> Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="w-1/2 btn-primary flex items-center justify-center gap-1.5"
                  >
                    <Save size={15} /> {saving ? 'Saving...' : 'Save Profile Details'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 text-sm">
                <div className="border-b border-slate-50 pb-3 flex items-center gap-3">
                  <User size={16} className="text-slate-400 shrink-0" />
                  <div className="text-left">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Full Name</span>
                    <span className="font-extrabold text-slate-800">{profile?.name}</span>
                  </div>
                </div>

                <div className="border-b border-slate-50 pb-3 flex items-center gap-3">
                  <Phone size={16} className="text-slate-400 shrink-0" />
                  <div className="text-left">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Mobile Number</span>
                    <span className="font-extrabold text-slate-800">{profile?.phone || 'Not Registered'}</span>
                  </div>
                </div>

                <div className="border-b border-slate-50 pb-3 flex items-center gap-3 sm:col-span-2">
                  <Mail size={16} className="text-slate-400 shrink-0" />
                  <div className="text-left">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Email Address</span>
                    <span className="font-extrabold text-slate-800">{profile?.email}</span>
                  </div>
                </div>

                <div className="border-b border-slate-50 pb-3 flex items-center gap-3">
                  <Shield size={16} className="text-slate-400 shrink-0" />
                  <div className="text-left">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Authority Role</span>
                    <span className="font-extrabold text-slate-800 uppercase text-xs tracking-wider">{profile?.role}</span>
                  </div>
                </div>

                <div className="border-b border-slate-50 pb-3 flex items-center gap-3">
                  <IdCard size={16} className="text-slate-400 shrink-0" />
                  <div className="text-left">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">System Employee ID</span>
                    <span className="font-extrabold text-slate-800 font-mono">{profile?.employeeId}</span>
                  </div>
                </div>

                <div className="border-b border-slate-50 pb-3 flex items-center gap-3 sm:col-span-2">
                  <Calendar size={16} className="text-slate-400 shrink-0" />
                  <div className="text-left">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Joining Date & Ledger Time</span>
                    <span className="font-extrabold text-slate-800">
                      {new Date(profile?.createdAt).toLocaleString('en-US', { 
                        weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
