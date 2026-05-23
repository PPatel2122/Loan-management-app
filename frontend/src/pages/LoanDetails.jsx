import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, CheckCircle, AlertTriangle, Edit2, Users } from 'lucide-react';

const LoanDetails = () => {
  const { id } = useParams();
  const [loan, setLoan] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingInst, setEditingInst] = useState(null);
  const [editFormData, setEditFormData] = useState({ remainingAmount: '', penalty: '', status: '' });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const { data } = await api.get(`/loans/${id}`);
      setLoan(data.loan);
      setInstallments(data.installments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markPaid = async (instId) => {
    if (!window.confirm("Mark this EMI as fully paid?")) return;
    try {
      await api.put(`/installments/${instId}`, { remainingAmount: 0 });
      fetchData(); // refresh
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/installments/${editingInst}`, editFormData);
      setEditingInst(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-center py-10 text-slate-500 font-medium">Loading details...</div>;
  if (!loan) return <div className="text-center py-10 text-slate-500 font-medium">Loan not found.</div>;

  const group = loan.groupId || {};

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/loans" className="text-slate-500 hover:text-blue-600 bg-slate-200 p-2 rounded-full transition">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 font-sans">Loan Details</h1>
      </div>

      {/* Loan Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Group Recipient</p>
          <p className="font-bold text-lg flex items-center gap-1.5 text-blue-600">
            <Users size={18} /> {group.name || 'Unknown Group'}
          </p>
          <p className="text-slate-500 text-sm mt-1">{group.members?.length || 0} Members Jointly Liable</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Principal Amount</p>
          <p className="font-bold text-lg text-slate-800">₹{loan.amount.toLocaleString()}</p>
          <p className="text-slate-500 text-sm mt-1 font-semibold">{loan.interestRate}% Interest Rate</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
            {loan.paymentFrequency === 'Weekly' ? 'Weekly Installment' : 'EMI Schedule'}
          </p>
          <p className="font-bold text-lg text-slate-800">
            ₹{loan.emiAmount.toLocaleString()} / {loan.paymentFrequency === 'Weekly' ? 'wk' : 'mo'}
          </p>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            For {loan.duration} {loan.paymentFrequency === 'Weekly' ? 'Weeks' : 'Months'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Total Payable</p>
          <p className="font-bold text-lg text-indigo-600">₹{loan.totalAmount.toLocaleString()}</p>
          <p className="text-slate-500 text-sm mt-1 font-semibold flex items-center gap-1">
            Status: 
            <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-bold ${
              loan.status === 'Active' ? 'bg-blue-50 text-blue-700' :
              loan.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
              {loan.status}
            </span>
          </p>
        </div>
      </div>

      {/* Group Members Roster Panel */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm mb-8 animate-fade-in">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Users size={20} className="text-blue-600" /> Group Members & Joint Liabilities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {group.members?.map((member) => (
            <div key={member._id} className="p-4 border border-slate-100 bg-slate-50/70 rounded-lg">
              <p className="font-semibold text-slate-800">{member.name}</p>
              <p className="text-slate-500 text-sm mt-1">📞 {member.phone}</p>
              <p className="text-slate-400 text-xs mt-1.5 flex items-start gap-1">
                <span>📍</span>
                <span>{member.address}</span>
              </p>
            </div>
          ))}
          {(!group.members || group.members.length === 0) && (
            <p className="text-slate-400 text-sm font-medium">No member profiles loaded for this group.</p>
          )}
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-800 mb-4">Installments</h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-medium">
            <tr>
              <th className="px-6 py-4">#</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4">EMI Amount</th>
              <th className="px-6 py-4">Remaining</th>
              <th className="px-6 py-4">Penalty</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {installments.map((inst, idx) => (
              <tr key={inst._id} className={inst.status === 'Paid' ? 'bg-emerald-50/30' : (inst.status === 'Overdue' ? 'bg-red-50/50' : 'hover:bg-slate-50')}>
                <td className="px-6 py-4 text-slate-500">{idx + 1}</td>
                <td className="px-6 py-4 text-slate-800 font-semibold">{new Date(inst.dueDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-slate-600">₹{inst.amount.toLocaleString()}</td>
                <td className="px-6 py-4 font-bold text-slate-800">₹{inst.remainingAmount.toLocaleString()}</td>
                <td className="px-6 py-4 text-red-600 font-medium">{inst.penalty > 0 ? `+₹${inst.penalty}` : '-'}</td>
                <td className="px-6 py-4">
                  {inst.status === 'Pending' && <span className="inline-flex px-2 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800">Pending</span>}
                  {inst.status === 'Paid' && <span className="inline-flex px-2 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800">Paid</span>}
                  {inst.status === 'Overdue' && <span className="inline-flex px-2 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-800 flex items-center gap-1"><AlertTriangle size={12}/> Overdue</span>}
                </td>
                <td className="px-6 py-4 flex gap-2">
                  {inst.status !== 'Paid' && (
                    <>
                      <button 
                        onClick={() => markPaid(inst._id)}
                        className="text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded transition"
                        title="Mark as fully paid"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          setEditingInst(inst._id);
                          setEditFormData({ remainingAmount: inst.remainingAmount, penalty: inst.penalty, status: inst.status });
                        }}
                        className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-1.5 rounded transition"
                        title="Edit manually"
                      >
                        <Edit2 size={18} />
                      </button>
                    </>
                  )}
                  {inst.status === 'Paid' && <span className="text-emerald-600 text-sm font-semibold">✓ Settled</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingInst && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-fade-in">
            <h2 className="text-lg font-bold mb-4 text-slate-800">Edit Installment</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-slate-600 font-medium">Remaining Amount (₹)</label>
                <input type="number" required className="w-full border border-slate-300 focus:ring-2 focus:ring-blue-500 rounded p-2.5 outline-none transition" value={editFormData.remainingAmount} onChange={e => setEditFormData({...editFormData, remainingAmount: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-600 font-medium">Penalty (₹)</label>
                <input type="number" required className="w-full border border-slate-300 focus:ring-2 focus:ring-blue-500 rounded p-2.5 outline-none transition" value={editFormData.penalty} onChange={e => setEditFormData({...editFormData, penalty: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-600 font-medium">Status</label>
                <select className="w-full border border-slate-300 focus:ring-2 focus:ring-blue-500 rounded p-2.5 outline-none transition bg-white" value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value})}>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingInst(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded font-semibold transition">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded font-semibold transition">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanDetails;
