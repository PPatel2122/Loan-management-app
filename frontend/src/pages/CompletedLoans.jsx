import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { Eye, Trash2, Users, Archive, Check } from 'lucide-react';

const CompletedLoans = () => {
  const { user } = useContext(AuthContext);
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const { data } = await api.get('/loans?status=Completed');
      setLoans(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLoan = async (id, recipient) => {
    if (!window.confirm(`Are you sure you want to delete this completed loan for ${recipient}? This will also delete all associated payment records!`)) {
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center text-left">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Archive size={24} className="text-slate-400 shrink-0" />
            Settled Loans Archive
          </h1>
          <p className="text-sm text-slate-500 mt-1">Archived ledger history of fully repaid joint liability group credits</p>
        </div>
      </div>

      {/* Main Table Wrapper */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Group Recipient</th>
                <th className="px-6 py-4">Principal Settled</th>
                <th className="px-6 py-4">EMI Installment</th>
                <th className="px-6 py-4">Loan Duration</th>
                <th className="px-6 py-4">Verification Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loans.map((loan) => {
                const groupName = loan.groupId?.name || 'Unknown Group';
                return (
                  <tr key={loan._id} className="hover:bg-slate-50/60 transition cursor-pointer">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">
                        <Users size={12} /> {groupName}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800 text-sm">₹{loan.amount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-700 text-xs">
                      ₹{loan.emiAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-slate-650 font-bold text-xs">{loan.duration} mos</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                        <Check size={11} className="text-emerald-600" /> Fully Settled
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Link 
                          to={`/loans/${loan._id}`} 
                          className="text-violet-750 hover:text-violet-950 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border border-violet-100 shadow-xs uppercase tracking-wider"
                        >
                          <Eye size={13} /> View Ledger
                        </Link>
                        {user?.role === 'Admin' && (
                          <button 
                            onClick={() => handleDeleteLoan(loan._id, groupName)}
                            className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition border border-transparent hover:border-rose-100 cursor-pointer"
                            title="Delete Ledger"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {loans.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium italic bg-white">No archived completed loans found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompletedLoans;
