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
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col w-full min-h-screen transition-all duration-300">
        
        {/* Glassmorphic Sticky Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 flex items-center justify-between px-4 md:px-8 shadow-sm shadow-slate-100/40">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 active:scale-95 rounded-xl transition-all"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open Sidebar"
            >
              <Menu size={22} />
            </button>
            
            {/* Title / Breadcrumb Context */}
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">ZenLoan Platform</span>
              <h2 className="text-base font-bold text-slate-800 mt-1">
                {user?.role === 'Admin' ? 'Administrator Workspace' : 'Field Operations Desk'}
              </h2>
            </div>
          </div>
          
          {/* Top Navbar Badges */}
          <div className="flex items-center gap-3">
            {user?.role === 'Admin' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100 shadow-sm shadow-violet-500/5">
                <Award size={13} className="text-violet-500 animate-pulse" />
                Admin Authority
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm shadow-emerald-500/5">
                <ShieldAlert size={13} className="text-emerald-500" />
                Collector Console
              </span>
            )}
          </div>
        </header>
        
        {/* Main Content Container with elegant padding and max viewport width protection */}
        <main className="flex-1 p-4 pb-24 md:p-8 overflow-y-auto w-full max-w-[100vw] bg-gradient-to-b from-slate-50 to-slate-100/50">
          <div className="max-w-7xl mx-auto animate-slide-up">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Navigation for Mobile Devices */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-slate-100 h-16 flex items-center justify-around px-2 shadow-lg shadow-slate-950/5">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
              isActive ? 'text-violet-600 scale-105' : 'text-slate-450 hover:text-slate-600'
            }`
          }
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-bold mt-1">Home</span>
        </NavLink>

        <NavLink
          to="/customers"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
              isActive ? 'text-violet-600 scale-105' : 'text-slate-450 hover:text-slate-600'
            }`
          }
        >
          <Users size={20} />
          <span className="text-[10px] font-bold mt-1">Customers</span>
        </NavLink>

        <NavLink
          to="/loans"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
              isActive ? 'text-violet-600 scale-105' : 'text-slate-450 hover:text-slate-600'
            }`
          }
        >
          <CreditCard size={20} />
          <span className="text-[10px] font-bold mt-1">Loans</span>
        </NavLink>

        <button
          onClick={() => setIsSidebarOpen(true)}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-450 active:scale-95 transition-all cursor-pointer bg-transparent border-0"
        >
          <Menu size={20} />
          <span className="text-[10px] font-bold mt-1">More</span>
        </button>
      </div>
    </div>
  );
};

export default Layout;
