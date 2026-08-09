import React, { useEffect, useCallback, useState } from 'react';
import { NavLink } from 'react-router-dom';
import RoleBasedGuard from '../common/RoleBasedGuard';
import { useAuth } from '../../contexts/AuthContext';
import chatService from '../../services/chatService';
import { systemSettingsService } from '../../services/apiService';

// Menu SVG Icons
const DashboardIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path></svg>;
const ChatIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"></path></svg>;
const ProjectsIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>;
const GanttIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path></svg>;
const MeetingsIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM2 10v6a2 2 0 002 2h12a2 2 0 002-2v-6H2zm8 3a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path></svg>;
const NotesIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path><path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a2 2 0 002 2h4a2 2 0 002-2V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-4-2V5zm3 3a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd"></path></svg>;
const SettingsIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path></svg>;
const ReportsIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path></svg>;
const MonitoringIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm4 4a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2H7zm8 4a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path></svg>;
const CalendarIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>;

const Sidebar = () => {
    const { totalUnreadCount, updateTotalUnreadCount } = useAuth();
    const [ganttEnabled, setGanttEnabled] = useState(true);

    useEffect(() => {
        const fetchFeatureFlags = async () => {
            try {
                const res = await systemSettingsService.getAll();
                const ganttSetting = res.data.find(s => s.featureName === 'GanttChart');
                if (ganttSetting) setGanttEnabled(ganttSetting.isEnabled);
            } catch (err) {
                console.error("Failed to fetch feature flags", err);
            }
        };
        fetchFeatureFlags();
    }, []);

    const fetchAndUpdateCount = useCallback(() => {
        if (updateTotalUnreadCount) {
            updateTotalUnreadCount();
        }
    }, [updateTotalUnreadCount]);

    useEffect(() => {
        fetchAndUpdateCount();
        const connection = chatService.connection;
        if(connection) {
            connection.on("UpdateUnreadCount", fetchAndUpdateCount);
        }
        return () => {
            if(connection) {
                connection.off("UpdateUnreadCount", fetchAndUpdateCount);
            }
        };
    }, [fetchAndUpdateCount]);

    const navLinkClass = ({ isActive }) =>
        `flat-button w-full px-5 py-3.5 rounded-2xl text-left flex items-center space-x-3 ${isActive ? 'active font-bold' : 'text-slate-600 font-medium hover:text-slate-900'}`;

    return (
        <aside className="w-72 min-h-screen p-5">
            <nav className="space-y-2.5 mb-8">
                <NavLink to="/" className={navLinkClass} end>
                    <DashboardIcon />
                    <span className="text-sm">Dashboard</span>
                </NavLink>
                <NavLink to="/chat" className={navLinkClass}>
                    <ChatIcon />
                    <span className="text-sm">Discussions</span>
                    {totalUnreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full ml-auto animate-pulse">
                            {totalUnreadCount}
                        </span>
                    )}
                </NavLink>
                <NavLink to="/projects" className={navLinkClass}>
                    <ProjectsIcon />
                    <span className="text-sm">Projects</span>
                </NavLink>
                {ganttEnabled && (
                    <NavLink to="/gantt" className={navLinkClass}>
                        <GanttIcon />
                        <span className="text-sm">Gantt Timeline</span>
                    </NavLink>
                )}
                <NavLink to="/meetings" className={navLinkClass}>
                    <MeetingsIcon />
                    <span className="text-sm">Meetings</span>
                </NavLink>
                <NavLink to="/reports" className={navLinkClass}>
                    <ReportsIcon />
                    <span className="text-sm">Analytics & Reports</span>
                </NavLink>
                <NavLink to="/monitoring" className={navLinkClass}>
                    <MonitoringIcon />
                    <span className="text-sm">Live Monitoring</span>
                </NavLink>
                <NavLink to="/weekly-planning" className={navLinkClass}>
                    <CalendarIcon />
                    <span className="text-sm">Weekly Planning</span>
                </NavLink>
                <NavLink to="/notes" className={navLinkClass}>
                    <NotesIcon />
                    <span className="text-sm">My Notes</span>
                </NavLink>

                <RoleBasedGuard allowedRoles={['SuperAdmin']}>
                    <>
                        <hr className="border-slate-200 my-4" />
                        <NavLink to="/settings" className={navLinkClass}>
                            <SettingsIcon />
                            <span className="text-sm">System Settings</span>
                        </NavLink>
                    </>
                </RoleBasedGuard>
            </nav>
        </aside>
    );
};

export default Sidebar;