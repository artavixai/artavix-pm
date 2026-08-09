import React, { useState, useEffect } from 'react';
import { projectService } from '../../services/apiService';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const DeliverablesTab = ({ projectId }) => {
    const [deliverables, setDeliverables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    const fetchDeliverables = async () => {
        setLoading(true);
        try {
            const res = await projectService.getDeliverableSubProjects(projectId);
            setDeliverables(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Error fetching deliverables list");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeliverables();
    }, [projectId]);

    const handleMarkDelivered = async (subProjectId, currentStatus) => {
        if (currentStatus) return;
        setUpdatingId(subProjectId);
        try {
            await projectService.markAsDelivered(subProjectId, { isDelivered: true });
            toast.success("Delivery status updated successfully.");
            fetchDeliverables();
        } catch (err) {
            console.error(err);
            toast.error("Error updating delivery status");
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return <div className="text-center py-8 text-slate-500 text-sm">Loading deliverables...</div>;
    }

    if (deliverables.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200" dir="ltr">
                <svg className="w-16 h-16 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-slate-600 font-bold text-base">No sub-project with 100% progress found.</p>
                <p className="text-xs text-slate-400 mt-1">Sub-projects that reach 100% progress will appear in this list for formal delivery approval.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4" dir="ltr">
            {deliverables.map(item => (
                <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: item.color || '#10b981' }}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-base">{item.title}</h3>
                            <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 font-medium">
                                <span>Progress: {item.progress}%</span>
                                <span>Specialist: {item.projectAssigneeName || 'Unassigned'}</span>
                            </div>
                        </div>
                    </div>
                    
                    {item.isDelivered ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Approved by Management
                        </div>
                    ) : (
                        <button
                            onClick={() => handleMarkDelivered(item.id, false)}
                            disabled={updatingId === item.id}
                            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-emerald-100"
                        >
                            {updatingId === item.id ? (
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                            Approve Delivery
                        </button>
                    )}
                </motion.div>
            ))}
        </div>
    );
};

export default DeliverablesTab;