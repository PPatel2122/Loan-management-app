import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, LogOut, X, UserCog, CheckSquare, Layers, Shield, Settings, User, ClipboardList } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout, user } = useContext(AuthContext);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={16} /> },
    ...(user?.role === 'Employee' ? [
      { name: "Today's Tasks", path: '/tasks', icon: <ClipboardList size={16} /> }
    ] : []),
    { name: 'Groups & Customers', path: '/customers', icon: <Users size={16} /> },
    { name: 'Active Loans', path: '/loans', icon: <CreditCard size={16} /> },
    { name: 'Completed Loans', path: '/completed-loans', icon: <CheckSquare size={16} /> },
    { name: 'My Profile', path: '/profile', icon: <User size={16} /> },
    ...(user?.role === 'Admin' ? [
      { name: 'Staff Management', path: '/admins', icon: <UserCog size={16} /> },
      { name: 'Assignments Roster', path: '/assignments', icon: <Layers size={16} /> }
    ] : []),
  ];

  return (
    <>
      {/* Mobile Overlay with blur */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 md:hidden transition-all duration-350"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`w-64 bg-slate-950 text-slate-100 flex flex-col h-screen fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out border-r border-slate-900 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-900 bg-slate-950/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center p-0.5 shadow-lg">
              <img src="/Logo.jpeg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-black tracking-tight font-display bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent truncate max-w-[155px]" title="Ekaakshara Finance Services">
              Ekaakshara Finance
            </span>
          </div>
          <button 
            className="md:hidden p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            onClick={() => setIsOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Navigation Items */}
        <nav className="flex-1 mt-6 overflow-y-auto px-4 space-y-1 scrollbar-thin">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide uppercase transition-premium ${
                      isActive 
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20 scale-[1.01]' 
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-0.5'
                    }`
                  }
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* User Profile Card & Logout */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/30">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-900/60 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md uppercase text-xs">
              {user?.username ? user.username.charAt(0) : 'U'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-bold text-slate-200 truncate">
                {user?.name || user?.username ? `@${user.username}` : 'User Profile'}
              </p>
              <p className="text-[9px] font-black uppercase tracking-wider text-violet-400 mt-0.5">
                {user?.role || 'Collector'}
              </p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 w-full text-slate-400 hover:bg-red-950/20 hover:text-red-400 rounded-xl transition-premium font-bold text-xs uppercase tracking-wide cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
