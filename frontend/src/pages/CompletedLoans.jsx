import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { Eye, Trash2, Users } from 'lucide-react';

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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Completed Group Loans</h1>
        <p className="text-sm text-slate-500 mt-1">Archived view of fully settled joint liability group loans</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-medium">
            <tr>
              <th className="px-6 py-4">Group Recipient</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">EMI</th>
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
                  <td className="px-6 py-4 font-semibold">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <Users size={12} /> {groupName}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">₹{loan.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">₹{loan.emiAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{loan.duration} mo</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      Completed
                    </span>
                  </td>
                  <td className="px-6 py-4 flex items-center gap-4">
                    <Link to={`/loans/${loan._id}`} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-semibold transition">
                      <Eye size={16} /> View
                    </Link>
                    {user?.role === 'Admin' && (
                      <button 
                        onClick={() => handleDeleteLoan(loan._id, groupName)}
                        className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-semibold transition animate-fade-in"
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
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500 font-medium">No completed group loans found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompletedLoans;
