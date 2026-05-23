import React, { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { IndianRupee, Users, TrendingUp, CheckCircle, Clock, Calendar, ShieldCheck, ArrowUpRight, TrendingDown } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/dashboard/stats');
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-violet-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-semibold text-sm animate-pulse">Syncing dashboard statistics...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-red-100 p-8 max-w-lg mx-auto">
        <p className="text-red-650 font-bold text-base mb-2">Sync Failed</p>
        <p className="text-slate-500 text-sm">Failed to connect to the database ledger. Please verify the backend service status.</p>
      </div>
    );
  }

  const cards = [
    { 
      title: 'Total Loans Disbursed', 
      value: stats.totalLoansCount, 
      desc: 'Joint Liability Groups',
      icon: <Users size={20} />, 
      color: 'bg-violet-50 text-violet-600 border-violet-100',
      glow: 'shadow-violet-500/5'
    },
    { 
      title: 'Principal Disbursed', 
      value: `₹${stats.totalMoneyGiven.toLocaleString('en-IN')}`, 
      desc: 'Active portfolio capital',
      icon: <TrendingUp size={20} />, 
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      glow: 'shadow-indigo-500/5'
    },
    { 
      title: 'Principal Collected', 
      value: `₹${stats.totalCollected.toLocaleString('en-IN')}`, 
      desc: 'Total repayments settled',
      icon: <CheckCircle size={20} />, 
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      glow: 'shadow-emerald-500/5'
    },
    { 
      title: 'Pending Recovery', 
      value: `₹${stats.pendingAmount.toLocaleString('en-IN')}`, 
      desc: 'Outstanding ledger balance',
      icon: <Clock size={20} />, 
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      glow: 'shadow-amber-500/5'
    },
  ];

  // Calculate percentage of recovery
  const totalGiven = stats.totalMoneyGiven || 1;
  const recoveryRate = ((stats.totalCollected / totalGiven) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      
      {/* Dynamic Welcome Greeting Panel */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-violet-500/20 text-violet-300 border border-violet-500/35">
              <ShieldCheck size={12} /> Systems Online
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Namaste, {user?.name || 'Operator'}
            </h1>
            <p className="text-slate-350 text-xs md:text-sm font-medium">
              Here is the updated group microfinance portfolio status. Review collections, groups, and joint liabilities.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 shrink-0">
            <Calendar size={18} className="text-violet-400" />
            <div className="text-left">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">Operations Date</p>
              <span className="text-xs font-bold text-slate-200 mt-1 block">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Portfolio Quick Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, index) => (
          <div 
            key={index} 
            className={`bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 shadow-sm ${card.glow}`}
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{card.title}</span>
              <div className={`p-2.5 rounded-xl border ${card.color}`}>
                {card.icon}
              </div>
            </div>
            <div className="mt-4 text-left">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{card.value}</h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-1">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Analytical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Loan Status & Rate Visualization */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm shadow-slate-100/50 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
              Portfolio Quality
            </h3>
            <p className="text-xs text-slate-500 font-medium">Repayment recovery efficiency rate</p>
          </div>
          
          <div className="py-6 flex flex-col items-center justify-center">
            <div className="relative w-36 h-36 flex items-center justify-center rounded-full bg-slate-50 border border-slate-100 glow-success">
              <div className="text-center">
                <span className="text-3xl font-black text-slate-800 tracking-tighter">{recoveryRate}%</span>
                <span className="text-[9px] font-extrabold text-emerald-600 block mt-1 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Recovery Rate</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Target Recovery</span>
              <span className="text-slate-800">100%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${recoveryRate}%` }} />
            </div>
          </div>
        </div>

        {/* Loan Status Count Panel */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm shadow-slate-100/50 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Loan Status Roster</h3>
            <p className="text-xs text-slate-500 font-medium">Breakdown of Joint Liability Group loan accounts</p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-6">
            <div className="bg-blue-50/40 border border-blue-100/50 rounded-2xl p-5 text-center transition-all hover:bg-blue-50/60">
              <p className="text-4xl font-black text-blue-600 tracking-tighter mb-1">{stats.activeLoans}</p>
              <p className="text-xs text-slate-500 font-extrabold uppercase tracking-wider">Active Loans</p>
              <p className="text-[10px] text-blue-500 font-medium mt-1">Repayments ongoing</p>
            </div>
            
            <div className="bg-emerald-50/40 border border-emerald-100/50 rounded-2xl p-5 text-center transition-all hover:bg-emerald-50/60">
              <p className="text-4xl font-black text-emerald-600 tracking-tighter mb-1">{stats.completedLoans}</p>
              <p className="text-xs text-slate-500 font-extrabold uppercase tracking-wider">Completed Loans</p>
              <p className="text-[10px] text-emerald-500 font-medium mt-1">Fully settled ledger</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-600 font-bold">Joint liability portfolio secure</span>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">ZenLoan Active</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
