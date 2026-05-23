import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, LogOut, X, UserCog, CheckSquare, Layers } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout, user } = useContext(AuthContext);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Groups & Customers', path: '/customers', icon: <Users size={20} /> },
    { name: 'Loans', path: '/loans', icon: <CreditCard size={20} /> },
    { name: 'Completed Loans', path: '/completed-loans', icon: <CheckSquare size={20} /> },
    ...(user?.role === 'Admin' ? [
      { name: 'Staff Management', path: '/admins', icon: <UserCog size={20} /> },
      { name: 'Collector Assignments', path: '/assignments', icon: <Layers size={20} /> }
    ] : []),
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`w-64 bg-slate-800 text-white flex flex-col h-screen fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="text-2xl font-bold tracking-wider text-center flex-1">
            LoanApp
          </div>
          <button 
            className="md:hidden p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 mt-6">
          <ul className="space-y-2 px-4">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
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
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
