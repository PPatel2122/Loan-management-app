import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { Plus, Eye, Trash2, X, Users } from 'lucide-react';

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

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const { data } = await api.get('/loans?excludeStatus=Completed');
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
      setError(err.response?.data?.message || 'Error creating loan');
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

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Active & Defaulted Group Loans</h1>
          <p className="text-sm text-slate-500 mt-1">Manage joint liability group loans and repayments</p>
        </div>
        {user?.role === 'Admin' && (
          <button 
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition font-medium"
          >
            <Plus size={20} /> Create Group Loan
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-medium">
            <tr>
              <th className="px-6 py-4">Group Recipient</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Installment (Kist)</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loans.map((loan) => {
              const groupName = loan.groupId?.name || 'Unknown Group';
              return (
                <tr key={loan._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                      <Users size={12} /> {groupName}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">₹{loan.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    ₹{loan.emiAmount.toLocaleString()}
                    <span className="text-[10px] text-slate-400 font-bold block">
                      {loan.paymentFrequency === 'Weekly' ? 'Weekly' : 'Monthly'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {loan.duration} {loan.paymentFrequency === 'Weekly' ? 'wks' : 'mos'}
                  </td>
                  <td className="px-6 py-4">
                    {loan.status === 'Active' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Active</span>}
                    {loan.status === 'Completed' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Completed</span>}
                    {loan.status === 'Defaulted' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Defaulted</span>}
                  </td>
                  <td className="px-6 py-4 flex items-center gap-4">
                    <Link to={`/loans/${loan._id}`} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-semibold transition">
                      <Eye size={16} /> View
                    </Link>
                    {user?.role === 'Admin' && (
                      <button 
                        onClick={() => handleDeleteLoan(loan._id, groupName)}
                        className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-semibold transition"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {loans.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500 font-medium">No active group loans found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Create New Group Loan</h2>
                <p className="text-xs text-slate-500 mt-1">Disburse a new joint liability group loan</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm font-medium">{error}</div>}
              
              <form onSubmit={handleCreateLoan} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Group</label>
                  <select 
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-800 text-sm transition"
                    value={formData.groupId} 
                    onChange={e => setFormData({...formData, groupId: e.target.value})}
                  >
                    <option value="">Select a customer group</option>
                    {groups.map(g => <option key={g._id} value={g._id}>{g.name} ({g.members?.length || 0} members)</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Principal Amount (₹)</label>
                    <input 
                      type="number" required min="1"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 text-sm"
                      value={formData.amount} 
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Interest Rate (% p.a.)</label>
                    <input 
                      type="number" required min="0" step="0.1"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 text-sm"
                      value={formData.interestRate} 
                      onChange={e => setFormData({...formData, interestRate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Payment Frequency</label>
                    <select
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-800 text-sm transition"
                      value={formData.paymentFrequency}
                      onChange={e => setFormData({...formData, paymentFrequency: e.target.value})}
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Weekly">Weekly (Kist)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date</label>
                    <input 
                      type="date"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 text-sm"
                      value={formData.startDate} 
                      onChange={e => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Duration {formData.paymentFrequency === 'Weekly' ? '(Weeks)' : '(Months)'}
                  </label>
                  <input 
                    type="number" required min="1"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 text-sm"
                    value={formData.duration} 
                    onChange={e => setFormData({...formData, duration: e.target.value})}
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 mt-6 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="w-1/2 bg-slate-100 text-slate-700 p-2.5 rounded-lg font-semibold hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="w-1/2 bg-blue-600 text-white p-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Create & Disburse
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
