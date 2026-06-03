import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { 
  ClipboardList, Calendar, DollarSign, Check, Users, 
  AlertCircle, Clock, CheckCircle2, ChevronRight, X
} from 'lucide-react';

const Tasks = () => {
  const { user } = useContext(AuthContext);
  
  // Date selection state (defaults to today's date in local time YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Custom Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeInstallment, setActiveInstallment] = useState(null);
  const [collectedAmount, setCollectedAmount] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Non-Payment Reason modal states
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [activeDelayInstallment, setActiveDelayInstallment] = useState(null);
  const [savingDelayReason, setSavingDelayReason] = useState(false);

  useEffect(() => {
    fetchInstallments();
  }, []);

  const fetchInstallments = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/installments');
      setInstallments(data);
    } catch (err) {
      console.error('Error fetching installments:', err);
      setError('Failed to fetch installments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick action: mark installment fully paid
  const handleMarkPaid = async (inst) => {
    const totalDue = inst.remainingAmount + inst.penalty;
    if (!window.confirm(`Mark installment for "${inst.loanId?.groupId?.name || 'Group'}" as fully paid (Collected: ₹${totalDue.toLocaleString('en-IN')})?`)) {
      return;
    }

    try {
      await api.put(`/installments/${inst._id}`, { 
        remainingAmount: 0, 
        penalty: 0,
        status: 'Paid'
      });
      alert('Payment recorded successfully!');
      fetchInstallments();
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording payment');
    }
  };

  // Custom payment handlers
  const handleOpenPaymentModal = (inst) => {
    setActiveInstallment(inst);
    // Set default value to total remaining due
    setCollectedAmount(String(inst.remainingAmount + inst.penalty));
    setShowPaymentModal(true);
  };

  const handleCustomPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!activeInstallment) return;

    const amt = parseFloat(collectedAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid positive payment amount');
      return;
    }

    const maxAmt = activeInstallment.remainingAmount + activeInstallment.penalty;
    if (amt > maxAmt) {
      alert(`Payment amount cannot exceed the total due (₹${maxAmt})`);
      return;
    }

    setProcessingPayment(true);
    try {
      // Calculate new penalty and remainingAmount
      let remainingPayment = amt;
      let newPenalty = activeInstallment.penalty;
      let newRemainingAmount = activeInstallment.remainingAmount;

      // 1. Deduct from penalty first
      if (newPenalty > 0) {
        const penaltyPaid = Math.min(newPenalty, remainingPayment);
        newPenalty -= penaltyPaid;
        remainingPayment -= penaltyPaid;
      }

      // 2. Deduct from remaining amount
      if (remainingPayment > 0) {
        newRemainingAmount = Math.max(0, newRemainingAmount - remainingPayment);
      }

      const status = newRemainingAmount <= 0 ? 'Paid' : activeInstallment.status;

      await api.put(`/installments/${activeInstallment._id}`, {
        remainingAmount: newRemainingAmount,
        penalty: newPenalty,
        status
      });

      alert('Collection recorded successfully!');
      setShowPaymentModal(false);
      setActiveInstallment(null);
      fetchInstallments();
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording custom payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Non-Payment Reason handlers
  const handleOpenDelayModal = (inst) => {
    setActiveDelayInstallment(inst);
    setShowDelayModal(true);
  };

  const handleSaveDelayReason = async (reason) => {
    if (!activeDelayInstallment) return;
    setSavingDelayReason(true);
    try {
      await api.put(`/installments/${activeDelayInstallment._id}`, {
        nonPaymentReason: reason
      });
      alert('Non-payment reason recorded successfully!');
      setShowDelayModal(false);
      setActiveDelayInstallment(null);
      fetchInstallments();
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording reason');
    } finally {
      setSavingDelayReason(false);
    }
  };

  const getLocalDateString = (dateObjOrStr) => {
    if (!dateObjOrStr) return '';
    const date = new Date(dateObjOrStr);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Filter and segment installments based on selected date
  const targetDateStr = selectedDate; // "YYYY-MM-DD"

  // Segments:
  // 1. Overdue: Status is not Paid, due date is before selected date
  const overdueList = installments.filter(inst => {
    if (inst.status === 'Paid') return false;
    const dueDateStr = inst.dueDate ? getLocalDateString(inst.dueDate) : '';
    return dueDateStr < targetDateStr;
  });

  // 2. Due Today: Status is not Paid, due date is exactly selected date
  const dueTodayList = installments.filter(inst => {
    if (inst.status === 'Paid') return false;
    const dueDateStr = inst.dueDate ? getLocalDateString(inst.dueDate) : '';
    return dueDateStr === targetDateStr;
  });

  // 3. Collected Today: Status is Paid, and paidDate (or update date) matches selected date
  const collectedTodayList = installments.filter(inst => {
    if (inst.status !== 'Paid') return false;
    const paidDateStr = inst.paidDate ? getLocalDateString(inst.paidDate) : '';
    return paidDateStr === targetDateStr;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <ClipboardList size={26} className="text-violet-650 shrink-0" />
            Today's Collection Tasks
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage, collect, and review outstanding group EMIs assigned to you</p>
        </div>
        
        {/* Date Selector */}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-150">
          <Calendar size={16} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Date:</span>
          <input 
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-transparent border-none text-xs font-black text-slate-800 focus:outline-hidden cursor-pointer"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-100 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 font-medium italic border border-slate-100">
          Loading your daily collection workbook...
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* 1. OVERDUE WORKBOOK (Critical) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <h2 className="text-sm font-black text-slate-850 uppercase tracking-widest flex items-center gap-1.5">
                Overdue Collections ({overdueList.length})
              </h2>
            </div>
            
            {overdueList.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-slate-400 font-medium italic border border-slate-100 shadow-xs">
                Excellent! No overdue installments outstanding before {selectedDate}.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {overdueList.map(inst => (
                  <InstallmentCard 
                    key={inst._id} 
                    inst={inst} 
                    onMarkPaid={handleMarkPaid} 
                    onCollectCustom={handleOpenPaymentModal}
                    onRecordDelay={handleOpenDelayModal}
                    isOverdue={true}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 2. DUE TODAY */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-850 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-600"></span>
              Due Today ({dueTodayList.length})
            </h2>
            
            {dueTodayList.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-slate-400 font-medium italic border border-slate-100 shadow-xs">
                No new installments scheduled for collection on {selectedDate}.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dueTodayList.map(inst => (
                  <InstallmentCard 
                    key={inst._id} 
                    inst={inst} 
                    onMarkPaid={handleMarkPaid} 
                    onCollectCustom={handleOpenPaymentModal}
                    onRecordDelay={handleOpenDelayModal}
                    isOverdue={false}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 3. COLLECTED TODAY */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-850 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Collected Today ({collectedTodayList.length})
            </h2>
            
            {collectedTodayList.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-slate-400 font-medium italic border border-slate-100 shadow-xs">
                No collections recorded yet for {selectedDate}.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collectedTodayList.map(inst => (
                  <CollectedCard key={inst._id} inst={inst} />
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Custom Payment Modal */}
      {showPaymentModal && activeInstallment && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-100 shadow-2xl p-6 relative animate-scale-up text-left">
            <button 
              onClick={() => { setShowPaymentModal(false); setActiveInstallment(null); }}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-650 transition cursor-pointer"
            >
              <X size={16} />
            </button>

            <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              <DollarSign size={20} className="text-violet-650" />
              Record Collection
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Group: <strong>{activeInstallment.loanId?.groupId?.name}</strong>
            </p>

            <form onSubmit={handleCustomPaymentSubmit} className="mt-4 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>EMI Amount:</span>
                  <span className="text-slate-800">₹{activeInstallment.remainingAmount.toLocaleString('en-IN')}</span>
                </div>
                {activeInstallment.penalty > 0 && (
                  <div className="flex justify-between text-xs font-semibold text-slate-500">
                    <span>Penalty:</span>
                    <span className="text-rose-650">₹{activeInstallment.penalty.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="border-t border-slate-200/60 pt-2 flex justify-between text-xs font-black text-slate-700">
                  <span>Total Due:</span>
                  <span>₹{(activeInstallment.remainingAmount + activeInstallment.penalty).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Collected Amount (₹) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  min="0.01"
                  max={activeInstallment.remainingAmount + activeInstallment.penalty}
                  value={collectedAmount}
                  onChange={e => setCollectedAmount(e.target.value)}
                  className="premium-input w-full text-lg font-black text-slate-800"
                  placeholder="Enter collected amount"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowPaymentModal(false); setActiveInstallment(null); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-650 px-4 py-2.5 rounded-xl text-xs font-bold transition uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingPayment}
                  className="flex-1 bg-violet-600 hover:bg-violet-750 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition uppercase shadow-md shadow-violet-500/10 cursor-pointer"
                >
                  {processingPayment ? 'Recording...' : 'Submit Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delay Reason Modal */}
      {showDelayModal && activeDelayInstallment && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-100 shadow-2xl p-6 relative animate-scale-up text-left">
            <button 
              onClick={() => { setShowDelayModal(false); setActiveDelayInstallment(null); }}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-655 transition cursor-pointer"
            >
              <X size={16} />
            </button>

            <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              <AlertCircle size={20} className="text-amber-500" />
              Record Non-Payment Reason
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select the reason why <strong>{activeDelayInstallment.loanId?.groupId?.name}</strong> did not pay their EMI of ₹{(activeDelayInstallment.remainingAmount + activeDelayInstallment.penalty).toLocaleString('en-IN')}.
            </p>

            {/* Predefined reason buttons */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              {[
                { label: 'Out of Town', icon: '🏠' },
                { label: 'Financial Crisis', icon: '💸' },
                { label: 'Medical Emergency', icon: '🏥' },
                { label: 'Absent', icon: '🏃' },
                { label: 'Refused to Pay', icon: '🛑' },
                { label: 'Other', icon: '📝' }
              ].map(item => (
                <button
                  key={item.label}
                  type="button"
                  disabled={savingDelayReason}
                  onClick={() => handleSaveDelayReason(item.label)}
                  className="p-3 border border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 rounded-xl text-xs font-bold text-slate-700 flex flex-col items-center gap-2 transition active:scale-97 cursor-pointer"
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => { setShowDelayModal(false); setActiveDelayInstallment(null); }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-650 py-2.5 rounded-xl text-xs font-bold transition uppercase cursor-pointer text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component: Active/Pending/Overdue Installment Card
const InstallmentCard = ({ inst, onMarkPaid, onCollectCustom, onRecordDelay, isOverdue }) => {
  const group = inst.loanId?.groupId;
  const numMembers = group?.members?.length || 1;
  const totalDue = inst.remainingAmount + inst.penalty;
  const splitShare = Math.round((inst.amount / numMembers) * 100) / 100;
  
  const dueDateFormatted = inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : '';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-250 p-5 flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        {/* Card Header */}
        <div className="flex justify-between items-start gap-2">
          <div className="text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-extrabold bg-violet-50 text-violet-700 border border-violet-100 uppercase tracking-wide">
              <Users size={11} /> {group?.name || 'Unknown Group'}
            </span>
          </div>
          
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
            isOverdue 
              ? 'bg-rose-50 text-rose-700 border border-rose-100' 
              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
          }`}>
            {isOverdue ? (
              <>
                <AlertCircle size={10} /> Overdue
              </>
            ) : (
              <>
                <Clock size={10} /> Pending
              </>
            )}
          </span>
        </div>

        {/* Due Amount info */}
        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 flex justify-between items-center text-left">
          <div>
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Remaining Due</span>
            <span className="text-lg font-black text-slate-800">₹{totalDue.toLocaleString('en-IN')}</span>
          </div>
          <div className="text-right text-xs text-slate-500 font-semibold space-y-0.5">
            <div>EMI: ₹{inst.remainingAmount.toLocaleString('en-IN')}</div>
            {inst.penalty > 0 && <div className="text-rose-650">Penalty: ₹{inst.penalty.toLocaleString('en-IN')}</div>}
          </div>
        </div>

        {/* Delay Reason Banner */}
        {inst.nonPaymentReason && (
          <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-xl p-2.5 text-xs font-semibold flex items-center gap-1.5 text-left">
            <AlertCircle size={14} className="text-amber-500 shrink-0" />
            <span>Reason: <strong>{inst.nonPaymentReason}</strong></span>
          </div>
        )}

        {/* Member Roster & Split */}
        <div className="space-y-1.5 text-left border-t border-slate-100 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Member Split Share</span>
            <span className="text-[10px] font-black text-slate-700">₹{splitShare.toLocaleString('en-IN')} / member</span>
          </div>
          
          {/* Members list */}
          <div className="flex flex-wrap gap-1.5 max-h-[64px] overflow-y-auto scrollbar-thin pr-1">
            {group?.members && group.members.map(m => (
              <span key={m._id} className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-150 px-2 py-0.5 rounded-md">
                {m.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Card Footer (Actions) */}
      <div className="border-t border-slate-50 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
          Due: {dueDateFormatted}
        </span>
        
        <div className="flex flex-wrap gap-1.5 shrink-0 justify-end">
          <button
            onClick={() => onRecordDelay(inst)}
            className="text-[10px] font-extrabold uppercase tracking-wider border border-amber-250 hover:bg-amber-50/20 text-amber-700 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
            title="Record Non-Payment Reason"
          >
            Delay Reason
          </button>
          <button
            onClick={() => onCollectCustom(inst)}
            className="text-[10px] font-extrabold uppercase tracking-wider border border-slate-200 hover:bg-slate-50 text-slate-650 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
          >
            Partial
          </button>
          
          <button
            onClick={() => onMarkPaid(inst)}
            className="text-[10px] font-extrabold uppercase tracking-wider bg-violet-600 hover:bg-violet-750 text-white px-2.5 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <Check size={11} /> Mark Paid
          </button>
        </div>
      </div>
    </div>
  );
};

// Sub-component: Collected/Paid Installment Card
const CollectedCard = ({ inst }) => {
  const group = inst.loanId?.groupId;
  
  const paidDateFormatted = inst.paidDate ? new Date(inst.paidDate).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }) : '';

  return (
    <div className="bg-emerald-50/20 rounded-2xl border border-emerald-100 shadow-xs p-5 flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        {/* Card Header */}
        <div className="flex justify-between items-start gap-2">
          <div className="text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-150 uppercase tracking-wide">
              <Users size={11} /> {group?.name || 'Unknown Group'}
            </span>
          </div>
          
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={10} className="text-emerald-650" /> Collected
          </span>
        </div>

        {/* Paid Amount */}
        <div className="bg-emerald-50/50 border border-emerald-100/60 rounded-xl p-3 flex justify-between items-center text-left">
          <div>
            <span className="text-[9px] text-emerald-600 font-extrabold uppercase tracking-wider block">Collected Amount</span>
            <span className="text-lg font-black text-emerald-850">₹{inst.amount.toLocaleString('en-IN')}</span>
          </div>
          
          <div className="text-right text-[10px] font-bold text-slate-400">
            Received: {paidDateFormatted}
          </div>
        </div>
      </div>

      <div className="border-t border-emerald-100/40 pt-3 flex items-center justify-between">
        <span className="text-[10px] text-slate-405 font-bold">
          Loan Ledger Reference
        </span>
        <ChevronRight size={14} className="text-emerald-400" />
      </div>
    </div>
  );
};

export default Tasks;
