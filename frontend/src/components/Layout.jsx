import React, { useState } from 'react';
import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { Menu, ShieldAlert, Award, LayoutDashboard, Users, CreditCard } from 'lucide-react';

const Layout = () => {
  const { user } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50 text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col w-full min-h-screen transition-premium">
        
        {/* Glassmorphic Sticky Header */}
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-md border-b border-slate-100 h-16 flex items-center justify-between px-6 md:px-10 shadow-sm shadow-slate-200/20">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 active:scale-95 rounded-xl transition-premium cursor-pointer"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open Sidebar"
            >
              <Menu size={20} />
            </button>
            
            {/* Title / Breadcrumb Context */}
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-black text-violet-500 uppercase tracking-widest leading-none">Ekaakshara Platform</span>
              <h2 className="text-sm font-bold text-slate-800 mt-1 font-display tracking-tight">
                {user?.role === 'Admin' ? 'Administrator Portal' : 'Collector Desk'}
              </h2>
            </div>
          </div>
          
          {/* Top Navbar Badges */}
          <div className="flex items-center gap-3">
            {user?.role === 'Admin' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-55/10 text-violet-750 border border-violet-500/10 shadow-sm shadow-violet-500/5">
                <Award size={13} className="text-violet-500 animate-pulse" />
                <span className="hidden sm:inline">Admin Authority</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm shadow-emerald-500/5">
                <ShieldAlert size={13} className="text-emerald-500" />
                <span className="hidden sm:inline">Collector Console</span>
              </span>
            )}
          </div>
        </header>
        
        {/* Main Content Container with elegant padding and max viewport width protection */}
        <main className="flex-1 p-6 pb-24 md:p-10 overflow-y-auto w-full max-w-[100vw] bg-gradient-to-b from-slate-50/50 to-slate-100/30">
          <div className="max-w-7xl mx-auto animate-slide-up">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Navigation for Mobile Devices */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-lg border-t border-slate-100 h-16 flex items-center justify-around px-3 shadow-lg shadow-slate-900/5">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 transition-premium ${
              isActive ? 'text-violet-650 scale-105 font-bold' : 'text-slate-400 hover:text-slate-650'
            }`
          }
        >
          <LayoutDashboard size={18} />
          <span className="text-[9px] mt-1 font-semibold uppercase tracking-wider">Home</span>
        </NavLink>

        <NavLink
          to="/customers"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 transition-premium ${
              isActive ? 'text-violet-650 scale-105 font-bold' : 'text-slate-400 hover:text-slate-650'
            }`
          }
        >
          <Users size={18} />
          <span className="text-[9px] mt-1 font-semibold uppercase tracking-wider">Customers</span>
        </NavLink>

        <NavLink
          to="/loans"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 transition-premium ${
              isActive ? 'text-violet-650 scale-105 font-bold' : 'text-slate-400 hover:text-slate-650'
            }`
          }
        >
          <CreditCard size={18} />
          <span className="text-[9px] mt-1 font-semibold uppercase tracking-wider">Loans</span>
        </NavLink>

        <button
          onClick={() => setIsSidebarOpen(true)}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-400 active:scale-95 transition-premium cursor-pointer bg-transparent border-0"
        >
          <Menu size={18} />
          <span className="text-[9px] mt-1 font-semibold uppercase tracking-wider">More</span>
        </button>
      </div>
    </div>
  );
};

export default Layout;
