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
    
    // Simple base64 reader helper
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
        <p className="text-slate-500 font-semibold text-sm animate-pulse">Syncing customer profile...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-rose-100 p-8 max-w-lg mx-auto shadow-sm text-left">
        <AlertTriangle size={32} className="text-rose-500 mb-4" />
        <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Query Failed</h3>
        <p className="text-xs text-slate-500 mt-2">{error || 'The requested customer profile could not be loaded.'}</p>
        <Link to="/customers" className="mt-6 inline-flex bg-violet-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl items-center gap-2 uppercase tracking-wider">
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
          className="text-slate-600 hover:text-violet-600 hover:bg-slate-200/60 bg-slate-100 p-2.5 rounded-xl transition cursor-pointer"
          title="Back to Directory"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex flex-col">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Member Statements</span>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Customer Profile Details</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: KYC Card & Verification Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center space-y-4">
            <div className="relative group">
              {customer.customerPhoto ? (
                <img 
                  src={customer.customerPhoto} 
                  alt={customer.name} 
                  className="w-28 h-28 rounded-full object-cover border-4 border-slate-50 shadow-md"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center border-4 border-slate-50 shadow-md">
                  <User size={48} />
                </div>
              )}
              <span className={`absolute bottom-1.5 right-1.5 p-1 rounded-full border text-white ${
                customer.isVerified ? 'bg-emerald-500 border-white' : 'bg-rose-500 border-white animate-pulse'
              }`}>
                {customer.isVerified ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
              </span>
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-850 tracking-tight">{customer.name}</h2>
              <span className="text-xs text-slate-400 font-semibold block mt-0.5">ID: {customer._id.substring(18)}</span>
              
              <button 
                onClick={handleToggleVerification}
                className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border cursor-pointer transition ${
                  customer.isVerified 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100' 
                    : 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-100'
                }`}
              >
                {customer.isVerified ? 'KYC Verified' : 'KYC Rejected/Unverified'}
              </button>
            </div>

            <div className="w-full pt-4 border-t border-slate-50 text-left space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-600 font-bold">
                <Phone size={14} className="text-slate-400" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-start gap-2 text-slate-600 font-bold">
                <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{customer.address}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 font-bold">
                <Briefcase size={14} className="text-slate-400" />
                <span>{customer.occupation || 'Self-Employed'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 font-bold">
                <IndianRupee size={14} className="text-slate-400" />
                <span>₹{(customer.monthlyIncome || 0).toLocaleString()} / month</span>
              </div>
            </div>

            <div className="w-full pt-4 border-t border-slate-50 flex gap-2">
              <button 
                onClick={() => setShowEditModal(true)}
                className="w-full bg-violet-50 hover:bg-violet-100 border border-violet-100 text-violet-700 font-extrabold p-2.5 rounded-xl transition flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider cursor-pointer shadow-xs"
              >
                <Edit2 size={13} /> Edit Profile
              </button>
            </div>
          </div>

          {/* Guarantor Details Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-left space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <UserCheck size={14} className="text-indigo-600" /> Guarantor Reference
            </h3>
            {customer.guarantorName ? (
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Full Name</span>
                  <span className="font-extrabold text-slate-700">{customer.guarantorName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Phone</span>
                    <span className="font-extrabold text-slate-700">{customer.guarantorPhone || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Relationship</span>
                    <span className="font-extrabold text-slate-700">{customer.guarantorRelation || 'Family'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-xs italic font-semibold">No guarantor details registered yet. Edit profile to register reference details.</p>
            )}
          </div>
        </div>

        {/* Right Columns: Loan & Collection Histories */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Risk Score Gauge & Info */}
          {customer.riskAnalysis && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={16} className="text-violet-600" /> Credit Risk Assessment
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Calculated liability risk score index based on demographics and income assets</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                    customer.riskAnalysis.grade === 'A' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    customer.riskAnalysis.grade === 'B' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                    customer.riskAnalysis.grade === 'C' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>
                    Grade: {customer.riskAnalysis.grade}
                  </span>
                  <span className="text-slate-500 font-bold text-xs">Score: {customer.riskAnalysis.score} / 100</span>
                </div>
              </div>

              {customer.aadhaarPhoto && (
                <div className="shrink-0 bg-slate-50 border border-slate-100 rounded-2xl p-2 flex items-center gap-2">
                  <FileText size={20} className="text-slate-400" />
                  <div className="text-left">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none">Aadhaar Document</span>
                    <a href={customer.aadhaarPhoto} target="_blank" rel="noreferrer" className="text-[9px] font-extrabold text-violet-600 uppercase tracking-wider block mt-0.5 hover:underline">View Document</a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Groups List */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Layers size={16} className="text-violet-600" /> Group Memberships
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {customer.groups && customer.groups.map(g => (
                <div key={g._id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-xs font-black text-slate-800 block">{g.name}</span>
                    <span className="text-[9px] text-slate-400 font-bold block mt-0.5">{g.members?.length || 0} Members Joint Liability</span>
                  </div>
                </div>
              ))}
              {(!customer.groups || customer.groups.length === 0) && (
                <p className="text-slate-400 text-xs italic font-semibold col-span-2">This customer is not registered in any microfinance Bachat Gat groups.</p>
              )}
            </div>
          </div>

          {/* Loan History */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <IndianRupee size={16} className="text-emerald-600" /> Loan Accounts
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 text-[8px] font-black uppercase tracking-widest border-b border-slate-150">
                  <tr>
                    <th className="px-5 py-3">Group Account</th>
                    <th className="px-5 py-3">Principal Issued</th>
                    <th className="px-5 py-3">EMI Amount</th>
                    <th className="px-5 py-3">Account Status</th>
                    <th className="px-5 py-3 text-right">Statements</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {customer.loans && customer.loans.map(loan => (
                    <tr key={loan._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-800">{loan.groupId?.name || 'Unknown'}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-600">₹{loan.amount.toLocaleString()}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-650">₹{loan.emiAmount.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          loan.status === 'Active' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          loan.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link to={`/loans/${loan._id}`} className="text-violet-600 hover:text-violet-800 font-extrabold uppercase text-[9px] tracking-wider bg-violet-50 px-2.5 py-1.5 rounded-lg border border-violet-100">View statement</Link>
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
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={16} className="text-indigo-600" /> Repayments & Collections statements
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 text-[8px] font-black uppercase tracking-widest border-b border-slate-150">
                  <tr>
                    <th className="px-5 py-3">Due Date</th>
                    <th className="px-5 py-3">Installment Amount</th>
                    <th className="px-5 py-3">Remaining Balance</th>
                    <th className="px-5 py-3">Overdue Penalty</th>
                    <th className="px-5 py-3">Settlement Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {customer.installments && customer.installments.map(inst => (
                    <tr key={inst._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5 font-semibold text-slate-650">{new Date(inst.dueDate).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-700">₹{inst.amount.toLocaleString()}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-800">₹{inst.remainingAmount.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-rose-600 font-bold">{inst.penalty > 0 ? `+₹${inst.penalty}` : '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
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
                <h2 className="text-sm font-black text-slate-800 tracking-tight">Edit Customer Profile</h2>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Modify demographics, document base64 attachments, and guarantor references</p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition bg-white border border-slate-100 cursor-pointer"
              >
                <X size={16} />
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
                    className="w-full border border-slate-350 focus:ring-2 focus:ring-violet-500 rounded-xl p-2.5 outline-none text-xs font-semibold"
                    value={editFormData.name}
                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Phone Number *</label>
                  <input 
                    type="text" required
                    className="w-full border border-slate-350 focus:ring-2 focus:ring-violet-500 rounded-xl p-2.5 outline-none text-xs font-semibold"
                    value={editFormData.phone}
                    onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Guarantor Name</label>
                  <input 
                    type="text"
                    className="w-full border border-slate-350 focus:ring-2 focus:ring-violet-500 rounded-xl p-2.5 outline-none text-xs font-semibold"
                    value={editFormData.guarantorName || ''}
                    onChange={e => setEditFormData({ ...editFormData, guarantorName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Guarantor Phone</label>
                  <input 
                    type="text"
                    className="w-full border border-slate-350 focus:ring-2 focus:ring-violet-500 rounded-xl p-2.5 outline-none text-xs font-semibold"
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
                    className="w-full border border-slate-350 focus:ring-2 focus:ring-violet-500 rounded-xl p-2.5 outline-none text-xs font-semibold"
                    value={editFormData.guarantorRelation || ''}
                    placeholder="e.g. Spouse, Cousin, Neighbor"
                    onChange={e => setEditFormData({ ...editFormData, guarantorRelation: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Occupation</label>
                  <input 
                    type="text"
                    className="w-full border border-slate-350 focus:ring-2 focus:ring-violet-500 rounded-xl p-2.5 outline-none text-xs font-semibold"
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
                    className="w-full border border-slate-350 focus:ring-2 focus:ring-violet-500 rounded-xl p-2.5 outline-none text-xs font-semibold"
                    value={editFormData.monthlyIncome || ''}
                    onChange={e => setEditFormData({ ...editFormData, monthlyIncome: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Aadhaar / National ID Card Number</label>
                  <input 
                    type="text"
                    className="w-full border border-slate-350 focus:ring-2 focus:ring-violet-500 rounded-xl p-2.5 outline-none text-xs font-semibold"
                    value={editFormData.aadhaarNumber || ''}
                    onChange={e => setEditFormData({ ...editFormData, aadhaarNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Current Residence Address *</label>
                  <textarea required rows="2"
                    className="w-full border border-slate-350 focus:ring-2 focus:ring-violet-500 rounded-xl p-2.5 outline-none text-xs font-semibold"
                    value={editFormData.address}
                    onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Permanent Residence Address</label>
                  <textarea rows="2"
                    className="w-full border border-slate-350 focus:ring-2 focus:ring-violet-500 rounded-xl p-2.5 outline-none text-xs font-semibold"
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
                  className="w-1/2 bg-white text-slate-700 border border-slate-250 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition text-xs uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-2.5 rounded-xl font-bold transition text-xs uppercase tracking-wider cursor-pointer shadow-xs shadow-violet-500/10"
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
