import React, { useState, useEffect } from 'react';
import { projectService } from '../../services/apiService';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ProjectTreeSelector = ({ isOpen, onClose, onSelect, currentProjectId }) => {
    const [projects, setProjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            projectService.getAll().then(res => {
                setProjects(res.data);
                if (currentProjectId) {
                    const findParents = (list, targetId, parents = []) => {
                        for (let p of list) {
                            if (p.id === targetId) return [p.id, ...parents];
                            if (p.subProjects?.length) {
                                const found = findParents(p.subProjects, targetId, [p.id, ...parents]);
                                if (found.length) return found;
                            }
                        }
                        return [];
                    };
                    const parentIds = findParents(res.data, currentProjectId);
                    setExpandedNodes(new Set(parentIds));
                }
                setLoading(false);
            }).catch(err => {
                toast.error("Error fetching projects list");
                setLoading(false);
            });
        }
    }, [isOpen, currentProjectId]);

    const toggleExpand = (id) => {
        const newSet = new Set(expandedNodes);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedNodes(newSet);
    };

    const filterProjects = (items, term) => {
        if (!term) return items;
        return items.filter(item => {
            const match = item.title.toLowerCase().includes(term.toLowerCase());
            const subMatch = item.subProjects ? filterProjects(item.subProjects, term).length > 0 : false;
            return match || subMatch;
        }).map(item => ({
            ...item,
            subProjects: item.subProjects ? filterProjects(item.subProjects, term) : []
        }));
    };

    const filtered = filterProjects(projects, searchTerm);

    const renderTree = (items, level = 0) => {
        return items.map(item => (
            <div key={item.id} style={{ marginLeft: `${level * 20}px` }} className="mt-1">
                <div className="flex items-center gap-2 py-2 px-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
                    {item.subProjects?.length > 0 && (
                        <button onClick={() => toggleExpand(item.id)} className="p-1 text-slate-400">
                            <svg className={`w-4 h-4 transition-transform ${expandedNodes.has(item.id) ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    )}
                    <div className="flex-1 flex items-center justify-between">
                        <div>
                            <span className={`font-medium text-sm ${item.id === currentProjectId ? 'text-blue-600 font-bold' : 'text-slate-700'}`}>{item.title}</span>
                            {item.id === currentProjectId && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">Current</span>}
                        </div>
                        <button
                            onClick={() => onSelect(item)}
                            className="opacity-0 group-hover:opacity-100 bg-blue-600 text-white text-xs px-3 py-1 rounded-full transition-all font-semibold"
                        >
                            Select
                        </button>
                    </div>
                </div>
                {expandedNodes.has(item.id) && item.subProjects?.length > 0 && (
                    <div className="ml-4 border-l-2 border-slate-200 pl-2">
                        {renderTree(item.subProjects, level + 1)}
                    </div>
                )}
            </div>
        ));
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose} dir="ltr">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b flex justify-between items-center">
                        <h3 className="text-base font-bold text-slate-800">Select Target Project for Gantt Chart</h3>
                        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                    <div className="p-4 border-b">
                        <input type="text" placeholder="Search projects..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flat-input w-full px-4 py-2 rounded-xl text-sm" />
                    </div>
                    <div className="flex-1 overflow-y-auto p-3">
                        {loading ? <div className="text-center py-8 text-slate-500 text-sm">Loading projects tree...</div> : renderTree(filtered)}
                    </div>
                    <div className="p-4 border-t text-xs text-slate-500">Select a project to sync/transfer current project steps.</div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ProjectTreeSelector;