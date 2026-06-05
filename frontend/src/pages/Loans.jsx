import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { Plus, Eye, Trash2, X, Users, CreditCard, Calendar, Percent, CalendarDays, Search } from 'lucide-react';

const Loans = () => {
  const { user } = useContext(AuthContext);
  const [loans, setLoans] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  // Modal form states
  const [formData, setFormData] = useState({
    groupId: '',
    amount: '',
    interestRate: '',
    duration: '',
    startDate: '',
    paymentFrequency: 'Monthly'
  });

  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const { data } = await api.get('/loans');
      setLoans(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const groupsRes = await api.get('/groups');
      setGroups(groupsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openCreateModal = () => {
    fetchDropdownData();
    setShowModal(true);
    setFormData({ groupId: '', amount: '', interestRate: '', duration: '', startDate: '', paymentFrequency: 'Monthly' });
  };

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.groupId) {
      setError('Please select a customer group');
      return;
    }

    const payload = {
      groupId: formData.groupId,
      amount: formData.amount,
      interestRate: formData.interestRate,
      duration: formData.duration,
      startDate: formData.startDate,
      paymentFrequency: formData.paymentFrequency
    };

    try {
      await api.post('/loans', payload);
      setShowModal(false);
      fetchLoans();
    } catch (err) {
      setError(err.response?.data?.message || 'Error requesting loan');
    }
  };

  const handleApproveLoan = async (id, recipient) => {
    if (!window.confirm(`Approve loan request for ${recipient}? This will disburse the capital and generate installments.`)) {
      return;
    }
    try {
      await api.put(`/loans/${id}/approve`);
      fetchLoans();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve loan');
    }
  };

  const handleRejectLoan = async (id, recipient) => {
    if (!window.confirm(`Reject loan request for ${recipient}?`)) {
      return;
    }
    try {
      await api.put(`/loans/${id}/reject`);
      fetchLoans();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject loan');
    }
  };

  const handleDeleteLoan = async (id, recipient) => {
    if (!window.confirm(`Are you sure you want to delete this loan for ${recipient}? This will also delete all associated installments!`)) {
      return;
    }

    try {
      await api.delete(`/loans/${id}`);
      fetchLoans();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete loan');
    }
  };

  const filteredLoans = loans.filter(loan => {
    const groupName = loan.groupId?.name || 'Unknown Group';
    const matchesSearch = groupName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === 'active') {
      return loan.status === 'Active' || loan.status === 'Completed' || loan.status === 'Defaulted';
    } else {
      return loan.status === 'Pending' || loan.status === 'Approved' || loan.status === 'Rejected';
    }
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Group Credit & Loans</h1>
          <p className="text-sm text-slate-500 mt-1">Manage joint liability group credit requests, disbursements, and statements</p>
        </div>
        {(user?.role === 'Admin' || user?.role === 'Employee') && (
          <button 
            onClick={openCreateModal}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition font-bold text-xs shadow-md shadow-violet-500/15 cursor-pointer uppercase tracking-wider shrink-0"
          >
            <Plus size={16} /> {user?.role === 'Admin' ? 'Create Group Loan' : 'Request Group Loan'}
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-100 gap-6 text-left">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 font-bold text-xs uppercase tracking-wider transition relative cursor-pointer ${
            activeTab === 'active' ? 'text-violet-600 font-black' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Active Portfolios
          {activeTab === 'active' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />}
        </button>
        <button
          onClick={() => {
            setActiveTab('pending');
            fetchDropdownData();
          }}
          className={`pb-3 font-bold text-xs uppercase tracking-wider transition relative cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'pending' ? 'text-violet-600 font-black' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Pending Requests
          {loans.filter(l => l.status === 'Pending').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[8px] font-black leading-none animate-pulse">
              {loans.filter(l => l.status === 'Pending').length}
            </span>
          )}
          {activeTab === 'pending' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
          <Search size={16} />
        </span>
        <input 
          type="text"
          placeholder="Search by JLG group name..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-350 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none text-xs font-semibold bg-white text-slate-800"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Desktop view (table) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden w-full max-w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left whitespace-nowrap border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Group Recipient</th>
                <th className="px-6 py-4">Amount Issued</th>
                <th className="px-6 py-4">Installment (Kist)</th>
                <th className="px-6 py-4">Loan Tenure</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLoans.map((loan) => {
                const groupName = loan.groupId?.name || 'Unknown Group';
                return (
                  <tr key={loan._id} className="hover:bg-slate-50/60 transition cursor-pointer">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-violet-50 text-violet-700 border border-violet-100 uppercase tracking-wide">
                        <Users size={12} className="text-violet-500" /> {groupName}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800 text-sm">₹{loan.amount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-700 text-xs">
                      ₹{loan.emiAmount.toLocaleString('en-IN')}
                      <span className="text-[9px] text-slate-400 font-extrabold block mt-0.5 uppercase tracking-wider">
                        {loan.paymentFrequency === 'Weekly' ? 'Weekly Kist' : 'Monthly EMI'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-bold text-xs">
                      {loan.duration} {loan.paymentFrequency === 'Weekly' ? 'weeks' : 'months'}
                    </td>
                    <td className="px-6 py-4">
                      {loan.status === 'Active' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Active
                        </span>
                      )}
                      {loan.status === 'Completed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">
                          Completed
                        </span>
                      )}
                      {loan.status === 'Defaulted' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-100 uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce" /> Defaulted
                        </span>
                      )}
                      {loan.status === 'Pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Pending
                        </span>
                      )}
                      {loan.status === 'Rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-550 text-rose-700 border border-rose-100 uppercase tracking-wide">
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {loan.status === 'Pending' ? (
                          user?.role === 'Admin' ? (
                            <>
                              <button 
                                onClick={() => handleApproveLoan(loan._id, groupName)}
                                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-700 font-extrabold px-3 py-1.5 rounded-lg text-[10px] transition uppercase tracking-wider cursor-pointer shadow-xs"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleRejectLoan(loan._id, groupName)}
                                className="bg-rose-50 hover:bg-rose-100 border border-rose-250 text-rose-750 font-extrabold px-3 py-1.5 rounded-lg text-[10px] transition uppercase tracking-wider cursor-pointer shadow-xs"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Under Review</span>
                          )
                        ) : (
                          <>
                            <Link 
                              to={`/loans/${loan._id}`} 
                              className="text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border border-violet-100 shadow-xs uppercase tracking-wider"
                            >
                              <Eye size={13} /> View Ledger
                            </Link>
                            {user?.role === 'Admin' && (
                              <button 
                                onClick={() => handleDeleteLoan(loan._id, groupName)}
                                className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition border border-transparent hover:border-rose-100 cursor-pointer"
                                title="Delete Loan"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredLoans.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium italic bg-white">No credit records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      <div className="block md:hidden space-y-4">
        {filteredLoans.map((loan) => {
          const groupName = loan.groupId?.name || 'Unknown Group';
          return (
            <div key={loan._id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-violet-50 text-violet-700 border border-violet-100 uppercase tracking-wide">
                  <Users size={12} className="text-violet-500" /> {groupName}
                </span>
                
                <div>
                  {loan.status === 'Active' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Active
                    </span>
                  )}
                  {loan.status === 'Completed' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">
                      Completed
                    </span>
                  )}
                  {loan.status === 'Defaulted' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-100 uppercase tracking-wide">
                      Defaulted
                    </span>
                  )}
                  {loan.status === 'Pending' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wide">
                      Pending
                    </span>
                  )}
                  {loan.status === 'Rejected' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-100 uppercase tracking-wide">
                      Rejected
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Amount Issued</span>
                  <span className="font-black text-slate-800 text-sm">₹{loan.amount.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Installment (Kist)</span>
                  <span className="font-extrabold text-slate-750 text-xs">
                    ₹{loan.emiAmount.toLocaleString('en-IN')}
                    <span className="text-[8px] text-slate-400 font-bold block">
                      {loan.paymentFrequency === 'Weekly' ? 'Weekly Kist' : 'Monthly EMI'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Loan Tenure</span>
                  <span className="text-slate-600 font-bold text-xs">
                    {loan.duration} {loan.paymentFrequency === 'Weekly' ? 'weeks' : 'months'}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  {loan.status === 'Pending' ? (
                    user?.role === 'Admin' ? (
                      <>
                        <button 
                          onClick={() => handleApproveLoan(loan._id, groupName)}
                          className="bg-emerald-50 hover:bg-emerald-105 border border-emerald-200 text-emerald-700 font-black px-2.5 py-1.5 rounded-lg text-[10px] transition uppercase tracking-wider cursor-pointer shadow-xs"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleRejectLoan(loan._id, groupName)}
                          className="bg-rose-50 hover:bg-rose-105 border border-rose-200 text-rose-700 font-black px-2.5 py-1.5 rounded-lg text-[10px] transition uppercase tracking-wider cursor-pointer shadow-xs"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider py-1.5">Under Review</span>
                    )
                  ) : (
                    <>
                      {user?.role === 'Admin' && (
                        <button 
                          onClick={() => handleDeleteLoan(loan._id, groupName)}
                          className="text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition border border-slate-100 hover:border-rose-100 cursor-pointer"
                          title="Delete Loan"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                      <Link 
                        to={`/loans/${loan._id}`} 
                        className="text-violet-755 bg-violet-50 hover:bg-violet-100 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-violet-100 shadow-xs uppercase tracking-wider"
                      >
                        <Eye size={14} /> View Ledger
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filteredLoans.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 font-medium italic border border-slate-100">
            No credit records found.
          </div>
        )}
      </div>

      {/* Redesigned Beautiful Create Loan Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <div className="text-left">
                <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                  <CreditCard size={18} className="text-violet-600" /> Create Group Loan
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-semibold">Disburse credit to a joint liability microfinance group</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition bg-white border border-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-150 text-rose-700 rounded-xl text-xs font-bold text-left animate-fade-in flex items-center gap-2">
                  <X size={14} />
                  <span>{error}</span>
                </div>
              )}
              
              <form onSubmit={handleCreateLoan} className="space-y-4">
                <div className="text-left">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Select Customer Group *</label>
                  <select 
                    required
                    className="premium-select"
                    value={formData.groupId} 
                    onChange={e => setFormData({...formData, groupId: e.target.value})}
                  >
                    <option value="">Select a customer group</option>
                    {groups.map(g => (
                      <option key={g._id} value={g._id}>
                        {g.name} ({g.members?.length || 0} members)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Principal Amount (₹) *</label>
                    <input 
                      type="number" required min="1"
                      className="premium-input"
                      value={formData.amount} 
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Interest (% p.a.) *</label>
                    <input 
                      type="number" required min="0" step="0.1"
                      className="premium-input"
                      value={formData.interestRate} 
                      onChange={e => setFormData({...formData, interestRate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Payment Frequency</label>
                    <select
                      className="premium-select"
                      value={formData.paymentFrequency}
                      onChange={e => setFormData({...formData, paymentFrequency: e.target.value})}
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Weekly">Weekly (Kist)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Start Date</label>
                    <input 
                      type="date" required
                      className="premium-input"
                      value={formData.startDate} 
                      onChange={e => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="text-left">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Loan Duration ({formData.paymentFrequency === 'Weekly' ? 'Weeks' : 'Months'}) *
                  </label>
                  <input 
                    type="number" required min="1"
                    className="premium-input"
                    value={formData.duration} 
                    onChange={e => setFormData({...formData, duration: e.target.value})}
                  />
                </div>

                <div className="pt-5 border-t border-slate-100 mt-6 flex gap-3.5 bg-slate-50 -mx-6 -mb-6 p-6">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="w-1/2 bg-white text-slate-700 border border-slate-250 p-3 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer text-xs uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="w-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white p-3 rounded-xl font-bold transition shadow-md shadow-violet-500/15 cursor-pointer text-xs uppercase tracking-wider"
                  >
                    {user?.role === 'Admin' ? 'Disburse Capital' : 'Request Capital'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loans;
