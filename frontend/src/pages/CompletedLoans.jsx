import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Eye } from 'lucide-react';

const CompletedLoans = () => {
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Completed Loans</h1>
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
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    Completed
                  </span>
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
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No completed loans found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompletedLoans;
