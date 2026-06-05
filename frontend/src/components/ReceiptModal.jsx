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
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocker is preventing opening the receipt in a new tab. Please allow popups for this site.');
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt - ${receiptNumber}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #4f46e5;
      --success: #10b981;
      --success-bg: #ecfdf5;
      --success-border: #d1fae5;
      --text-main: #1e293b;
      --text-muted: #64748b;
      --text-light: #94a3b8;
      --bg-page: #f8fafc;
      --bg-card: #ffffff;
      --border-color: #e2e8f0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: radial-gradient(circle at top, #f8fafc 0%, #e2e8f0 100%);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      -webkit-font-smoothing: antialiased;
    }

    .container {
      width: 100%;
      max-width: 440px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .action-bar {
      display: flex;
      gap: 1rem;
      justify-content: center;
      width: 100%;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      font-family: inherit;
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3);
    }

    .btn-secondary {
      background: white;
      color: var(--text-main);
      border: 1px solid var(--border-color);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
    }

    .btn-secondary:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    /* Receipt Card */
    .receipt-card {
      background: var(--bg-card);
      border-radius: 24px;
      border: 1px solid rgba(226, 232, 240, 0.8);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      padding: 2.5rem;
      position: relative;
      overflow: hidden;
    }

    /* Decorative Top Bar */
    .receipt-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #6366f1, #4f46e5);
    }

    /* Header */
    .receipt-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding-bottom: 1.5rem;
      border-bottom: 1px dashed var(--border-color);
    }

    .logo-container {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      overflow: hidden;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border-color);
      padding: 2px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      margin-bottom: 0.75rem;
    }

    .logo-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .company-name {
      font-size: 1rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      text-transform: uppercase;
    }

    .sub-brand {
      font-size: 0.625rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 0.25rem;
    }

    .status-badge {
      margin-top: 1rem;
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.875rem;
      border-radius: 9999px;
      background-color: var(--success-bg);
      color: #065f46;
      border: 1px solid var(--success-border);
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      background-color: var(--success);
      border-radius: 50%;
    }

    /* Content */
    .receipt-body {
      padding: 1.5rem 0;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8125rem;
    }

    .info-label {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .info-value {
      font-weight: 600;
      color: var(--text-main);
    }

    .mono-val {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 0.75rem;
    }

    .grid-2 {
      display: grid;
      grid-template-cols: 1fr 1fr;
      gap: 1rem;
    }

    .card-divider {
      height: 1px;
      background: var(--border-color);
      margin: 0.25rem 0;
    }

    .total-box {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.5rem;
    }

    .total-label-container {
      display: flex;
      flex-direction: column;
    }

    .total-label {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .total-sub {
      font-size: 0.625rem;
      color: var(--text-light);
      font-weight: 500;
      margin-top: 0.125rem;
    }

    .total-amount {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
    }

    .footer-note {
      text-align: center;
      padding-top: 1.25rem;
      border-top: 1px dashed var(--border-color);
      font-size: 0.625rem;
      font-weight: 700;
      color: var(--text-light);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Print styling */
    @media print {
      body {
        background: white !important;
        padding: 0 !important;
        margin: 0 !important;
        display: block !important;
      }
      .action-bar {
        display: none !important;
      }
      .container {
        max-width: 100% !important;
      }
      .receipt-card {
        border: none !important;
        box-shadow: none !important;
        padding: 2cm !important;
        border-radius: 0 !important;
      }
      .receipt-card::before {
        display: none !important;
      }
      @page {
        size: A4 portrait;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="action-bar">
      <button class="btn btn-primary" onclick="window.print()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Print / Save PDF
      </button>
      <button class="btn btn-secondary" onclick="window.close()">
        Close Window
      </button>
    </div>

    <div class="receipt-card">
      <div class="receipt-header">
        <div class="logo-container">
          <img class="logo-img" src="${window.location.origin}/Logo.jpeg" alt="Ekaakshara Logo" />
        </div>
        <h2 class="company-name">Ekaakshara Finance Services</h2>
        <p class="sub-brand">JLG Micro-Lending Portal</p>
        
        <div class="status-badge">
          <span class="status-dot"></span>
          Payment Successful
        </div>
      </div>

      <div class="receipt-body">
        <div class="info-row">
          <span class="info-label">Receipt Number</span>
          <span class="info-value mono-val">${receiptNumber}</span>
        </div>

        <div class="card-divider"></div>

        <div class="grid-2">
          <div>
            <span class="info-label" style="display: block; margin-bottom: 0.25rem;">Date</span>
            <span class="info-value" style="font-size: 0.8125rem;">${formattedDate}</span>
          </div>
          <div style="text-align: right;">
            <span class="info-label" style="display: block; margin-bottom: 0.25rem;">Time</span>
            <span class="info-value" style="font-size: 0.8125rem;">${formattedTime}</span>
          </div>
        </div>

        <div class="card-divider"></div>

        <div class="grid-2">
          <div>
            <span class="info-label" style="display: block; margin-bottom: 0.25rem;">JLG Group Roster</span>
            <span class="info-value" style="font-size: 0.8125rem; text-transform: uppercase;">${groupName}</span>
          </div>
          <div style="text-align: right;">
            <span class="info-label" style="display: block; margin-bottom: 0.25rem;">Payment Mode</span>
            <span class="info-value" style="font-size: 0.8125rem;">${paymentMode}</span>
          </div>
        </div>

        <div class="card-divider"></div>

        <div>
          <span class="info-label" style="display: block; margin-bottom: 0.25rem;">Field Operations Collector</span>
          <span class="info-value" style="font-size: 0.8125rem;">
            ${collectorName} <span style="color: var(--text-light); font-family: monospace; font-size: 0.75rem;">(${employeeId})</span>
          </span>
        </div>

        <div class="total-box">
          <div class="total-label-container">
            <span class="total-label">Collected Amount</span>
            <span class="total-sub">EMI & Overdue Dues Covered</span>
          </div>
          <span class="total-amount">₹${amount.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div class="footer-note">
        This is a system generated digital receipt
      </div>
    </div>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>
`;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
