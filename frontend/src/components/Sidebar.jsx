import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, LogOut, X, UserCog, CheckSquare, Layers, Shield } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout, user } = useContext(AuthContext);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} /> },
    { name: 'Groups & Customers', path: '/customers', icon: <Users size={18} /> },
    { name: 'Loans', path: '/loans', icon: <CreditCard size={18} /> },
    { name: 'Completed Loans', path: '/completed-loans', icon: <CheckSquare size={18} /> },
    ...(user?.role === 'Admin' ? [
      { name: 'Staff Management', path: '/admins', icon: <UserCog size={18} /> },
      { name: 'Collector Assignments', path: '/assignments', icon: <Layers size={18} /> }
    ] : []),
  ];

  return (
    <>
      {/* Mobile Overlay with blur */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 md:hidden transition-all duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`w-64 bg-slate-950 text-slate-100 flex flex-col h-screen fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out border-r border-slate-900 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-900 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Shield size={18} className="text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              ZenLoan
            </span>
          </div>
          <button 
            className="md:hidden p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Navigation Items */}
        <nav className="flex-1 mt-6 overflow-y-auto px-4 space-y-1.5 scrollbar-thin">
          <ul className="space-y-1.5">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20 scale-[1.02]' 
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-0.5'
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* User Profile Card & Logout */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-900 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md uppercase">
              {user?.username ? user.username.charAt(0) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">
                {user?.username ? `@${user.username}` : 'User Account'}
              </p>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-violet-400">
                {user?.role || 'Collector'}
              </p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:bg-red-950/20 hover:text-red-400 rounded-xl transition-all duration-200 font-medium text-sm hover:translate-x-0.5 cursor-pointer"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
