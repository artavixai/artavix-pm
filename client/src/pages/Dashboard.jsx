import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import moment from 'jalali-moment';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { SERVER_URL } from '../config';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const statsRes = await dashboardService.getStats();
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
    return (
      <div className="flex items-center justify-center min-h-[600px] font-medium text-slate-500 text-sm" dir="ltr">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Executive Dashboard...</span>
        </div>
      </div>
    );
  }

  const formatHour = (num) => Math.round(num || 0).toLocaleString();

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100 text-xs font-bold" dir="ltr">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.payload.color }}></span>
            <span className="text-slate-700">{data.name}:</span>
            <span className="text-blue-600 font-extrabold">{data.value} Projects</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-8 space-y-8 pb-16" dir="ltr">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Executive Dashboard</h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            Welcome back, <span className="text-blue-600 font-bold">{user?.fullName}</span>! Here is your live project activity and resource planning summary.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-slate-200">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-700">Live System Status: <span className="text-emerald-600">Operational</span></span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Projects */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="flat-card rounded-2xl p-6 bg-gradient-to-br from-blue-50/60 to-indigo-50/20 border-l-4 border-blue-500 relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm4-3a1 1 0 00-1 1v1h2V4a1 1 0 00-1-1zM7.707 8.707L10 11l4.293-4.293a1 1 0 111.414 1.414L11 12.828a1 1 0 01-1.414 0L6.293 9.535a1 1 0 011.414-1.414z" clipRule="evenodd"></path></svg>
            </div>
            <span className="text-3xl font-black text-blue-600">{stats?.activeProjects || 0}</span>
          </div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">Active Running Projects</h3>
          <p className="text-xs text-slate-400 font-medium">Total registered projects: {stats?.trackableTasks || 0}</p>
        </motion.div>

        {/* In-Progress Tasks */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="flat-card rounded-2xl p-6 bg-gradient-to-br from-purple-50/60 to-violet-50/20 border-l-4 border-purple-500 relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-purple-200">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path></svg>
            </div>
            <span className="text-3xl font-black text-purple-600">{stats?.inProgressTasks || 0}</span>
          </div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">My Active Tasks</h3>
          <p className="text-xs text-slate-400 font-medium">Scheduled for today: {stats?.todaysTasks || 0}</p>
        </motion.div>

        {/* Total Estimated & Allocated Hours */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="flat-card rounded-2xl p-6 bg-gradient-to-br from-amber-50/60 to-orange-50/20 border-l-4 border-amber-500 relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-amber-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-600 block">{formatHour(stats?.totalAllocatedHours)}h</span>
            </div>
          </div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">Allocated Workload Hours</h3>
          <p className="text-xs text-slate-400 font-medium">Estimated: {formatHour(stats?.totalEstimatedHours)} hrs</p>
        </motion.div>

        {/* Overall System Progress */}
        <motion.div 
          whileHover={{ y: -4 }}
          className={`flat-card rounded-2xl p-6 bg-gradient-to-br ${
            (stats?.criticalProjectsCount || 0) > 0 
              ? 'from-red-50/60 to-rose-50/20 border-l-4 border-red-500' 
              : 'from-emerald-50/60 to-teal-50/20 border-l-4 border-emerald-500'
          } relative overflow-hidden`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md ${
              (stats?.criticalProjectsCount || 0) > 0 ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-200' : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200'
            }`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd"></path></svg>
            </div>
            <span className={`text-3xl font-black ${(stats?.criticalProjectsCount || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {stats?.overallProgressPercent || 0}%
            </span>
          </div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">Avg. System Progress</h3>
          <p className="text-xs text-slate-400 font-medium">Critical Delays: <span className="font-bold text-red-500">{stats?.criticalProjectsCount || 0} Projects</span></p>
        </motion.div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Project Status Distribution (Donut Chart) */}
        <div className="lg:col-span-5 flat-card rounded-2xl p-6 bg-white border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-800">Projects Health & Status</h3>
              <p className="text-slate-400 text-xs mt-0.5">Distribution across status categories</p>
            </div>
            <Link to="/projects" className="text-xs font-bold text-blue-600 hover:underline">View All →</Link>
          </div>

          <div className="h-64 relative">
            {stats?.statusDistribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={4}
                  >
                    {stats.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                No project status data available
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
            {stats?.statusDistribution?.map((item) => (
              <div key={item.name} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 truncate">{item.name}</p>
                  <p className="text-xs font-black text-slate-800">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Specialists Workload Bar Chart */}
        <div className="lg:col-span-7 flat-card rounded-2xl p-6 bg-white border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-800">Top Specialists Workload Load</h3>
              <p className="text-slate-400 text-xs mt-0.5">Estimated vs. Allocated Hours Comparison</p>
            </div>
            <Link to="/weekly-planning" className="text-xs font-bold text-blue-600 hover:underline">Weekly Planning →</Link>
          </div>

          <div className="h-72">
            {stats?.topSpecialistsWorkload?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.topSpecialistsWorkload}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                  barGap={6}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" fontSize={11} stroke="#94a3b8" />
                  <YAxis type="category" dataKey="fullName" fontSize={11} stroke="#64748b" width={110} />
                  <RechartsTooltip 
                    formatter={(value) => formatHour(value) + ' hrs'}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Bar name="Estimated Hours" dataKey="estimatedHours" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={16} />
                  <Bar name="Allocated Hours" dataKey="allocatedHours" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                No specialist workload data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Follow-ups & Activities */}
        <div className="lg:col-span-7 flat-card rounded-2xl p-6 bg-white border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-base text-slate-800">Recent Project Follow-ups & Notes</h3>
              <p className="text-slate-400 text-xs mt-0.5">Latest specialist entries across projects</p>
            </div>
            <Link to="/monitoring" className="text-xs font-bold text-blue-600 hover:underline">Live Monitoring →</Link>
          </div>

          <div className="space-y-3">
            {stats?.recentActivities?.length > 0 ? (
              stats.recentActivities.map((act) => (
                <Link key={act.id} to={`/projects/${act.projectId}`} className="block group">
                  <div className="p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-100 transition-all flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                        📝
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-xs group-hover:text-blue-600 transition-colors truncate">
                          {act.projectTitle}
                        </p>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-1 leading-relaxed">
                          {act.content}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-medium">
                          <span>👤 {act.userFullName}</span>
                          <span>📅 {moment(act.date).format('YYYY/MM/DD')}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold flex-shrink-0 ${
                      act.isResolved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {act.isResolved ? 'Resolved' : 'Pending'}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs font-medium">
                No recent follow-ups recorded
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Meetings & Schedule */}
        <div className="lg:col-span-5 flat-card rounded-2xl p-6 bg-white border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-base text-slate-800">Upcoming Meetings</h3>
              <p className="text-slate-400 text-xs mt-0.5">Team events and project sessions</p>
            </div>
            <Link to="/meetings" className="text-xs font-bold text-blue-600 hover:underline">Schedule →</Link>
          </div>

          <div className="space-y-3">
            {stats?.upcomingMeetings?.length > 0 ? (
              stats.upcomingMeetings.map((m) => (
                <div key={m.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm" style={{ backgroundColor: m.color || '#3b82f6' }}>
                      📅
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-xs truncate">{m.title}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">📁 {m.projectTitle}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600 block">
                      {moment(m.startTime).format('HH:mm')} - {moment(m.endTime).format('HH:mm')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                      {moment(m.startTime).format('MMM DD')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs font-medium">
                No upcoming meetings scheduled
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;