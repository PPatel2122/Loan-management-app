import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, CheckCircle, AlertTriangle, Edit2, Users, IndianRupee, Landmark, History, Coins, X, Printer, Receipt } from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal';

const LoanDetails = () => {
  const { id } = useParams();
  const [loan, setLoan] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingInst, setEditingInst] = useState(null);
  const [editFormData, setEditFormData] = useState({ remainingAmount: '', penalty: '', status: '' });
  
  // Real transaction ledger modal states
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [installmentNum, setInstallmentNum] = useState(0);

  // Custom / Bulk Payment states
  const [showCustomPaymentModal, setShowCustomPaymentModal] = useState(false);
  const [customPaymentAmount, setCustomPaymentAmount] = useState('');
  const [customPaymentMode, setCustomPaymentMode] = useState('Cash');
  const [savingCustomPayment, setSavingCustomPayment] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const { data } = await api.get(`/loans/${id}`);
      setLoan(data.loan);
      setInstallments(data.installments);
      
      const txnRes = await api.get(`/transactions?loanId=${id}`);
      setTransactions(txnRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openReceiptModal = (inst, instNum) => {
    const num = `REC-${id.substring(18).toUpperCase()}-${instNum}-${new Date(inst.paidDate || Date.now()).getFullYear()}`;
    setReceiptNumber(num);
    setInstallmentNum(instNum);
    setSelectedReceipt(inst);
  };

  const markPaid = async (instId) => {
    const method = window.prompt(
      "Mark this EMI as fully paid?\nEnter payment method (Cash / UPI / Bank Transfer):",
      "Cash"
    );
    if (method === null) return;
    
    const cleanMethod = ['Cash', 'UPI', 'Bank Transfer'].includes(method.trim()) ? method.trim() : 'Cash';
    
    try {
      const { data } = await api.put(`/installments/${instId}`, { 
        remainingAmount: 0,
        status: 'Paid',
        paymentMode: cleanMethod
      });
      alert('Payment recorded successfully!');
      
      if (data.transaction) {
        setSelectedTxn(data.transaction);
        setShowTxnModal(true);
      }
      
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error recording payment');
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

  const handleCustomPaymentSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(customPaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid payment amount greater than 0.');
      return;
    }
    
    setSavingCustomPayment(true);
    try {
      const { data } = await api.post('/installments/loan-payment', {
        loanId: id,
        paymentAmount: amount,
        paymentMode: customPaymentMode
      });
      setShowCustomPaymentModal(false);
      alert(data.message + `\n\nApplied Amount: ₹${data.appliedAmount.toLocaleString('en-IN')}` + (data.changeReturned > 0 ? `\nChange Returned: ₹${data.changeReturned.toLocaleString('en-IN')}` : ''));
      
      if (data.transaction) {
        setSelectedTxn(data.transaction);
        setShowTxnModal(true);
      }
      
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSavingCustomPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-violet-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-semibold text-sm animate-pulse">Syncing loan details ledger...</p>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-red-100 p-8 max-w-lg mx-auto">
        <p className="text-red-650 font-bold text-base mb-2">Not Found</p>
        <p className="text-slate-500 text-sm">The requested loan ledger record does not exist or has been deleted.</p>
      </div>
    );
  }

  const group = loan.groupId || {};

  return (
    <div className="space-y-6">
      {/* Header and Back Link */}
      <div className="mb-6 flex items-center gap-4 text-left">
        <Link 
          to="/loans" 
          className="text-slate-600 hover:text-violet-600 hover:bg-slate-200/60 bg-slate-100 p-2.5 rounded-xl transition cursor-pointer"
          title="Back to Active Loans"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex flex-col">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Account Statements</span>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Loan Details & Ledger</h1>
        </div>
      </div>

      {/* Loan Info Cards (Redesigned with elegant statistical banners) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Recipient Group */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between text-left hover:shadow-md transition">
          <div>
            <span className="text-[9px] text-slate-450 font-extrabold uppercase tracking-widest block mb-1">Group Recipient</span>
            <p className="font-black text-base flex items-center gap-1.5 text-violet-600 truncate">
              <Users size={16} /> {group.name || 'Unknown Group'}
            </p>
          </div>
          <p className="text-slate-500 text-xs mt-3 font-semibold">
            {group.members?.length || 0} Members Jointly Liable
          </p>
        </div>

        {/* Card 2: Principal */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between text-left hover:shadow-md transition">
          <div>
            <span className="text-[9px] text-slate-450 font-extrabold uppercase tracking-widest block mb-1">Principal Amount</span>
            <p className="font-black text-lg text-slate-850">₹{loan.amount.toLocaleString('en-IN')}</p>
          </div>
          <p className="text-emerald-600 text-xs mt-3 font-extrabold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 w-fit">
            {loan.interestRate}% Interest rate
          </p>
        </div>

        {/* Card 3: EMI */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between text-left hover:shadow-md transition">
          <div>
            <span className="text-[9px] text-slate-455 font-extrabold uppercase tracking-widest block mb-1">
              {loan.paymentFrequency === 'Weekly' ? 'Weekly Kist Installment' : 'Monthly EMI Schedule'}
            </span>
            <p className="font-black text-lg text-slate-850">
              ₹{loan.emiAmount.toLocaleString('en-IN')} <span className="text-xs text-slate-400 font-bold">/ {loan.paymentFrequency === 'Weekly' ? 'wk' : 'mo'}</span>
            </p>
          </div>
          <p className="text-slate-500 text-xs mt-3 font-semibold">
            For {loan.duration} {loan.paymentFrequency === 'Weekly' ? 'Weeks' : 'Months'}
          </p>
        </div>

        {/* Card 4: Total Payable */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between text-left hover:shadow-md transition">
          <div>
            <span className="text-[9px] text-slate-450 font-extrabold uppercase tracking-widest block mb-1">Total Outstanding</span>
            <p className="font-black text-lg text-indigo-600">₹{loan.totalAmount.toLocaleString('en-IN')}</p>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <span className="text-xs text-slate-500 font-semibold">Status:</span>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
              loan.status === 'Active' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
              loan.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
            }`}>
              {loan.status}
            </span>
          </div>
        </div>
      </div>

      {/* Group Members Roster Panel */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-left">
        <h3 className="text-base font-extrabold text-slate-850 mb-4 flex items-center gap-2">
          <Users size={18} className="text-violet-600" /> Group Members & Joint Liabilities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {group.members?.map((member) => (
            <div key={member._id} className="p-4 border border-slate-100 bg-slate-50/50 rounded-2xl flex flex-col justify-between text-left hover:border-slate-200 transition duration-200">
              <div>
                <p className="font-extrabold text-slate-850 text-sm">{member.name}</p>
                <p className="text-slate-550 text-xs mt-1.5 font-semibold">📞 {member.phone}</p>
              </div>
              <p className="text-slate-400 text-xs mt-3 flex items-start gap-1 font-medium">
                <span>📍</span>
                <span className="truncate">{member.address}</span>
              </p>
            </div>
          ))}
          {(!group.members || group.members.length === 0) && (
            <p className="text-slate-400 text-xs font-semibold italic">No member profiles loaded for this group.</p>
          )}
        </div>
      </div>

      {/* Installment Table Ledger */}
      <div className="space-y-4 text-left">
        <div className="flex justify-between items-center pb-1">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <History size={18} className="text-violet-600" /> Installment Recovery Schedule
          </h2>
          {loan.status !== 'Completed' && (
            <button
              onClick={() => {
                setCustomPaymentAmount('');
                setShowCustomPaymentModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition font-bold text-xs shadow-md shadow-emerald-500/15 cursor-pointer uppercase tracking-wider shrink-0"
            >
              <Coins size={14} /> Collect Custom / Bulk Payment
            </button>
          )}
        </div>
        
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Installment Due Date</th>
                  <th className="px-6 py-4">Base EMI Amount</th>
                  <th className="px-6 py-4">Remaining Balance</th>
                  <th className="px-6 py-4">Overdue Penalty</th>
                  <th className="px-6 py-4">Recovery Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {installments.map((inst, idx) => {
                  let rowBg = 'hover:bg-slate-50/50';
                  if (inst.status === 'Paid') rowBg = 'bg-emerald-50/20 hover:bg-emerald-50/40 text-emerald-800';
                  if (inst.status === 'Overdue') rowBg = 'bg-rose-50/20 hover:bg-rose-50/40 text-rose-800';
                  
                  return (
                    <tr key={inst._id} className={`${rowBg} transition`}>
                      <td className="px-6 py-4 text-slate-500 font-bold text-xs">{idx + 1}</td>
                      <td className="px-6 py-4 font-extrabold text-slate-850 text-xs">{new Date(inst.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="px-6 py-4 text-slate-600 font-bold text-xs">₹{inst.amount.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 font-black text-slate-850 text-xs">₹{inst.remainingAmount.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-rose-600 font-extrabold text-xs">{inst.penalty > 0 ? `+₹${inst.penalty}` : '—'}</td>
                      <td className="px-6 py-4">
                        {inst.status === 'Pending' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">Pending</span>
                        )}
                        {inst.status === 'Paid' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">Paid</span>
                        )}
                        {inst.status === 'Overdue' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                            <AlertTriangle size={10}/> Overdue
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          {inst.status !== 'Paid' ? (
                            <>
                              <button 
                                onClick={() => markPaid(inst._id)}
                                className="text-emerald-700 hover:bg-emerald-50 p-1.5 rounded-lg border border-transparent hover:border-emerald-100 transition cursor-pointer"
                                title="Mark as fully paid"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button 
                                onClick={() => {
                                  setEditingInst(inst._id);
                                  setEditFormData({ remainingAmount: inst.remainingAmount, penalty: inst.penalty, status: inst.status });
                                }}
                                className="text-blue-650 hover:bg-blue-50 p-1.5 rounded-lg border border-transparent hover:border-blue-100 transition cursor-pointer"
                                title="Edit manually"
                              >
                                <Edit2 size={16} />
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-emerald-600 text-xs font-black uppercase tracking-wider flex items-center gap-0.5 pr-2">✓ Settled</span>
                              <button 
                                onClick={() => openReceiptModal(inst, idx + 1)}
                                className="text-violet-700 hover:bg-violet-50 p-1.5 rounded-lg border border-transparent hover:border-violet-100 transition cursor-pointer flex items-center gap-1 text-[10px] font-black uppercase tracking-wider"
                                title="Generate Receipt"
                              >
                                <Printer size={13} /> Receipt
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="space-y-4 text-left">
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <Receipt size={18} className="text-violet-600" /> Payment & Collections History
        </h2>
        
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Receipt Number</th>
                  <th className="px-6 py-4">Collection Date</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4">Amount Paid</th>
                  <th className="px-6 py-4">Collected By</th>
                  <th className="px-6 py-4 text-right">Statements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {transactions.map((txn) => (
                  <tr key={txn._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">{txn.receiptNumber}</td>
                    <td className="px-6 py-4 text-slate-650">
                      {new Date(txn.collectedDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })} at {new Date(txn.collectedDate).toLocaleTimeString('en-IN', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        txn.paymentMode === 'UPI' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                        txn.paymentMode === 'Bank Transfer' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {txn.paymentMode}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-850">₹{txn.amount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {txn.collectorId?.name || 'Operator'} <span className="font-mono text-[9px] text-slate-400">({txn.collectorId?.employeeId || '—'})</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedTxn(txn);
                          setShowTxnModal(true);
                        }}
                        className="text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 border border-violet-100 px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 uppercase tracking-wider text-[9px] cursor-pointer ml-auto"
                      >
                        <Receipt size={12} /> View Slip
                      </button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-400 font-semibold italic bg-white">
                      No payments recorded yet in the digital transaction ledger.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Installment Modal (Redesigned with beautiful form card layout) */}
      {editingInst && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <div className="text-left">
                <h2 className="text-sm font-black text-slate-800 tracking-tight">Manual Installment Override</h2>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Edit this installment's ledger status manually</p>
              </div>
              <button 
                onClick={() => setEditingInst(null)} 
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition bg-white border border-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div className="text-left">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Remaining Amount (₹)</label>
                <input 
                  type="number" required 
                  className="premium-input"
                  value={editFormData.remainingAmount} 
                  onChange={e => setEditFormData({...editFormData, remainingAmount: e.target.value})} 
                />
              </div>
              <div className="text-left">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Overdue Penalty (₹)</label>
                <input 
                  type="number" required 
                  className="premium-input"
                  value={editFormData.penalty} 
                  onChange={e => setEditFormData({...editFormData, penalty: e.target.value})} 
                />
              </div>
              <div className="text-left">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Recovery Status</label>
                <select 
                  className="premium-select" 
                  value={editFormData.status} 
                  onChange={e => setEditFormData({...editFormData, status: e.target.value})}
                >
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              <div className="pt-4 flex gap-2 border-t border-slate-100 mt-5 bg-slate-50 -mx-5 -mb-5 p-4">
                <button 
                  type="button" 
                  onClick={() => setEditingInst(null)} 
                  className="w-1/2 bg-white text-slate-700 border border-slate-250 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition text-xs uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-2.5 rounded-xl font-bold transition text-xs uppercase tracking-wider cursor-pointer shadow-xs shadow-violet-500/10"
                >
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in print:bg-white print:p-0 text-left">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col print:shadow-none print:border-none print:w-full">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 print:hidden">
              <h2 className="text-sm font-black text-slate-800 tracking-tight uppercase tracking-wider">Payment Receipt</h2>
              <button 
                onClick={() => setSelectedReceipt(null)} 
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition bg-white border border-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Printable Area */}
            <div id="receipt-print-area" className="p-6 space-y-6 text-left text-slate-800 bg-white">
              {/* Receipt Branding */}
              <div className="text-center pb-4 border-b border-slate-100 flex flex-col items-center">
                <div className="w-12 h-12 mb-2 rounded-xl overflow-hidden bg-white flex items-center justify-center border border-slate-100 p-0.5 shadow-sm">
                  <img src="/Logo.jpeg" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-lg font-black tracking-tight text-slate-900">
                  EKAAKSHARA FINANCE SERVICES
                </h1>
                <p className="text-[9px] text-slate-450 font-extrabold uppercase tracking-wider mt-1">
                  Joint Liability Group Credit System
                </p>
                <p className="text-[9px] text-slate-500 font-semibold mt-0.5">
                  Assuring Rural Women Empowerment
                </p>
              </div>

              {/* Meta details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">Receipt Number</span>
                  <span className="font-extrabold text-slate-850">{receiptNumber}</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">Paid Date</span>
                  <span className="font-extrabold text-slate-850">
                    {new Date(selectedReceipt.paidDate || Date.now()).toLocaleDateString('en-IN', {
                      dateStyle: 'medium'
                    })}
                  </span>
                </div>
              </div>

              {/* Group particulars */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                <div>
                  <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">JLG Recipient Group</span>
                  <span className="font-extrabold text-slate-800">{loan.groupId?.name || 'Unknown Group'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-200/60">
                  <div>
                    <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">EMI Installment</span>
                    <span className="font-extrabold text-slate-700">#{installmentNum} of {loan.duration}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">Guarantor Link</span>
                    <span className="font-extrabold text-slate-700">Joint Liability</span>
                  </div>
                </div>
              </div>

              {/* Payment particulars */}
              <div className="space-y-2 text-xs">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100">Ledger Statement</h4>
                <div className="flex justify-between font-semibold text-slate-650">
                  <span>Base Installment Amount</span>
                  <span>₹{selectedReceipt.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-650">
                  <span>Overdue Penalty Fines</span>
                  <span className="text-rose-600">{selectedReceipt.penalty > 0 ? `+₹${selectedReceipt.penalty}` : '₹0'}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 pt-2 border-t border-slate-100 text-sm">
                  <span>Total Collected</span>
                  <span className="text-emerald-600">₹{(selectedReceipt.amount + (selectedReceipt.penalty || 0)).toLocaleString()}</span>
                </div>
              </div>

              {/* Transaction Status Flag */}
              <div className="flex items-center justify-center py-2.5 bg-emerald-50 border border-emerald-100 rounded-2xl gap-2 text-emerald-800">
                <CheckCircle size={16} className="text-emerald-600 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest">TRANSACTION SETTLED (PAID)</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2 print:hidden">
              <button 
                onClick={() => window.print()}
                className="w-1/2 bg-white text-slate-700 border border-slate-250 py-2.5 rounded-xl font-bold hover:bg-slate-100 transition text-xs uppercase tracking-wider cursor-pointer"
              >
                Print Receipt
              </button>
              <button 
                onClick={() => {
                  const message = `*Ekaakshara Finance Services Receipt*\n\n` +
                    `*Receipt No:* ${receiptNumber}\n` +
                    `*Group:* ${loan.groupId?.name || 'Unknown Group'}\n` +
                    `*Installment:* #${installmentNum}\n` +
                    `*Paid Date:* ${new Date(selectedReceipt.paidDate || Date.now()).toLocaleDateString()}\n` +
                    `*Amount Paid:* ₹${(selectedReceipt.amount + (selectedReceipt.penalty || 0)).toLocaleString()}\n\n` +
                    `Thank you for your payment! Joint liability groups ensure micro-credit sustainability.\n` +
                    `_Ekaakshara Finance Services Security System_`;
                  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
                  window.open(waUrl, '_blank');
                }}
                className="w-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-2.5 rounded-xl font-bold transition text-xs uppercase tracking-wider cursor-pointer shadow-xs shadow-violet-500/10"
              >
                Share WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Custom / Bulk Payment Modal */}
      {showCustomPaymentModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in text-left">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <div className="text-left">
                <h2 className="text-sm font-black text-slate-800 tracking-tight">Custom / Bulk Prepayment</h2>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Collect custom prepayments or clear the loan ledger</p>
              </div>
              <button 
                onClick={() => setShowCustomPaymentModal(false)} 
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition bg-white border border-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleCustomPaymentSubmit} className="p-5 space-y-4">
              <div className="text-left bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-650 font-bold">
                  <span>Regular EMI Amount:</span>
                  <span className="font-extrabold text-slate-800">₹{loan.emiAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-650 font-bold pt-1.5 border-t border-slate-200/60">
                  <span>Total Loan Outstanding:</span>
                  <span className="font-extrabold text-indigo-650">
                    ₹{installments
                      .filter(inst => inst.status !== 'Paid')
                      .reduce((sum, inst) => sum + inst.remainingAmount + (inst.penalty || 0), 0)
                      .toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="text-left">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Enter Collected Amount (₹) *</label>
                <input 
                  type="number" required 
                  className="premium-input"
                  placeholder="e.g. 5000"
                  value={customPaymentAmount} 
                  onChange={e => setCustomPaymentAmount(e.target.value)} 
                />
              </div>

              <div className="text-left">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Payment Mode *</label>
                <select 
                  required
                  value={customPaymentMode}
                  onChange={e => setCustomPaymentMode(e.target.value)}
                  className="premium-select w-full"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-2 text-left">
                <button
                  type="button"
                  onClick={() => setCustomPaymentAmount(loan.emiAmount * 2)}
                  className="px-2.5 py-1.5 bg-violet-50 hover:bg-violet-100 border border-violet-100 text-violet-700 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition shadow-xs"
                >
                  Pay 2 EMIs (₹{(loan.emiAmount * 2).toLocaleString('en-IN')})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const totalRemaining = installments
                      .filter(inst => inst.status !== 'Paid')
                      .reduce((sum, inst) => sum + inst.remainingAmount + (inst.penalty || 0), 0);
                    setCustomPaymentAmount(totalRemaining);
                  }}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition shadow-xs"
                >
                  Full Clearance
                </button>
              </div>

              <div className="pt-4 flex gap-2 border-t border-slate-100 mt-5 bg-slate-50 -mx-5 -mb-5 p-4">
                <button 
                  type="button" 
                  onClick={() => setShowCustomPaymentModal(false)} 
                  className="w-1/2 bg-white text-slate-700 border border-slate-250 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition text-xs uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingCustomPayment}
                  className="w-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-2.5 rounded-xl font-bold transition text-xs uppercase tracking-wider cursor-pointer shadow-xs shadow-emerald-500/10"
                >
                  {savingCustomPayment ? 'Processing...' : 'Collect Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real Transaction Receipt Modal */}
      <ReceiptModal 
        isOpen={showTxnModal}
        transaction={selectedTxn}
        onClose={() => { setShowTxnModal(false); setSelectedTxn(null); }}
      />
    </div>
  );
};


export default LoanDetails;
