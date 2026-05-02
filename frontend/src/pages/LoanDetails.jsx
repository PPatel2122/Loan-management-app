import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, CheckCircle, AlertTriangle, Edit2 } from 'lucide-react';

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

  if (loading) return <div>Loading details...</div>;
  if (!loan) return <div>Loan not found.</div>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/loans" className="text-slate-500 hover:text-blue-600 bg-slate-200 p-2 rounded-full">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Loan Details</h1>
      </div>

      {/* Loan Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Customer</p>
          <p className="font-semibold text-lg">{loan.customerId.name}</p>
          <p className="text-slate-600 text-sm">{loan.customerId.phone}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Principal Amount</p>
          <p className="font-semibold text-lg">₹{loan.amount}</p>
          <p className="text-slate-600 text-sm">{loan.interestRate}% Interest</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">EMI Schedule</p>
          <p className="font-semibold text-lg">₹{loan.emiAmount} / mo</p>
          <p className="text-slate-600 text-sm">For {loan.duration} months</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Total Payable</p>
          <p className="font-semibold text-lg text-indigo-600">₹{loan.totalAmount}</p>
          <p className="text-slate-600 text-sm font-medium">Status: {loan.status}</p>
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
                <td className="px-6 py-4 text-slate-800 font-medium">{new Date(inst.dueDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-slate-600">₹{inst.amount}</td>
                <td className="px-6 py-4 font-semibold text-slate-800">₹{inst.remainingAmount}</td>
                <td className="px-6 py-4 text-red-600">{inst.penalty > 0 ? `+₹${inst.penalty}` : '-'}</td>
                <td className="px-6 py-4">
                  {inst.status === 'Pending' && <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-800">Pending</span>}
                  {inst.status === 'Paid' && <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800">Paid</span>}
                  {inst.status === 'Overdue' && <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1"><AlertTriangle size={12}/> Overdue</span>}
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
                  {inst.status === 'Paid' && <span className="text-emerald-600 text-sm font-medium">✓ Done</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingInst && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-4">Edit Installment</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-slate-600">Remaining Amount (₹)</label>
                <input type="number" required className="w-full border rounded p-2" value={editFormData.remainingAmount} onChange={e => setEditFormData({...editFormData, remainingAmount: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-600">Penalty (₹)</label>
                <input type="number" required className="w-full border rounded p-2" value={editFormData.penalty} onChange={e => setEditFormData({...editFormData, penalty: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-600">Status</label>
                <select className="w-full border rounded p-2" value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value})}>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingInst(null)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanDetails;
