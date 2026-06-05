import React from 'react';
import { X, Printer, Share2, ShieldCheck, CheckCircle2, Receipt, Calendar, CreditCard, User, Layers } from 'lucide-react';

const ReceiptModal = ({ isOpen, transaction, onClose }) => {
  if (!isOpen || !transaction) return null;

  const {
    receiptNumber,
    collectedDate,
    amount,
    paymentMode,
    loanId,
    collectorId
  } = transaction;

  const groupName = loanId?.groupId?.name || 'Unknown Group';
  const collectorName = collectorId?.name || 'Unknown Collector';
  const employeeId = collectorId?.employeeId || '—';

  const dateObj = new Date(collectedDate);
  const formattedDate = dateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const formattedTime = dateObj.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Pre-filled WhatsApp message URL
  const generateWhatsAppUrl = () => {
    const textMessage = `*Ekaakshara Finance Services - Payment Receipt*\n\n` +
      `*Receipt No:* ${receiptNumber}\n` +
      `*Date:* ${formattedDate} at ${formattedTime}\n` +
      `*Group:* ${groupName}\n` +
      `*Collected Amount:* ₹${amount.toLocaleString('en-IN')}\n` +
      `*Payment Mode:* ${paymentMode}\n` +
      `*Received By:* ${collectorName} (${employeeId})\n\n` +
      `Thank you for your payment. Joint liability parameters are fully updated.`;
    
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(textMessage)}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-99 animate-fade-in no-print">
      <div className="bg-white w-full max-w-md rounded-3xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative animate-scale-up">
        {/* Header toolbar */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800">
            <Receipt size={18} className="text-violet-600" />
            <span className="text-xs font-black uppercase tracking-wider">Transaction Receipt</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer bg-white border border-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable Receipt area */}
        <div className="p-6 overflow-y-auto flex-1 text-left" id="printable-receipt">
          <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
            <div className="w-12 h-12 mb-2 rounded-xl overflow-hidden bg-white flex items-center justify-center border border-slate-100 p-0.5 shadow-sm">
              <img src="/Logo.jpeg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-md font-black text-slate-850 tracking-tight uppercase tracking-wide">Ekaakshara Finance Services</h2>
            <p className="text-[9px] text-slate-450 font-extrabold uppercase mt-0.5 tracking-wider">JLG Micro-Lending Portal</p>
            
            <div className="mt-4 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck size={12} /> Payment Successful
            </div>
          </div>

          <div className="py-6 space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Receipt Number</span>
              <span className="font-mono text-xs font-bold text-slate-800">{receiptNumber}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Date</span>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Calendar size={12} className="text-slate-400" /> {formattedDate}
                </span>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Time</span>
                <span className="text-xs font-bold text-slate-800">{formattedTime}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">JLG Group Roster</span>
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1 uppercase tracking-wide">
                  <Layers size={12} className="text-violet-500" /> {groupName}
                </span>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Payment Mode</span>
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1 justify-end">
                  <CreditCard size={12} className="text-indigo-500" /> {paymentMode}
                </span>
              </div>
            </div>

            <div className="space-y-0.5 pt-2 border-t border-slate-50">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Field Operations Collector</span>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User size={12} className="text-slate-400" /> {collectorName} <span className="font-mono text-[10px] text-slate-400">({employeeId})</span>
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center mt-6">
              <div>
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Collected Amount</span>
                <span className="text-[10px] text-slate-450 block font-bold">EMI & Overdue Dues Covered</span>
              </div>
              <span className="text-xl font-black text-slate-805 font-sans">₹{amount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">This is a system generated digital receipt.</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3.5 no-print">
          <button
            onClick={handlePrint}
            className="w-1/2 bg-white text-slate-705 border border-slate-250 py-2.5 rounded-xl font-bold hover:bg-slate-100 transition text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Printer size={14} /> Print / Save PDF
          </button>
          
          <a
            href={generateWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold transition text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 text-center"
          >
            <Share2 size={14} /> Share WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
