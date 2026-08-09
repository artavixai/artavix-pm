import React, { useState, useEffect, useCallback, useRef } from 'react';
import { reportService } from '../services/apiService';
import { motion, AnimatePresence } from 'framer-motion';

const ProjectNode = ({ project, depth = 0 }) => {
    const [isOpen, setIsOpen] = useState(true);
    const hasSubProjects = project.subProjects && project.subProjects.length > 0;
    
    const isCritical = project.status === 'Critical' || project.status === 'بحرانی';
    const isDelayed = project.status === 'Delayed' || project.status === 'تأخیر دار';

    return (
        <div className="w-full" dir="ltr">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => hasSubProjects && setIsOpen(!isOpen)}
                style={{ marginLeft: `${depth * 2.5}rem` }}
                className={`relative flat-card p-5 rounded-2xl border-2 flex items-center justify-between mb-3 transition-all ${
                    hasSubProjects ? 'cursor-pointer hover:border-blue-300' : ''
                } ${
                    isCritical ? 'border-red-200 bg-red-50/10' : 
                    isDelayed ? 'border-amber-200 bg-amber-50/10' : 
                    'border-slate-100 bg-white'
                } ${depth > 0 ? 'before:absolute before:left-[-1.25rem] before:top-[-1rem] before:bottom-1/2 before:w-5 before:border-l-2 before:border-b-2 before:border-slate-300 before:rounded-bl-xl' : ''}`}
            >
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        {hasSubProjects && (
                            <motion.span
                                animate={{ rotate: isOpen ? 0 : -90 }}
                                className="text-slate-400"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                            </motion.span>
                        )}
                        <div className="flex flex-col items-center min-w-[50px]">
                            <div className={`w-4 h-4 rounded-full shadow-lg ${
                                isCritical ? 'bg-red-500 shadow-red-200 animate-pulse' : 
                                isDelayed ? 'bg-amber-500 shadow-amber-200' : 
                                'bg-emerald-500 shadow-emerald-200'
                            }`}></div>
                            <span className={`text-[9px] mt-1.5 font-black uppercase tracking-wider ${
                                isCritical ? 'text-red-600' : isDelayed ? 'text-amber-600' : 'text-emerald-600'
                            }`}>{isCritical ? 'CRITICAL' : isDelayed ? 'DELAYED' : 'NORMAL'}</span>
                        </div>
                    </div>

                    <div>
                        <h3 className={`${
                            depth === 0 
                            ? 'text-base font-black text-slate-800' 
                            : 'text-sm font-bold text-slate-600' 
                        }`}>
                            {project.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-[11px] font-bold text-slate-400">Manager: {project.projectManager || 'N/A'}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-mono border border-slate-200">{project.crmCode}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-center min-w-[60px]">
                        <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Progress</p>
                        <p className={`text-lg font-black ${depth === 0 ? 'text-blue-600' : 'text-blue-400'}`}>
                            {project.actualProgress}%
                        </p>
                    </div>
                    <div className="text-center min-w-[60px]">
                        <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Deviation</p>
                        <p className={`text-lg font-black ${
                            project.deviation < 0 
                            ? (depth === 0 ? 'text-red-600' : 'text-red-400') 
                            : (depth === 0 ? 'text-emerald-600' : 'text-emerald-400')
                        }`}>
                            {project.deviation > 0 ? '+' : ''}{project.deviation}%
                        </p>
                    </div>
                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden lg:block border border-slate-50">
                        <div className={`h-full ${isCritical ? 'bg-red-500' : isDelayed ? 'bg-amber-500' : 'bg-emerald-500'}`}
                             style={{ width: `${project.actualProgress}%`, opacity: depth === 0 ? 1 : 0.6 }}></div>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {hasSubProjects && isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        {project.subProjects.map(sub => (
                            <ProjectNode key={sub.id} project={sub} depth={depth + 1} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Monitoring = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef(null);

    const fetchData = useCallback(async () => {
        try {
            const response = await reportService.getDashboardReport();
            setData(response.data);
            setLastRefresh(new Date());
            
            if (response.data.criticalProjectsCount > 0 && !isMuted) {
                if (audioRef.current) audioRef.current.play().catch(() => {});
            } else {
                if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
            }
        } catch (error) {
            console.error("Monitoring Error:", error);
        } finally {
            setLoading(false);
        }
    }, [isMuted]);

    useEffect(() => {
        fetchData();
        let interval = autoRefresh ? setInterval(fetchData, 30000) : null;
        return () => { if(interval) clearInterval(interval); };
    }, [fetchData, autoRefresh]);

    if (loading && !data) return <div className="p-8 text-center text-slate-500 font-medium text-sm" dir="ltr">Connecting to live monitoring feed...</div>;

    return (
        <div className="p-8 space-y-8 animate-fade-in" dir="ltr">
            <audio ref={audioRef} src="/alarm.mp3" loop />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <span className="relative flex h-3.5 w-3.5">
                            {data?.criticalProjectsCount > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${data?.criticalProjectsCount > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                        </span>
                        Live Project Monitoring Center
                    </h1>
                    <p className="text-slate-500 text-xs mt-1 font-medium">Last updated: {lastRefresh.toLocaleTimeString()}</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <button 
                        onClick={() => setIsMuted(!isMuted)} 
                        className={`p-2 rounded-xl transition-all ${isMuted ? 'text-slate-400 bg-slate-50' : 'text-blue-600 bg-blue-50'}`}
                        title={isMuted ? "Unmute Alarm" : "Mute Alarm"}
                    >
                        {isMuted ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M12 19l-7-7 7-7v14z" /></svg>}
                    </button>
                    <label className="flex items-center cursor-pointer gap-2 px-3 border-l border-slate-100">
                        <span className="text-xs text-slate-500 font-bold">Auto-Monitoring</span>
                        <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="w-4 h-4 rounded text-blue-600 focus:ring-0" />
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flat-card p-6 rounded-3xl bg-white border-b-4 border-slate-200">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-wider">Operational Units</p>
                    <h2 className="text-3xl font-black mt-2 text-slate-800">{data?.totalProjects}</h2>
                </div>
                <div className="flat-card p-6 rounded-3xl bg-emerald-50/30 border-b-4 border-emerald-500">
                    <p className="text-emerald-600 text-xs font-black uppercase tracking-wider">Normal Status</p>
                    <h2 className="text-3xl font-black mt-2 text-emerald-600">{data?.onTrackProjectsCount}</h2>
                </div>
                <div className={`flat-card p-6 rounded-3xl border-b-4 ${data?.criticalProjectsCount > 0 ? 'bg-red-50 border-red-500 animate-pulse' : 'bg-white border-slate-200'}`}>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-wider">Critical Deviation</p>
                    <h2 className={`text-3xl font-black mt-2 ${data?.criticalProjectsCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>{data?.criticalProjectsCount}</h2>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pl-2 scrollbar-flat pb-20">
                <div className="flex flex-col gap-2">
                    {data?.projectList.map(project => (
                        <ProjectNode key={project.id} project={project} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Monitoring;