import React, { useState, useEffect, useMemo } from 'react';
import { reportService } from '../services/apiService';
import moment from 'jalali-moment';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Sector
} from 'recharts';
import toast from 'react-hot-toast';
import { SERVER_URL } from '../config';

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return Math.round(num).toString();
};

const GaugeChart = ({ value, label }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const percent = Math.min(Math.max(value, 0), 100);
  const color = percent > 15 ? '#ef4444' : (percent > 5 ? '#f97316' : '#22c55e');

  useEffect(() => {
    let start = 0;
    const step = Math.max(1, Math.ceil(percent / 30));
    const timer = setInterval(() => {
      start += step;
      if (start >= percent) {
        setDisplayValue(percent);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, 20);
    return () => clearInterval(timer);
  }, [percent]);

  const radius = 80;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference * (1 - displayValue / 100);
  const angle = (displayValue / 100) * 180 - 90;
  const rad = angle * Math.PI / 180;
  const cx = 30 + radius * (1 + Math.cos(rad));
  const cy = 115 - radius * Math.sin(rad);

  return (
    <div className="flex flex-col items-center justify-center h-96" dir="ltr">
      <svg width="260" height="150" viewBox="0 0 260 150">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="4" stdDeviation="4" floodOpacity="0.2" />
          </filter>
        </defs>
        <path
          d={`M 30 115 A ${radius} ${radius} 0 0 1 190 115`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d={`M 30 115 A ${radius} ${radius} 0 0 1 190 115`}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          filter="url(#shadow)"
        />
        <circle cx={cx} cy={cy} r="14" fill={color} stroke="white" strokeWidth="4" filter="url(#shadow)" />
      </svg>
      <div className="mt-4 text-center">
        <div className="text-4xl font-black" style={{ color }}>{Math.round(displayValue)}%</div>
        <div className="text-xs text-slate-500 mt-1 font-bold">{label}</div>
      </div>
    </div>
  );
};

const DonutChart = ({ data, dataKey, nameKey }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const baseColors = [
    '#3b82f6', '#4f46e5', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#10b981', '#06b6d4'
  ];

  const getGradientId = (index) => `grad-${index}`;
  const gradients = baseColors.map((color, i) => (
    <linearGradient key={`grad-${i}`} id={getGradientId(i)} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor={color} stopOpacity="0.9" />
      <stop offset="100%" stopColor={color} stopOpacity="0.6" />
    </linearGradient>
  ));

  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
    return (
      <g>
        <text x={cx} y={cy - 12} dy={8} textAnchor="middle" fill="#0f172a" className="text-xs font-bold">
          {payload.name}
        </text>
        <text x={cx} y={cy + 8} dy={8} textAnchor="middle" fill="#64748b" className="text-[10px] font-bold">
          {`${Math.round(percent * 100)}%`}
        </text>
        <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
        <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 10} outerRadius={outerRadius + 20} fill={fill} opacity={0.3} />
      </g>
    );
  };

  const renderLabel = ({ cx, cy, midAngle, outerRadius, percent, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const isRight = x > cx;
    const textAnchor = isRight ? 'start' : 'end';
    return (
      <text
        x={x}
        y={y}
        dy={4}
        textAnchor={textAnchor}
        fill="#0f172a"
        fontSize="11"
        fontWeight="600"
      >
        {`${name} (${Math.round(percent * 100)}%)`}
      </text>
    );
  };

  if (!data || data.length === 0) return <div className="text-center py-10 text-slate-400 text-xs">No data available</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <defs>{gradients}</defs>
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          innerRadius={65}
          outerRadius={110}
          labelLine={true}
          label={renderLabel}
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          onMouseEnter={(_, index) => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={(_, index) => setActiveIndex(index === activeIndex ? null : index)}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={`url(#${getGradientId(index % baseColors.length)})`}
              stroke="white"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip formatter={(v) => formatNumber(v) + ' hrs'} />
      </PieChart>
    </ResponsiveContainer>
  );
};

const UsersWorkloadChart = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [weekData, setWeekData] = useState([]);
  const [currentWeekRange, setCurrentWeekRange] = useState(() => {
    const now = moment();
    return {
      start: now.clone().startOf('week').format('YYYY/MM/DD'),
      end: now.clone().endOf('week').format('YYYY/MM/DD'),
      label: `Week of ${now.clone().startOf('week').format('MMM DD')} - ${now.clone().endOf('week').format('MMM DD, YYYY')}`
    };
  });

  const fetchWeekData = async (weekStartDate) => {
    setIsLoading(true);
    try {
      const response = await reportService.getWeeklyWorkload(weekStartDate);
      setWeekData(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Error fetching weekly workload data");
      setWeekData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const changeWeek = (direction) => {
    try {
      const currentDate = moment(currentWeekRange.start, 'YYYY/MM/DD');
      const newDate = direction === 'prev' ? currentDate.subtract(7, 'days') : currentDate.add(7, 'days');
      const startOfWeek = newDate.clone().startOf('week');
      const endOfWeek = newDate.clone().endOf('week');
      setCurrentWeekRange({
        start: startOfWeek.format('YYYY/MM/DD'),
        end: endOfWeek.format('YYYY/MM/DD'),
        label: `Week of ${startOfWeek.format('MMM DD')} - ${endOfWeek.format('MMM DD, YYYY')}`
      });
      fetchWeekData(startOfWeek.format('YYYY/MM/DD'));
    } catch (error) {
      toast.error("Error changing week");
    }
  };

  useEffect(() => {
    fetchWeekData(currentWeekRange.start);
  }, []);

  const chartData = weekData.map(user => ({
    name: user.fullName,
    Estimated: user.estimatedHours,
    Allocated: user.allocatedHours,
    avatarUrl: user.avatarUrl,
  }));

  const renderYAxisTick = ({ x, y, payload }) => {
    const user = weekData.find(u => u.fullName === payload.value);
    const avatarUrl = user?.avatarUrl ? `${SERVER_URL}/${user.avatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.value)}&background=6366f1&color=fff&size=64`;
    return (
      <g transform={`translate(${x - 50}, ${y - 20})`}>
        <foreignObject width="40" height="40" x="0" y="0">
          <img src={avatarUrl} alt={payload.value} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
        </foreignObject>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      const user = weekData.find(u => u.fullName === label);
      const estimated = payload[0]?.value || 0;
      const allocated = payload[1]?.value || 0;
      const efficiency = estimated > 0 ? Math.round((allocated / estimated) * 100) : 0;
      return (
        <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 text-xs" dir="ltr">
          <div className="flex items-center gap-3 mb-2">
            <img src={user?.avatarUrl ? `${SERVER_URL}/${user.avatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=6366f1&color=fff&size=64`} alt={label} className="w-10 h-10 rounded-full object-cover" />
            <p className="font-bold text-slate-800">{label}</p>
          </div>
          <div className="space-y-1">
            <p><span className="text-slate-400 font-medium">Estimated:</span> <span className="font-bold text-indigo-600">{estimated} hrs</span></p>
            <p><span className="text-slate-400 font-medium">Allocated:</span> <span className="font-bold text-amber-600">{allocated} hrs</span></p>
            <p><span className="text-slate-400 font-medium">Efficiency:</span> <span className={`font-bold ${efficiency >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>{efficiency}%</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flat-card p-6 rounded-2xl bg-white border border-slate-100" dir="ltr">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-base text-slate-800">Estimated vs. Allocated Workload Comparison</h3>
        <div className="flex gap-2 items-center">
          <button onClick={() => changeWeek('prev')} className="p-2 rounded-lg hover:bg-slate-100 text-xs">◀</button>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 rounded-xl shadow-md">
            <span className="text-xs font-bold text-white">{currentWeekRange.label}</span>
          </div>
          <button onClick={() => changeWeek('next')} className="p-2 rounded-lg hover:bg-slate-100 text-xs">▶</button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-80 flex justify-center items-center text-slate-400 text-xs">Loading workload data...</div>
      ) : weekData.length === 0 ? (
        <div className="h-80 flex justify-center items-center text-slate-400 text-xs">No workload data for this week</div>
      ) : (
        <>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 10 }} barGap={8} barCategoryGap={12}>
                <defs>
                  <linearGradient id="gradEstimated" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4f46e5" /><stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                  <linearGradient id="gradAllocated" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f97316" /><stop offset="100%" stopColor="#facc15" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" label={{ value: 'Hours', position: 'insideBottom', offset: -5 }} />
                <YAxis type="category" dataKey="name" width={80} tick={renderYAxisTick} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                <Legend verticalAlign="top" align="right" formatter={(value) => <span className="text-slate-700 text-xs font-bold">{value === 'Estimated' ? 'Estimated Hours' : 'Allocated Hours'}</span>} />
                <Bar name="Estimated" dataKey="Estimated" fill="url(#gradEstimated)" radius={[0, 8, 8, 0]} barSize={28} />
                <Bar name="Allocated" dataKey="Allocated" fill="url(#gradAllocated)" radius={[0, 8, 8, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {weekData.map(user => {
              const efficiency = user.efficiency || 0;
              let effClass = 'bg-emerald-100 text-emerald-700';
              if (efficiency < 70) effClass = 'bg-red-100 text-red-700';
              else if (efficiency < 85) effClass = 'bg-amber-100 text-amber-700';
              return (
                <div key={user.userId} className="bg-slate-50/80 rounded-xl p-3 flex items-center gap-3 border border-slate-200">
                  <img src={user.avatarUrl ? `${SERVER_URL}/${user.avatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=6366f1&color=fff&size=64`} alt={user.fullName} className="w-11 h-11 rounded-full object-cover border border-white shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{user.fullName}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-slate-500 font-medium">{user.allocatedHours}/{user.estimatedHours}h</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${effClass}`}>{efficiency}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const ProjectTreeTable = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const pageSize = 10;

  const nodeMatchesSearch = (node, term) => {
    if (!term) return true;
    return node.title.toLowerCase().includes(term.toLowerCase());
  };

  const filterTree = (node, term) => {
    if (!term) return node;
    if (node.title.toLowerCase().includes(term.toLowerCase())) return { ...node, children: node.children };
    const filteredChildren = node.children.map(c => filterTree(c, term)).filter(c => c !== null);
    if (filteredChildren.length) return { ...node, children: filteredChildren };
    return null;
  };

  const flattenTree = (node, depth = 0, result = []) => {
    const hasChildren = node.children?.length > 0;
    result.push({ ...node, depth, isParent: hasChildren });
    if (expandedNodes.has(node.id) && hasChildren) {
      node.children.forEach(child => flattenTree(child, depth + 1, result));
    }
    return result;
  };

  const filteredTree = useMemo(() => {
    if (!data?.length) return [];
    if (!searchTerm) return data;
    return data.map(node => filterTree(node, searchTerm)).filter(n => n !== null);
  }, [data, searchTerm]);

  useEffect(() => {
    if (searchTerm) {
      const ids = new Set();
      const collect = (nodes) => {
        nodes.forEach(node => {
          if (nodeMatchesSearch(node, searchTerm)) ids.add(node.id);
          if (node.children) collect(node.children);
        });
      };
      collect(filteredTree);
      setExpandedNodes(ids);
    }
  }, [searchTerm, filteredTree]);

  const flatList = useMemo(() => {
    const res = [];
    filteredTree.forEach(node => flattenTree(node, 0, res));
    return res;
  }, [filteredTree, expandedNodes]);

  const totalPages = Math.ceil(flatList.length / pageSize);
  const paginated = flatList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggle = (id, e) => {
    if (e) e.stopPropagation();
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
    setCurrentPage(1);
  };

  const expandAll = () => {
    const ids = new Set();
    const collect = (nodes) => {
      nodes.forEach(node => {
        if (node.children?.length) {
          ids.add(node.id);
          collect(node.children);
        }
      });
    };
    collect(filteredTree);
    setExpandedNodes(ids);
    setCurrentPage(1);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
    setCurrentPage(1);
  };

  const handlePageChange = (page) => setCurrentPage(page);

  if (!data?.length) return <div className="text-center py-8 text-slate-400 text-xs">No projects found.</div>;

  const badge = (status) => {
    if (status === 'Critical' || status === 'قرمز') return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Critical</span>;
    if (status === 'Warning' || status === 'زرد') return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Warning</span>;
    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Normal</span>;
  };

  return (
    <div dir="ltr">
      <div className="p-4 border-b bg-white flex flex-wrap justify-between items-center gap-3">
        <div className="flex gap-2">
          <button onClick={expandAll} className="text-xs font-bold text-blue-600 border px-3 py-1.5 rounded-lg hover:bg-slate-50">Expand All</button>
          <button onClick={collapseAll} className="text-xs font-bold text-slate-600 border px-3 py-1.5 rounded-lg hover:bg-slate-50">Collapse All</button>
        </div>
        <div className="relative">
          <input type="text" placeholder="Search project..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="flat-input pl-8 pr-4 py-2 rounded-xl text-xs w-64" />
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
            <tr>
              <th className="p-3 border-b">Project Work Breakdown Structure (WBS)</th>
              <th className="p-3 border-b text-center">Est. Hours</th>
              <th className="p-3 border-b text-center">Allocated Hours</th>
              <th className="p-3 border-b text-center">Actual Progress</th>
              <th className="p-3 border-b text-center">Deviation (Hrs)</th>
              <th className="p-3 border-b text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((node) => {
              const deviation = node.deviationHours;
              const devColor = deviation > 0 ? 'text-emerald-600' : (deviation < 0 ? 'text-red-600' : 'text-slate-500');
              const devSign = deviation > 0 ? '+' : '';
              return (
                <tr key={node.id} className="border-b hover:bg-slate-50">
                  <td className="p-3" style={{ paddingLeft: `${node.depth * 1.5 + 0.75}rem` }}>
                    <div className="flex items-center gap-2">
                      {node.isParent && (
                        <button onClick={(e) => toggle(node.id, e)} className="text-slate-400 hover:text-blue-600 p-0.5">
                          <svg className={`w-4 h-4 transition-transform ${expandedNodes.has(node.id) ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                        </button>
                      )}
                      {!node.isParent && <div className="w-4" />}
                      <span className={node.depth === 0 ? 'font-extrabold text-slate-800' : 'font-medium text-slate-600'}>{node.title}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center font-bold text-slate-700">{formatNumber(node.totalEstimatedHours)}</td>
                  <td className="p-3 text-center font-bold text-slate-700">{formatNumber(node.totalAllocatedHours)}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${node.progressPercent}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-blue-600">{node.progressPercent}%</span>
                    </div>
                  </td>
                  <td className={`p-3 text-center font-bold ${devColor}`}>{devSign}{formatNumber(deviation)}</td>
                  <td className="p-3 text-center">{badge(node.status)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center p-4 border-t">
          <div className="text-xs text-slate-500 font-medium">Showing {((currentPage-1)*pageSize)+1} to {Math.min(currentPage*pageSize, flatList.length)} of {flatList.length} projects</div>
          <div className="flex gap-1">
            <button onClick={() => handlePageChange(currentPage-1)} disabled={currentPage===1} className="px-3 py-1 text-xs border rounded-lg font-bold disabled:opacity-40">Prev</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => handlePageChange(i+1)} className={`w-7 h-7 text-xs rounded-lg font-bold ${currentPage===(i+1) ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`}>{i+1}</button>
            ))}
            <button onClick={() => handlePageChange(currentPage+1)} disabled={currentPage===totalPages} className="px-3 py-1 text-xs border rounded-lg font-bold disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await reportService.getAdvancedReport();
      setData(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Error fetching advanced reports data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 text-sm font-medium" dir="ltr">Loading analytics dashboard...</div>;
  if (!data) return <div className="p-8 text-center text-red-500 text-sm font-bold" dir="ltr">Failed to load analytics data</div>;

  return (
    <div className="h-full overflow-y-auto p-8 space-y-6 scrollbar-flat" dir="ltr">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Advanced Analytics Dashboard</h1>
          <p className="text-slate-500 text-xs font-medium mt-1">Smart analysis of deviations, hours, and team workload</p>
        </div>
        <button onClick={fetchReportData} className="flat-button px-4 py-2 rounded-xl text-blue-600 font-bold text-xs shadow-sm">Refresh</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flat-card p-4 rounded-2xl bg-white border-l-4 border-blue-500"><p className="text-xs font-bold text-slate-400">Total Active Projects</p><h3 className="text-3xl font-black text-slate-800 mt-1">{data.totalActiveProjects}</h3></div>
        <div className="flat-card p-4 rounded-2xl bg-white border-l-4 border-purple-500"><p className="text-xs font-bold text-slate-400">Org. Overall Deviation</p><h3 className={`text-3xl font-black mt-1 ${data.totalDeviationPercent>15?'text-red-500':data.totalDeviationPercent>5?'text-amber-500':'text-emerald-500'}`}>{data.totalDeviationPercent}%</h3></div>
        <div className="flat-card p-4 rounded-2xl bg-white border-l-4 border-emerald-500"><p className="text-xs font-bold text-slate-400">Team Efficiency</p><h3 className="text-3xl font-black text-emerald-600 mt-1">{data.teamEfficiencyPercent}%</h3></div>
        <div className="flat-card p-4 rounded-2xl bg-white border-l-4 border-amber-500"><p className="text-xs font-bold text-slate-400">Total Delay</p><h3 className="text-3xl font-black text-amber-600 mt-1">{data.totalDelayDays} days</h3></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flat-card p-4 rounded-2xl bg-white border flex justify-center">
          <GaugeChart value={data.gaugeValue} label="Overall Organization Deviation (%)" />
        </div>
        <div className="flat-card p-4 rounded-2xl bg-white border">
          <h3 className="font-bold text-sm text-center mb-4 text-slate-800">Specialists Workload Distribution</h3>
          <div className="h-96"><DonutChart data={data.userWorkloadShare || []} dataKey="totalAllocatedHours" nameKey="fullName" /></div>
        </div>
      </div>

      <UsersWorkloadChart />

      <div className="flat-card rounded-2xl overflow-hidden bg-white shadow-sm border">
        <div className="p-4 border-b bg-slate-50"><h3 className="text-sm font-bold text-slate-800">Hierarchical WBS Monitoring</h3></div>
        <ProjectTreeTable data={data.projectTree} />
      </div>

      <div className="flat-card rounded-2xl overflow-hidden bg-white shadow-sm border">
        <div className="p-4 border-b bg-red-50/50"><h3 className="text-sm font-bold text-red-700 flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>⚠️ Critical Projects (Highest Deviation)</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold"><tr><th className="p-3 border-b">Project Title</th><th className="p-3 border-b text-center">Deviation (Hrs)</th><th className="p-3 border-b text-center">Deviation (%)</th></tr></thead>
            <tbody>
              {data.criticalProjects?.length ? data.criticalProjects.map(p => (
                <tr key={p.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-800">{p.title}</td>
                  <td className={`p-3 text-center font-bold ${p.deviationHours>0?'text-emerald-600':p.deviationHours<0?'text-red-600':'text-slate-500'}`}>{p.deviationHours>0?'+':''}{formatNumber(p.deviationHours)}</td>
                  <td className={`p-3 text-center font-bold ${p.deviationPercent>0?'text-emerald-600':p.deviationPercent<0?'text-red-600':'text-slate-500'}`}>{p.deviationPercent>0?'+':''}{p.deviationPercent}%</td>
                </tr>
              )) : <tr><td colSpan="3" className="text-center py-8 text-emerald-600 font-bold">✅ No critical projects detected.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;