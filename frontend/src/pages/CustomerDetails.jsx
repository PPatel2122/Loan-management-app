import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { 
  ArrowLeft, User, Phone, MapPin, Briefcase, IndianRupee, ShieldCheck, 
  Layers, Edit2, X, PlusCircle, CheckCircle, AlertTriangle, Calendar, 
  Camera, FileText, UserCheck, ShieldAlert 
} from 'lucide-react';

const CustomerDetails = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Edit Form States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      const { data } = await api.get(`/customers/${id}`);
      setCustomer(data);
      setEditFormData(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch customer profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setEditError('');
    try {
      const { data } = await api.put(`/customers/${id}`, editFormData);
      setCustomer({ ...customer, ...data });
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
      setEditError(err.response?.data?.message || 'Failed to update customer profile');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVerification = async () => {
    try {
      const nextVerifyState = !customer.isVerified;
      const { data } = await api.put(`/customers/${customer._id}`, { isVerified: nextVerifyState });
      setCustomer({ ...customer, isVerified: data.isVerified });
    } catch (err) {
      console.error('Error toggling verification:', err);
    }
  };

  const handleImageCapture = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Base64 reader helper
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setEditFormData({
        ...editFormData,
        [field]: reader.result
      });
    };
    reader.onerror = (err) => console.error('Error uploading photo:', err);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-violet-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-bold text-xs animate-pulse uppercase tracking-wider">Syncing customer profile...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-rose-100 p-8 max-w-lg mx-auto shadow-sm text-left">
        <AlertTriangle size={32} className="text-rose-500 mb-4 animate-bounce" />
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-display">Query Failed</h3>
        <p className="text-xs text-slate-500 mt-2 font-medium">{error || 'The requested customer profile could not be loaded.'}</p>
        <Link to="/customers" className="mt-6 inline-flex btn-primary items-center gap-2">
          <ArrowLeft size={14} /> Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header Back Link */}
      <div className="flex items-center gap-4 text-left">
        <Link 
          to="/customers" 
          className="text-slate-650 hover:text-violet-650 hover:bg-slate-200/50 bg-slate-100 p-2.5 rounded-xl transition-premium cursor-pointer"
          title="Back to Directory"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Member Profile Records</span>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight font-display mt-1">Customer Profile Details</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: KYC Card & Verification Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center space-y-4 hover:shadow-md transition-premium">
            <div className="relative group">
              <div className="p-1 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 shadow-md">
                {customer.customerPhoto ? (
                  <img 
                    src={customer.customerPhoto} 
                    alt={customer.name} 
                    className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-inner"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center border-2 border-white">
                    <User size={36} />
                  </div>
                )}
              </div>
              <span className={`absolute bottom-0 right-0 p-1.5 rounded-full border border-white text-white ${
                customer.isVerified ? 'bg-emerald-500 shadow-sm shadow-emerald-500/20' : 'bg-rose-500 shadow-sm shadow-rose-500/20 animate-pulse'
              }`}>
                {customer.isVerified ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
              </span>
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-850 tracking-tight font-display">{customer.name}</h2>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block mt-1 tracking-wider">ID: {customer._id.substring(18).toUpperCase()}</span>
              
              <button 
                onClick={handleToggleVerification}
                className={`mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border cursor-pointer transition-premium ${
                  customer.isVerified 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100' 
                    : 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-100'
                }`}
              >
                {customer.isVerified ? 'KYC Verified' : 'KYC Unverified'}
              </button>
            </div>

            <div className="w-full pt-4 border-t border-slate-100 text-left space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-650 font-bold">
                <Phone size={14} className="text-slate-400 shrink-0" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-start gap-2.5 text-slate-650 font-bold">
                <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2 leading-relaxed">{customer.address}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-650 font-bold">
                <Briefcase size={14} className="text-slate-400 shrink-0" />
                <span>{customer.occupation || 'Self-Employed'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-650 font-bold">
                <IndianRupee size={14} className="text-slate-400 shrink-0" />
                <span>₹{(customer.monthlyIncome || 0).toLocaleString('en-IN')} / month</span>
              </div>
            </div>

            <div className="w-full pt-4 border-t border-slate-100 flex gap-2">
              <button 
                onClick={() => setShowEditModal(true)}
                className="w-full bg-violet-50 hover:bg-violet-100 border border-violet-100 text-violet-700 font-extrabold p-2.5 rounded-xl transition-premium flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider cursor-pointer shadow-xs"
              >
                <Edit2 size={13} /> Edit Profile
              </button>
            </div>
          </div>

          {/* Guarantor Details Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-left space-y-4 hover:shadow-md transition-premium">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 font-display">
              <UserCheck size={14} className="text-indigo-650" /> Guarantor Reference
            </h3>
            {customer.guarantorName ? (
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Full Name</span>
                  <span className="font-extrabold text-slate-800">{customer.guarantorName}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Phone</span>
                    <span className="font-extrabold text-slate-700">{customer.guarantorPhone || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Relationship</span>
                    <span className="font-extrabold text-slate-700">{customer.guarantorRelation || 'Reference'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-xs italic font-semibold leading-relaxed">No guarantor reference details registered yet. Edit profile to register references.</p>
            )}
          </div>
        </div>

        {/* Right Columns: Loan & Collection Histories */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Risk Score Assessment Block */}
          {customer.riskAnalysis && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-premium">
              <div className="space-y-1">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 font-display">
                  <ShieldCheck size={16} className="text-violet-600" /> Credit Risk Assessment
                </h3>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Demographic and asset risk metrics index</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase border tracking-wider ${
                    customer.riskAnalysis.grade === 'A' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    customer.riskAnalysis.grade === 'B' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                    customer.riskAnalysis.grade === 'C' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>
                    Grade: {customer.riskAnalysis.grade}
                  </span>
                  <span className="text-slate-600 font-bold text-xs">Score Index: {customer.riskAnalysis.score} / 100</span>
                </div>
              </div>

              {customer.aadhaarPhoto && (
                <div className="shrink-0 bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-2">
                  <FileText size={18} className="text-slate-400" />
                  <div className="text-left">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none">Aadhaar Document</span>
                    <a href={customer.aadhaarPhoto} target="_blank" rel="noreferrer" className="text-[9px] font-bold text-violet-650 uppercase tracking-wider block mt-1 hover:underline">View Attachment</a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Groups List */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition-premium">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 font-display">
              <Layers size={16} className="text-violet-600" /> Group Memberships
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {customer.groups && customer.groups.map(g => (
                <div key={g._id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between hover:border-slate-200 transition">
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-800 block">{g.name}</span>
                    <span className="text-[9px] text-slate-400 font-black uppercase mt-1 block tracking-wider">{g.members?.length || 0} Members Joint Liability</span>
                  </div>
                </div>
              ))}
              {(!customer.groups || customer.groups.length === 0) && (
                <p className="text-slate-400 text-xs italic font-semibold col-span-2">This customer is not registered in any microfinance JLG groups.</p>
              )}
            </div>
          </div>

          {/* Loan History */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition-premium">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 font-display">
              <IndianRupee size={16} className="text-emerald-600" /> Active Loan Accounts
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-150">
                  <tr>
                    <th className="px-5 py-3.5">Group Account</th>
                    <th className="px-5 py-3.5">Principal Issued</th>
                    <th className="px-5 py-3.5">EMI Amount</th>
                    <th className="px-5 py-3.5">Account Status</th>
                    <th className="px-5 py-3.5 text-right">Statements</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {customer.loans && customer.loans.map(loan => (
                    <tr key={loan._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-800">{loan.groupId?.name || 'Unknown'}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-700">₹{loan.amount.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-700">₹{loan.emiAmount.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                          loan.status === 'Active' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          loan.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link to={`/loans/${loan._id}`} className="text-violet-700 hover:text-violet-900 font-extrabold uppercase text-[9px] tracking-wider bg-violet-50 px-2.5 py-1.5 rounded-lg border border-violet-100">View statement</Link>
                      </td>
                    </tr>
                  ))}
                  {(!customer.loans || customer.loans.length === 0) && (
                    <tr>
                      <td colSpan="5" className="px-5 py-8 text-center text-slate-400 font-semibold italic bg-white">No active loan accounts ledger.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Collection Statements */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition-premium">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 font-display">
              <Calendar size={16} className="text-indigo-650" /> Repayments & Collections Statements
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-150">
                  <tr>
                    <th className="px-5 py-3.5">Due Date</th>
                    <th className="px-5 py-3.5">Installment Amount</th>
                    <th className="px-5 py-3.5">Remaining Balance</th>
                    <th className="px-5 py-3.5">Overdue Penalty</th>
                    <th className="px-5 py-3.5">Settlement Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {customer.installments && customer.installments.map(inst => (
                    <tr key={inst._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5 font-semibold text-slate-650">{new Date(inst.dueDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-700">₹{inst.amount.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-850">₹{inst.remainingAmount.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3.5 text-rose-600 font-bold">{inst.penalty > 0 ? `+₹${inst.penalty}` : '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                          inst.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          inst.status === 'Overdue' ? 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse' :
                          'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {inst.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!customer.installments || customer.installments.length === 0) && (
                    <tr>
                      <td colSpan="5" className="px-5 py-8 text-center text-slate-400 font-semibold italic bg-white">No repayment collection records.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* Edit Customer Profile details Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <div className="text-left">
                <h2 className="text-sm font-black text-slate-800 tracking-tight font-display">Edit Customer Profile</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Modify demographics, document attachments, and references</p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition bg-white border border-slate-100 cursor-pointer bg-transparent"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-5 overflow-y-auto space-y-4">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-150 text-rose-700 rounded-xl text-xs font-bold text-left animate-fade-in flex items-center gap-2">
                  <X size={14} />
                  <span>{editError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Member Name *</label>
                  <input 
                    type="text" required
                    className="premium-input"
                    value={editFormData.name || ''}
                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Phone Number *</label>
                  <input 
                    type="text" required
                    className="premium-input"
                    value={editFormData.phone || ''}
                    onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Guarantor Name</label>
                  <input 
                    type="text"
                    className="premium-input"
                    value={editFormData.guarantorName || ''}
                    onChange={e => setEditFormData({ ...editFormData, guarantorName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Guarantor Phone</label>
                  <input 
                    type="text"
                    className="premium-input"
                    value={editFormData.guarantorPhone || ''}
                    onChange={e => setEditFormData({ ...editFormData, guarantorPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Guarantor Relation</label>
                  <input 
                    type="text"
                    className="premium-input"
                    value={editFormData.guarantorRelation || ''}
                    placeholder="e.g. Spouse, Neighbor"
                    onChange={e => setEditFormData({ ...editFormData, guarantorRelation: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Occupation</label>
                  <input 
                    type="text"
                    className="premium-input"
                    value={editFormData.occupation || ''}
                    onChange={e => setEditFormData({ ...editFormData, occupation: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Monthly Income (₹)</label>
                  <input 
                    type="number"
                    className="premium-input"
                    value={editFormData.monthlyIncome || ''}
                    onChange={e => setEditFormData({ ...editFormData, monthlyIncome: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Aadhaar Card Number</label>
                  <input 
                    type="text"
                    className="premium-input"
                    value={editFormData.aadhaarNumber || ''}
                    onChange={e => setEditFormData({ ...editFormData, aadhaarNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Current Address *</label>
                  <textarea required rows="2"
                    className="premium-input"
                    value={editFormData.address || ''}
                    onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Permanent Address</label>
                  <textarea rows="2"
                    className="premium-input"
                    value={editFormData.permanentAddress || ''}
                    onChange={e => setEditFormData({ ...editFormData, permanentAddress: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Customer Photo</label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer border border-slate-200">
                      <Camera size={14} /> Upload Photo
                      <input 
                        type="file" accept="image/*" className="hidden"
                        onChange={e => handleImageCapture(e, 'customerPhoto')}
                      />
                    </label>
                    {editFormData.customerPhoto && (
                      <span className="text-[10px] text-emerald-600 font-extrabold">✓ Loaded</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Aadhaar Card Document</label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer border border-slate-200">
                      <Camera size={14} /> Upload KYC Doc
                      <input 
                        type="file" accept="image/*" className="hidden"
                        onChange={e => handleImageCapture(e, 'aadhaarPhoto')}
                      />
                    </label>
                    {editFormData.aadhaarPhoto && (
                      <span className="text-[10px] text-emerald-600 font-extrabold">✓ Loaded</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-2 border-t border-slate-100 mt-5 bg-slate-50 -mx-5 -mb-5 p-4">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="w-1/2 btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-1/2 btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetails;
