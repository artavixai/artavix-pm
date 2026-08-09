import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const [stats, setStats] = useState({
    inProgressTasks: 0,
    trackableTasks: 0,
    activeProjects: 0,
    todaysTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes] = await Promise.all([
          dashboardService.getStats(),
        ]);
        setStats(statsRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 font-medium text-slate-500 text-sm" dir="ltr">Loading dashboard data...</div>;
  }

  return (
    <div className="p-8 space-y-8" dir="ltr">
      <div>
        <h1 className="text-2xl font-black text-slate-800">System Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Welcome back, {user?.fullName}! Here is your project activity summary.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Tasks Card */}
        <div className="flat-card rounded-2xl p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path></svg>
            </div>
            <span className="text-3xl font-black text-blue-600">{stats.inProgressTasks}</span>
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-1">In-Progress Tasks</h3>
          <p className="text-xs text-slate-500">Your active assigned tasks</p>
        </div>

        {/* Trackable Tasks Card */}
        <div className="flat-card rounded-2xl p-6 bg-gradient-to-br from-purple-50/50 to-violet-50/30 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-purple-200">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd"></path></svg>
            </div>
            <span className="text-3xl font-black text-purple-600">{stats.trackableTasks}</span>
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-1">Trackable Tasks</h3>
          <p className="text-xs text-slate-500">Requires review & follow-up</p>
        </div>

        {/* Active Projects Card */}
        <div className="flat-card rounded-2xl p-6 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm4-3a1 1 0 00-1 1v1h2V4a1 1 0 00-1-1zM7.707 8.707L10 11l4.293-4.293a1 1 0 111.414 1.414L11 12.828a1 1 0 01-1.414 0L6.293 9.535a1 1 0 011.414-1.414z" clipRule="evenodd"></path></svg>
            </div>
            <span className="text-3xl font-black text-emerald-600">{stats.activeProjects}</span>
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-1">Active Projects</h3>
          <p className="text-xs text-slate-500">Total running projects</p>
        </div>

        {/* Today's Tasks Card */}
        <div className="flat-card rounded-2xl p-6 bg-gradient-to-br from-amber-50/50 to-orange-50/30 border-l-4 border-amber-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-amber-200">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
            </div>
            <span className="text-3xl font-black text-amber-600">{stats.todaysTasks}</span>
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-1">Today's Due Tasks</h3>
          <p className="text-xs text-slate-500">Tasks scheduled for today</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;