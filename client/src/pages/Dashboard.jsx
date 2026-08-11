import React, { useState, useEffect, useMemo } from 'react';
import { dashboardService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import moment from 'jalali-moment';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { SERVER_URL } from '../config';

const Motion = motion;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonthKey, setSelectedMonthKey] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const statsRes = await dashboardService.getStats();
        setStats(statsRes.data);

        if (statsRes.data?.specialistMonthlyWorkloads?.length > 0) {
          const firstUserMonths = statsRes.data.specialistMonthlyWorkloads[0].monthlyData;
          if (firstUserMonths && firstUserMonths.length > 0) {
            // تنظیم پیش‌فرض روی ماه جاری
            const currentMonthKey = moment.utc().format('YYYY-MM');
            const foundCurrent = firstUserMonths.find(m => m.monthKey === currentMonthKey);
            setSelectedMonthKey(foundCurrent ? foundCurrent.monthKey : firstUserMonths[0].monthKey);
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatHour = (num) => Math.round(num || 0).toLocaleString();

  const availableMonthTabs = useMemo(() => {
    if (!stats?.specialistMonthlyWorkloads?.length) return [];
    return stats.specialistMonthlyWorkloads[0].monthlyData || [];
  }, [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px] font-medium text-slate-500 text-sm" dir="ltr">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-bold">Loading Enterprise Intelligence Dashboard...</span>
        </div>
      </div>
    );
  }

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

  const renderBadge = (act) => {
    if (act.type === 'CrmAction') {
      return <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700 flex-shrink-0">CRM Action</span>;
    }
    if (act.type === 'TaskActivity') {
      return <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 flex-shrink-0">Task Event</span>;
    }
    if (act.type === 'Note') {
      return <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700 flex-shrink-0">Note Log</span>;
    }
    return (
      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold flex-shrink-0 ${
        act.isResolved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
      }`}>
        {act.isResolved ? 'Resolved' : 'Pending'}
      </span>
    );
  };

  return (
    <div className="p-8 space-y-8 pb-16" dir="ltr">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Executive Intelligence Dashboard</h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            Welcome back, <span className="text-blue-600 font-bold">{user?.fullName}</span>! Here is your multi-dimensional resource and project portfolio analysis.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-slate-200">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-700">Live Status: <span className="text-emerald-600">Active Monitoring</span></span>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Motion.div whileHover={{ y: -4 }} className="flat-card rounded-2xl p-6 bg-gradient-to-br from-blue-50/60 to-indigo-50/20 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm4-3a1 1 0 00-1 1v1h2V4a1 1 0 00-1-1zM7.707 8.707L10 11l4.293-4.293a1 1 0 111.414 1.414L11 12.828a1 1 0 01-1.414 0L6.293 9.535a1 1 0 011.414-1.414z" clipRule="evenodd"></path></svg>
            </div>
            <span className="text-3xl font-black text-blue-600">{stats?.activeProjects || 0}</span>
          </div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">Active Projects</h3>
          <p className="text-xs text-slate-400 font-medium">Total Portfolio: {stats?.trackableTasks || 0}</p>
        </Motion.div>

        <Motion.div whileHover={{ y: -4 }} className="flat-card rounded-2xl p-6 bg-gradient-to-br from-purple-50/60 to-violet-50/20 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-purple-200">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path></svg>
            </div>
            <span className="text-3xl font-black text-purple-600">{stats?.inProgressTasks || 0}</span>
          </div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">My Active Tasks</h3>
          <p className="text-xs text-slate-400 font-medium">Due Today: {stats?.todaysTasks || 0}</p>
        </Motion.div>

        <Motion.div whileHover={{ y: -4 }} className="flat-card rounded-2xl p-6 bg-gradient-to-br from-amber-50/60 to-orange-50/20 border-l-4 border-amber-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-amber-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <span className="text-2xl font-black text-amber-600">{formatHour(stats?.totalAllocatedHours)}h</span>
          </div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">Allocated Hours</h3>
          <p className="text-xs text-slate-400 font-medium">Estimated: {formatHour(stats?.totalEstimatedHours)} hrs</p>
        </Motion.div>

        <Motion.div whileHover={{ y: -4 }} className={`flat-card rounded-2xl p-6 bg-gradient-to-br ${(stats?.criticalProjectsCount || 0) > 0 ? 'from-red-50/60 to-rose-50/20 border-l-4 border-red-500' : 'from-emerald-50/60 to-teal-50/20 border-l-4 border-emerald-500'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md ${(stats?.criticalProjectsCount || 0) > 0 ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-200' : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200'}`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd"></path></svg>
            </div>
            <span className={`text-3xl font-black ${(stats?.criticalProjectsCount || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{stats?.overallProgressPercent || 0}%</span>
          </div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">Avg. Portfolio Progress</h3>
          <p className="text-xs text-slate-400 font-medium">Critical Projects: <span className="font-bold text-red-500">{stats?.criticalProjectsCount || 0}</span></p>
        </Motion.div>
      </div>

      {/* SECTION 1: Multi-Month Specialist Utilization Matrix */}
      <div className="flat-card rounded-3xl p-6 bg-white border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
              <span>👥</span> Specialist Multi-Month Deployment & Utilization
            </h3>
            <p className="text-slate-400 text-xs mt-1">Resource allocation, capacity utilization rate, and avatar breakdown across months</p>
          </div>

          {/* Month Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            {availableMonthTabs.map((m) => (
              <button
                key={m.monthKey}
                onClick={() => setSelectedMonthKey(m.monthKey)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedMonthKey === m.monthKey
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {m.monthName}
              </button>
            ))}
          </div>
        </div>

        {/* Specialists Matrix Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {stats?.specialistMonthlyWorkloads?.map((spec) => {
            const currentMonthData = spec.monthlyData?.find(m => m.monthKey === selectedMonthKey) || { EstimatedHours: 0, AllocatedHours: 0, UtilizationPercent: 0 };
            const avatar = spec.avatarUrl ? `${SERVER_URL}/${spec.avatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(spec.fullName)}&background=6366f1&color=fff&size=256&bold=true&font-size=0.45`;
            const util = currentMonthData.utilizationPercent || 0;
            const utilColor = util > 100 ? 'bg-red-500' : util > 70 ? 'bg-emerald-500' : 'bg-amber-500';

            return (
              <Motion.div
                key={spec.userId}
                layout
                className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3.5 mb-3">
                  <img
                    src={avatar}
                    alt={spec.fullName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0"
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(spec.fullName)}&background=6366f1&color=fff&size=256&bold=true&font-size=0.45`; }}
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{spec.fullName}</h4>
                    <p className="text-[11px] text-slate-400 font-semibold truncate">{spec.jobTitle}</p>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full text-white ${utilColor}`}>
                    {util}%
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200/60">
                  <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                    <span>Workload Hours:</span>
                    <span className="font-bold text-slate-800">
                      {formatHour(currentMonthData.allocatedHours)} / {formatHour(currentMonthData.estimatedHours)}h Est.
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${utilColor}`}
                      style={{ width: `${Math.min(util, 100)}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold pt-1">
                    <span>Monthly Cap: {spec.monthlyCapacityHours || 198}h</span>
                    <span>Daily Cap: {spec.dailyCapacityHours || 9}h</span>
                  </div>
                </div>
              </Motion.div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: 6-Month Trend & Projects Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 6-Month Composed Area Chart */}
        <div className="lg:col-span-8 flat-card rounded-3xl p-6 bg-white border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-black text-base text-slate-800">6-Month Workload & Hours Trend</h3>
              <p className="text-slate-400 text-xs mt-0.5">Historical comparison of Estimated vs. Allocated Hours</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl">Multi-Month Analysis</span>
          </div>

          <div className="h-72">
            {stats?.monthlyHoursTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stats.monthlyHoursTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="monthName" fontSize={11} stroke="#64748b" />
                  <YAxis fontSize={11} stroke="#94a3b8" />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 'bold' }} />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Area type="monotone" name="Allocated Hours" dataKey="allocatedHours" fill="url(#areaGrad)" stroke="#3b82f6" strokeWidth={3} />
                  <Bar name="Estimated Hours" dataKey="estimatedHours" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={20} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">No trend data available</div>
            )}
          </div>
        </div>

        {/* Project Health Donut */}
        <div className="lg:col-span-4 flat-card rounded-3xl p-6 bg-white border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-black text-base text-slate-800">Portfolio Status</h3>
              <p className="text-slate-400 text-xs mt-0.5">Projects Breakdown</p>
            </div>
            <Link to="/projects" className="text-xs font-bold text-blue-600 hover:underline">All →</Link>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats?.statusDistribution || []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4}>
                  {stats?.statusDistribution?.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            {stats?.statusDistribution?.map((item) => (
              <div key={item.name} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-[11px] font-bold text-slate-700 truncate">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 3: Top Active Projects Matrix */}
      <div className="flat-card rounded-3xl p-6 bg-white border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
              <span>📁</span> Top Active Parent Projects Portfolio
            </h3>
            <p className="text-slate-400 text-xs mt-1">High-priority parent projects, manager, assignee, and progress matrix</p>
          </div>
          <Link to="/projects" className="text-xs font-bold text-blue-600 hover:underline">Manage Portfolio →</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats?.topActiveProjects?.map((proj) => {
            const mgrAvatar = proj.managerAvatar ? `${SERVER_URL}/${proj.managerAvatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(proj.managerName)}&background=random&color=fff&size=256&bold=true&font-size=0.45`;
            const assAvatar = proj.assigneeAvatar ? `${SERVER_URL}/${proj.assigneeAvatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(proj.assigneeName)}&background=random&color=fff&size=256&bold=true&font-size=0.45`;

            return (
              <Link key={proj.id} to={`/projects/${proj.id}`} className="block group">
                <div className="bg-slate-50/80 rounded-2xl p-4 border-2 border-slate-100 hover:border-blue-400 transition-all shadow-sm hover:shadow-md h-full flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors truncate max-w-[70%]">{proj.title}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{proj.status}</span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mb-3">CRM Code: {proj.crmCode}</p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-200/60">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">Progress:</span>
                      <span className="font-black text-blue-600">{proj.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${proj.progress}%` }}></div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1.5" title={`Manager: ${proj.managerName}`}>
                        <img src={mgrAvatar} className="w-6 h-6 rounded-full object-cover border border-white shadow-sm" alt=""/>
                        <span className="text-[10px] font-bold text-slate-600 truncate max-w-[60px]">{proj.managerName.split(' ')[0]}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title={`Specialist: ${proj.assigneeName}`}>
                        <img src={assAvatar} className="w-6 h-6 rounded-full object-cover border border-white shadow-sm" alt=""/>
                        <span className="text-[10px] font-bold text-slate-600 truncate max-w-[60px]">{proj.assigneeName.split(' ')[0]}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: Live Activity Feed & Upcoming Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Merged Live Activity Feed */}
        <div className="lg:col-span-7 flat-card rounded-3xl p-6 bg-white border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-black text-base text-slate-800 flex items-center gap-2">
                <span>⚡</span> Live System & CRM Activity Feed
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">Real-time Specialist Follow-ups, Tasks, and CRM Logs</p>
            </div>
            <Link to="/monitoring" className="text-xs font-bold text-blue-600 hover:underline">Live Monitoring →</Link>
          </div>

          <div className="space-y-3">
            {stats?.recentActivities?.length > 0 ? (
              stats.recentActivities.map((act) => {
                const avatar = act.userAvatarUrl ? `${SERVER_URL}/${act.userAvatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(act.userFullName)}&background=random&color=fff&size=256&bold=true&font-size=0.45`;
                const targetLink = act.projectId > 0 ? `/projects/${act.projectId}` : '/notes';

                return (
                  <Link key={`${act.type}-${act.id}`} to={targetLink} className="block group">
                    <div className="p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/50 border border-slate-100 transition-all flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <img src={avatar} className="w-9 h-9 rounded-full object-cover border border-white shadow-sm flex-shrink-0 mt-0.5" alt="" />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-xs group-hover:text-blue-600 transition-colors truncate">
                            {act.projectTitle}
                          </p>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-1 leading-relaxed">
                            {act.content}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-medium">
                            <span>👤 {act.userFullName}</span>
                            <span>📅 {moment(act.date).format('YYYY/MM/DD HH:mm')}</span>
                            {act.duration && <span>⏱️ Duration: {act.duration}</span>}
                          </div>
                        </div>
                      </div>
                      {renderBadge(act)}
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs font-medium">No recent activity logs available</div>
            )}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="lg:col-span-5 flat-card rounded-3xl p-6 bg-white border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-black text-base text-slate-800 flex items-center gap-2">
                <span>🗓️</span> Upcoming Scheduled Meetings
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">Project sessions and team events</p>
            </div>
            <Link to="/meetings" className="text-xs font-bold text-blue-600 hover:underline">Schedule →</Link>
          </div>

          <div className="space-y-3">
            {stats?.upcomingMeetings?.length > 0 ? (
              stats.upcomingMeetings.map((m) => (
                <div key={m.id} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm" style={{ backgroundColor: m.color || '#3b82f6' }}>
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
              <div className="text-center py-10 text-slate-400 text-xs font-medium">No upcoming meetings scheduled</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;