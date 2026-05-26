import React, { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { 
  IndianRupee, Users, TrendingUp, CheckCircle, Clock, Calendar, 
  ShieldCheck, ArrowUpRight, AlertCircle, Layers, RefreshCw, 
  ChevronRight, UserCheck, Play, UserX, AlertTriangle, Activity,
  Briefcase
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const { data } = await api.get('/dashboard/stats');
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderDailyChart = (data) => {
    if (!data || data.length === 0) return null;
    const maxVal = Math.max(...data.map(d => d.amount), 100);
    const width = 500;
    const height = 200;
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Generate points coordinates
    const divisor = data.length > 1 ? data.length - 1 : 1;
    const points = data.map((d, index) => {
      const x = paddingLeft + (index / divisor) * chartWidth;
      const y = paddingTop + chartHeight - (d.amount / maxVal) * chartHeight;
      return { x, y, amount: d.amount, label: d.date };
    });

    let linePath = '';
    let fillPath = '';

    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y}`;
      points.forEach((p, index) => {
        if (index > 0) {
          linePath += ` L ${p.x} ${p.y}`;
        }
      });
      fillPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
    }

    return (
      <div className="w-full text-left bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-600 animate-ping"></span>
            Daily Collection Chart
          </h4>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Repayment collections recorded over the last 7 operations days</p>
        </div>

        <div className="relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const y = paddingTop + ratio * chartHeight;
              const value = Math.round(maxVal - ratio * maxVal);
              return (
                <g key={index} className="opacity-30">
                  <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
                  <text x={paddingLeft - 8} y={y + 3} className="text-[8px] font-bold fill-slate-400" textAnchor="end">
                    ₹{value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}
                  </text>
                </g>
              );
            })}

            {/* Fill Area */}
            {fillPath && <path d={fillPath} fill="url(#chartAreaGradient)" />}

            {/* Line Path */}
            {linePath && <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

            {/* Dots & Labels */}
            {points.map((p, index) => (
              <g key={index} className="group cursor-pointer">
                <circle cx={p.x} cy={p.y} r="3.5" className="fill-white stroke-violet-600 stroke-[2] transition-all group-hover:r-[5]" />
                <circle cx={p.x} cy={p.y} r="10" className="fill-transparent opacity-0" />
                <text x={p.x} y={paddingTop + chartHeight + 14} className="text-[8px] font-black fill-slate-400" textAnchor="middle">
                  {p.label}
                </text>
                
                {/* Custom Tooltip */}
                <g className="opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                  <rect x={p.x - 35} y={p.y - 26} width="70" height="18" rx="6" className="fill-slate-900/90 backdrop-blur-xs" />
                  <text x={p.x} y={p.y - 14} className="text-[8px] font-extrabold fill-white" textAnchor="middle">
                    ₹{p.amount.toLocaleString()}
                  </text>
                </g>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  const renderMonthlyChart = (data) => {
    if (!data || data.length === 0) return null;
    const maxVal = Math.max(...data.map(d => d.profit), 100);
    const width = 500;
    const height = 200;
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const barWidth = 24;
    const groupSpacing = chartWidth / data.length;

    const bars = data.map((d, index) => {
      const x = paddingLeft + index * groupSpacing + (groupSpacing - barWidth) / 2;
      const barHeight = (d.profit / maxVal) * chartHeight;
      const y = paddingTop + chartHeight - barHeight;
      return { x, y, width: barWidth, height: barHeight, profit: d.profit, label: d.month };
    });

    return (
      <div className="w-full text-left bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            Monthly Profit Chart
          </h4>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Calculated estimated interest profits over the last 6 months</p>
        </div>

        <div className="relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const y = paddingTop + ratio * chartHeight;
              const value = Math.round(maxVal - ratio * maxVal);
              return (
                <g key={index} className="opacity-30">
                  <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
                  <text x={paddingLeft - 8} y={y + 3} className="text-[8px] font-bold fill-slate-400" textAnchor="end">
                    ₹{value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {bars.map((bar, index) => (
              <g key={index} className="group cursor-pointer">
                <rect
                  x={bar.x}
                  y={bar.y}
                  width={bar.width}
                  height={bar.height || 2}
                  rx="4"
                  ry="4"
                  className="fill-[url(#barGradient)] hover:opacity-85 transition-opacity duration-200"
                />
                <text x={bar.x + bar.width / 2} y={paddingTop + chartHeight + 14} className="text-[8px] font-black fill-slate-400" textAnchor="middle">
                  {bar.label}
                </text>
                {/* Floating amount label */}
                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <rect x={bar.x - 18} y={bar.y - 22} width="60" height="15" rx="4" className="fill-slate-900/90" />
                  <text x={bar.x + bar.width / 2} y={bar.y - 12} className="text-[8px] font-extrabold fill-white" textAnchor="middle">
                    ₹{bar.profit.toLocaleString()}
                  </text>
                </g>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-violet-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-bold text-xs animate-pulse uppercase tracking-wider">Syncing Dashboard Data...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-rose-100 p-8 max-w-lg mx-auto shadow-sm text-left">
        <AlertCircle size={32} className="text-rose-500 mb-4" />
        <h3 className="text-base font-black text-slate-800">Connection Interrupted</h3>
        <p className="text-xs text-slate-500 mt-2">We could not pull the administrative portfolio datasets. Please confirm that your Render backend database client has booted correctly.</p>
        <button 
          onClick={() => fetchStats()} 
          className="mt-6 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition cursor-pointer uppercase tracking-wider"
        >
          <RefreshCw size={14} /> Reconnect Ledger
        </button>
      </div>
    );
  }

  const isAdmin = stats.role === 'Admin';

  return (
    <div className="space-y-6 animate-fade-in text-left">
      
      {/* Header Panel */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="space-y-2 text-left z-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-violet-500/20 text-violet-300 border border-violet-500/35">
              <ShieldCheck size={12} /> {isAdmin ? 'System Administrator' : 'Staff Operations'}
            </span>
            {refreshing && (
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest animate-pulse flex items-center gap-1">
                <RefreshCw size={10} className="animate-spin" /> Syncing...
              </span>
            )}
          </div>
          <h1 className="text-xl md:text-3xl font-black tracking-tight leading-none">
            Namaste, {user?.name || 'Authorized Operator'}
          </h1>
          <p className="text-slate-400 text-xs font-medium max-w-xl">
            {isAdmin 
              ? 'Authorized administrative oversight console. Manage microfinance loans, portfolio quality, and staff activity.'
              : 'Authorized field collections portal. View assigned Bachat Gat groups, collect payments, and manage due EMIs.'}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 shrink-0 z-10 w-full md:w-auto">
          <Calendar size={18} className="text-violet-400" />
          <div className="text-left">
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Ledger Date</p>
            <span className="text-xs font-bold text-slate-100 mt-1 block">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <button 
            onClick={() => fetchStats(true)} 
            disabled={refreshing}
            className="ml-auto p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition shrink-0 cursor-pointer"
            title="Refresh statistics"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {isAdmin ? (
        // ==========================================
        // ADMIN DASHBOARD VIEW
        // ==========================================
        <div className="space-y-6">
          
          {/* Main 4 Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-all shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Loans</span>
                <div className="p-2 bg-violet-50 text-violet-600 rounded-xl border border-violet-100">
                  <Layers size={18} />
                </div>
              </div>
              <div className="mt-4 text-left">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{stats.totalLoansCount || 0}</h3>
                <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Disbursed loan portfolios</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-all shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Collection</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <IndianRupee size={18} />
                </div>
              </div>
              <div className="mt-4 text-left">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                  ₹{(stats.totalCollection || 0).toLocaleString('en-IN')}
                </h3>
                <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Total repayments recovered</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-all shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending EMI</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <Clock size={18} />
                </div>
              </div>
              <div className="mt-4 text-left">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                  ₹{(stats.pendingEmiAmount || 0).toLocaleString('en-IN')}
                </h3>
                <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Outstanding ledger balance</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-all shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-rose-500">Overdue Loans</span>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                  <AlertCircle size={18} />
                </div>
              </div>
              <div className="mt-4 text-left">
                <h3 className="text-2xl font-black text-rose-600 tracking-tight">{stats.overdueLoansCount || 0}</h3>
                <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Overdue active accounts</p>
              </div>
            </div>
          </div>

          {/* Quick Sub-Stats (Total Groups & Members) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white text-slate-600 rounded-lg border border-slate-200 shadow-xs">
                  <Users size={16} />
                </div>
                <div className="text-left">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Bachat Gat Groups</p>
                  <span className="text-sm font-extrabold text-slate-800">{stats.totalGroupsCount || 0} Groups</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white text-slate-600 rounded-lg border border-slate-200 shadow-xs">
                  <UserCheck size={16} />
                </div>
                <div className="text-left">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Active Members</p>
                  <span className="text-sm font-extrabold text-slate-800">{stats.totalMembersCount || 0} Members</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderDailyChart(stats.dailyCollectionData)}
            {renderMonthlyChart(stats.monthlyProfitData)}
          </div>

          {/* Employee Performance Table */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm text-left space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Briefcase size={16} className="text-violet-600" /> Employee Performance
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Repayment collection efficiency and active groups per field agent</p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 text-[8px] font-black uppercase tracking-widest border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Employee Name</th>
                    <th className="px-5 py-3">Username</th>
                    <th className="px-5 py-3">Assigned Groups</th>
                    <th className="px-5 py-3">Active Loans</th>
                    <th className="px-5 py-3">Collected / Target</th>
                    <th className="px-5 py-3 text-right">Recovery Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {stats.employeePerformance && stats.employeePerformance.map((emp) => (
                    <tr key={emp._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-800">{emp.name}</td>
                      <td className="px-5 py-3.5 text-slate-500 font-semibold">@{emp.username}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-700">{emp.groupsCount} Groups</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-700">{emp.activeLoansCount} Active</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-700">
                        ₹{emp.actualCollection.toLocaleString()} / <span className="text-slate-400">₹{emp.targetCollection.toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-black text-slate-800">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                            <div 
                              className={`h-full rounded-full ${
                                emp.efficiency >= 85 ? 'bg-emerald-500' :
                                emp.efficiency >= 50 ? 'bg-amber-500' :
                                'bg-rose-500'
                              }`} 
                              style={{ width: `${Math.min(emp.efficiency, 100)}%` }} 
                            />
                          </div>
                          <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase ${
                            emp.efficiency >= 85 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            emp.efficiency >= 50 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            {emp.efficiency}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!stats.employeePerformance || stats.employeePerformance.length === 0) && (
                    <tr>
                      <td colSpan="6" className="px-5 py-8 text-center text-slate-400 font-semibold italic bg-white">No field employee records found in system registries.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // ==========================================
        // EMPLOYEE DASHBOARD VIEW
        // ==========================================
        <div className="space-y-6 text-left">
          
          {/* Main stats widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-all shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Groups</span>
                <div className="p-2 bg-violet-50 text-violet-600 rounded-xl border border-violet-100">
                  <Layers size={18} />
                </div>
              </div>
              <div className="mt-4 text-left">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{stats.assignedGroupsCount || 0}</h3>
                <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Managed Bachat Gats</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-all shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today Collection</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <IndianRupee size={18} />
                </div>
              </div>
              <div className="mt-4 text-left space-y-2">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                    ₹{(stats.todayCollectionActual || 0).toLocaleString('en-IN')}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-extrabold">
                    Target: ₹{(stats.todayCollectionTarget || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500" 
                      style={{ 
                        width: `${stats.todayCollectionTarget > 0 
                          ? Math.min(Math.round((stats.todayCollectionActual / stats.todayCollectionTarget) * 100), 100) 
                          : 0}%` 
                      }} 
                    />
                  </div>
                  <div className="flex justify-between text-[8px] font-black uppercase">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-emerald-600">
                      {stats.todayCollectionTarget > 0 
                        ? Math.round((stats.todayCollectionActual / stats.todayCollectionTarget) * 100) 
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-all shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Pending Collection</span>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div className="mt-4 text-left">
                <h3 className="text-2xl font-black text-rose-600 tracking-tight">
                  ₹{(stats.pendingCollection || 0).toLocaleString('en-IN')}
                </h3>
                <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Unpaid EMI backlog</p>
              </div>
            </div>
          </div>

          {/* Core Grid: Upcoming EMI & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Upcoming EMIs */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={16} className="text-indigo-600" /> Upcoming EMI Dues (Next 7 Days)
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Upcoming payments due in your assigned groups</p>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {stats.upcomingEmi && stats.upcomingEmi.map((emi) => (
                  <div key={emi._id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                    <div className="text-left space-y-1">
                      <span className="text-xs font-black text-slate-800 block">{emi.groupName}</span>
                      <span className="text-[9px] font-semibold text-slate-400 block flex items-center gap-1">
                        <Calendar size={11} /> Due: {new Date(emi.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-indigo-600 block">₹{emi.amount.toLocaleString()}</span>
                      <span className="text-[8px] font-extrabold uppercase bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                        {emi.paymentFrequency}
                      </span>
                    </div>
                  </div>
                ))}
                {(!stats.upcomingEmi || stats.upcomingEmi.length === 0) && (
                  <div className="py-12 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 font-semibold italic bg-white text-xs">
                    No outstanding upcoming dues in the next 7 days.
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={16} className="text-emerald-600 animate-pulse" /> Recent Collections Activity
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Last 10 installment collections submitted by you</p>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {stats.recentActivity && stats.recentActivity.map((activity) => (
                  <div key={activity._id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                    <div className="text-left space-y-1">
                      <span className="text-xs font-black text-slate-800 block">{activity.groupName}</span>
                      <span className="text-[9px] font-semibold text-slate-400 block flex items-center gap-1">
                        <CheckCircle size={11} className="text-emerald-500" /> Collected: {new Date(activity.paidDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-600 block">+ ₹{activity.amountPaid.toLocaleString()}</span>
                      <span className="text-[8px] font-semibold text-slate-400 block">Due Date: {new Date(activity.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {(!stats.recentActivity || stats.recentActivity.length === 0) && (
                  <div className="py-12 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 font-semibold italic bg-white text-xs">
                    No collections submitted recently.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
