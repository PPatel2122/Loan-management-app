import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { IndianRupee, Users, TrendingUp, CheckCircle, Clock } from 'lucide-react';

const Dashboard = () => {
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

  if (loading) return <div>Loading dashboard...</div>;
  if (!stats) return <div>Error loading stats</div>;

  const cards = [
    { title: 'Total Loans Given', value: stats.totalLoansCount, icon: <Users size={24} />, color: 'bg-blue-500' },
    { title: 'Total Amount Given', value: `₹${stats.totalMoneyGiven.toLocaleString()}`, icon: <TrendingUp size={24} />, color: 'bg-indigo-500' },
    { title: 'Total Collected', value: `₹${stats.totalCollected.toLocaleString()}`, icon: <CheckCircle size={24} />, color: 'bg-emerald-500' },
    { title: 'Pending Collection', value: `₹${stats.pendingAmount.toLocaleString()}`, icon: <Clock size={24} />, color: 'bg-amber-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
            <div className={`p-4 rounded-full text-white ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{card.title}</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Loan Status</h2>
          <div className="flex justify-around items-center h-48">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600 mb-2">{stats.activeLoans}</p>
              <p className="text-slate-500 font-medium">Active Loans</p>
            </div>
            <div className="w-px h-24 bg-slate-200"></div>
            <div className="text-center">
              <p className="text-4xl font-bold text-emerald-600 mb-2">{stats.completedLoans}</p>
              <p className="text-slate-500 font-medium">Completed Loans</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
