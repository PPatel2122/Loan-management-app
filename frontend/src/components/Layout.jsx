import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

const Layout = () => {
  const { user } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 md:ml-64 flex flex-col w-full transition-all duration-300">
        <header className="bg-white shadow-sm h-16 flex items-center px-4 md:px-8 border-b gap-4">
          <button 
            className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <h2 className="text-xl font-semibold text-slate-800">
            {user?.role === 'Admin' ? 'Admin Portal' : 'Employee Portal'}
          </h2>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-[100vw]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
