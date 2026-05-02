import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Plus, Eye, Check, X, Clock } from 'lucide-react';

const Loans = () => {
  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    interestRate: '',
    duration: '',
    startDate: ''
  });

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const { data } = await api.get('/loans?excludeStatus=Completed');
      setLoans(data.filter(loan => loan.status !== 'Completed'));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomersForDropdown = async () => {
    try {
      const { data } = await api.get('/customers');
      setCustomers(data.filter(c => c.isVerified));
    } catch (err) {
      console.error(err);
    }
  };

  const openCreateModal = () => {
    fetchCustomersForDropdown();
    setShowModal(true);
    setFormData({ customerId: '', amount: '', interestRate: '', duration: '', startDate: '' });
  };

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/loans', formData);
      setShowModal(false);
      fetchLoans();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating loan');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Loans</h1>
        <button 
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus size={20} /> Create Loan
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-medium">
            <tr>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">EMI</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loans.map((loan) => (
              <tr key={loan._id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">{loan.customerId?.name}</td>
                <td className="px-6 py-4 text-slate-600">₹{loan.amount}</td>
                <td className="px-6 py-4 text-slate-600">₹{loan.emiAmount}</td>
                <td className="px-6 py-4 text-slate-600">{loan.duration} mo</td>
                <td className="px-6 py-4">
                  {loan.status === 'Active' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Active</span>}
                  {loan.status === 'Completed' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Completed</span>}
                  {loan.status === 'Defaulted' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Defaulted</span>}
                </td>
                <td className="px-6 py-4">
                  <Link to={`/loans/${loan._id}`} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium">
                    <Eye size={16} /> View
                  </Link>
                </td>
              </tr>
            ))}
            {loans.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No loans found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-800">Create New Loan</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
              
              <form onSubmit={handleCreateLoan} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
                  <select 
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})}
                  >
                    <option value="">Select a verified customer</option>
                    {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Principal Amount (₹)</label>
                    <input 
                      type="number" required min="1"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Annual Interest Rate (%)</label>
                    <input 
                      type="number" required min="0" step="0.1"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.interestRate} onChange={e => setFormData({...formData, interestRate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Months)</label>
                    <input 
                      type="number" required min="1"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date (Optional)</label>
                    <input 
                      type="date"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 mt-6">
                  <button type="submit" className="w-full bg-blue-600 text-white p-2.5 rounded-lg font-medium hover:bg-blue-700 transition">
                    Create Loan & Generate EMI
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
