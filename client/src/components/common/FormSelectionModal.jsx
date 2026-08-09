import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { projectService, userService } from '../../services/apiService';
import toast from 'react-hot-toast';

const FormSelectionModal = ({ isOpen, onClose, onConfirm, projectId, projectTitle, crmCode, projectAssigneeId }) => {
    const [forms, setForms] = useState([]);
    const [reports, setReports] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedForms, setSelectedForms] = useState([]);
    const [selectedReports, setSelectedReports] = useState([]);
    const [activeTab, setActiveTab] = useState('forms');
    const [customFormName, setCustomFormName] = useState('');
    const [customReportName, setCustomReportName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [defaultAssigneeId, setDefaultAssigneeId] = useState(null);

    useEffect(() => {
        if (isOpen && projectId) {
            setLoading(true);
            Promise.all([
                projectService.getAvailableFormsForProject(projectId),
                userService.getAll()
            ]).then(([res, usersRes]) => {
                setForms(res.data.forms || []);
                setReports(res.data.reports || []);
                setUsers(usersRes.data);
                setDefaultAssigneeId(res.data.projectAssigneeId || null);
                setLoading(false);
            }).catch(err => {
                console.error(err);
                toast.error("Error fetching available forms and reports");
                setLoading(false);
            });
        } else {
            setSelectedForms([]);
            setSelectedReports([]);
            setCustomFormName('');
            setCustomReportName('');
        }
    }, [isOpen, projectId]);

    const handleToggleForm = (formId, name = '', assignedToUserId = null) => {
        setSelectedForms(prev => {
            const existing = prev.find(f => f.formTemplateId === formId);
            if (existing) {
                return prev.filter(f => f.formTemplateId !== formId);
            } else {
                const finalAssignee = assignedToUserId !== undefined ? assignedToUserId : defaultAssigneeId;
                return [...prev, { formTemplateId: formId, assignedToUserId: finalAssignee, customName: name }];
            }
        });
    };

    const handleToggleReport = (reportId, name = '', assignedToUserId = null) => {
        setSelectedReports(prev => {
            const existing = prev.find(r => r.reportTemplateId === reportId);
            if (existing) {
                return prev.filter(r => r.reportTemplateId !== reportId);
            } else {
                const finalAssignee = assignedToUserId !== undefined ? assignedToUserId : defaultAssigneeId;
                return [...prev, { reportTemplateId: reportId, assignedToUserId: finalAssignee, customName: name }];
            }
        });
    };

    const updateAssignedUserForForm = (formId, userId) => {
        setSelectedForms(prev => prev.map(f => 
            f.formTemplateId === formId ? { ...f, assignedToUserId: userId || null } : f
        ));
    };

    const updateAssignedUserForReport = (reportId, userId) => {
        setSelectedReports(prev => prev.map(r => 
            r.reportTemplateId === reportId ? { ...r, assignedToUserId: userId || null } : r
        ));
    };

    const handleAddCustomForm = () => {
        if (!customFormName.trim()) {
            toast.error("Please enter a form title");
            return;
        }
        const tempId = -Math.floor(Date.now() / 1000);
        const newForm = {
            id: tempId,
            name: customFormName,
            color: '#a855f7',
            isCustom: true,
            steps: []
        };
        setForms(prev => [...prev, newForm]);
        handleToggleForm(tempId, customFormName);
        setCustomFormName('');
        toast.success("Custom form added.");
    };

    const handleAddCustomReport = () => {
        if (!customReportName.trim()) {
            toast.error("Please enter a report title");
            return;
        }
        const tempId = -Math.floor(Date.now() / 1000);
        const newReport = {
            id: tempId,
            name: customReportName,
            color: '#f97316',
            isCustom: true,
            steps: []
        };
        setReports(prev => [...prev, newReport]);
        handleToggleReport(tempId, customReportName);
        setCustomReportName('');
        toast.success("Custom report added.");
    };

    const handleSubmit = async () => {
        if (selectedForms.length === 0 && selectedReports.length === 0) {
            toast.error("Please select at least one form or report");
            return;
        }
        setIsSubmitting(true);
        try {
            await projectService.generateSubProjectsFromForms(projectId, {
                selectedForms: selectedForms.map(f => ({ 
                    formTemplateId: f.formTemplateId, 
                    assignedToUserId: f.assignedToUserId,
                    customName: f.customName 
                })),
                selectedReports: selectedReports.map(r => ({ 
                    reportTemplateId: r.reportTemplateId, 
                    assignedToUserId: r.assignedToUserId,
                    customName: r.customName
                }))
            });
            toast.success("Sub-projects generated successfully.");
            onConfirm();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Error creating sub-projects");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose} dir="ltr">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                        <h2 className="text-2xl font-bold text-slate-800">Select Forms, Processes & General Reports</h2>
                        <p className="text-slate-500 mt-1 text-sm">
                            Parent Project: <span className="font-bold text-blue-600">{projectTitle}</span> ({crmCode})
                        </p>
                    </div>

                    <div className="flex border-b px-6">
                        <button
                            onClick={() => setActiveTab('forms')}
                            className={`py-3 px-6 font-bold text-sm transition-all ${activeTab === 'forms' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
                        >
                            Forms & Processes ({forms.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('reports')}
                            className={`py-3 px-6 font-bold text-sm transition-all ${activeTab === 'reports' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
                        >
                            General Reports ({reports.length})
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                        {loading ? (
                            <div className="text-center py-20 text-slate-500">Loading templates...</div>
                        ) : activeTab === 'forms' ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {forms.map(form => {
                                        const isSelected = selectedForms.some(f => f.formTemplateId === form.id);
                                        const selectedItem = selectedForms.find(f => f.formTemplateId === form.id);
                                        return (
                                            <div
                                                key={form.id}
                                                className={`relative border-2 rounded-2xl p-4 transition-all ${isSelected ? 'border-blue-500 bg-blue-50/30 shadow-md' : 'border-slate-200 bg-white hover:shadow-sm'}`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                                                            style={{ backgroundColor: form.color || '#3b82f6' }}
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-slate-800 text-sm">{form.name}</h3>
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleToggleForm(form.id, form.name)}
                                                        className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </div>

                                                {isSelected && (
                                                    <div className="mt-3 pt-3 border-t border-slate-200">
                                                        <label className="block text-xs font-bold text-slate-500 mb-1">Assigned Specialist</label>
                                                        <select
                                                            value={selectedItem?.assignedToUserId || ''}
                                                            onChange={(e) => updateAssignedUserForForm(form.id, e.target.value ? parseInt(e.target.value) : null)}
                                                            className="flat-input w-full text-xs py-1.5 rounded-lg"
                                                        >
                                                            <option value="">Default Parent Assignee</option>
                                                            {users.map(u => (
                                                                <option key={u.id} value={u.id}>{u.fullName}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-6 p-4 border-2 border-dashed border-slate-300 rounded-2xl bg-white">
                                    <h4 className="font-semibold text-slate-700 text-sm mb-2">➕ Add Custom Form / Process</h4>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={customFormName}
                                            onChange={(e) => setCustomFormName(e.target.value)}
                                            placeholder="New Form Title..."
                                            className="flat-input flex-1 py-2 rounded-xl text-sm"
                                        />
                                        <button
                                            onClick={handleAddCustomForm}
                                            className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {reports.map(report => {
                                        const isSelected = selectedReports.some(r => r.reportTemplateId === report.id);
                                        const selectedItem = selectedReports.find(r => r.reportTemplateId === report.id);
                                        return (
                                            <div
                                                key={report.id}
                                                className={`relative border-2 rounded-2xl p-4 transition-all ${isSelected ? 'border-blue-500 bg-blue-50/30 shadow-md' : 'border-slate-200 bg-white hover:shadow-sm'}`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                                                            style={{ backgroundColor: report.color || '#f97316' }}
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                        </div>
                                                        <h3 className="font-bold text-slate-800 text-sm">{report.name}</h3>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleToggleReport(report.id, report.name)}
                                                        className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </div>

                                                {isSelected && (
                                                    <div className="mt-3 pt-3 border-t border-slate-200">
                                                        <label className="block text-xs font-bold text-slate-500 mb-1">Assigned Specialist</label>
                                                        <select
                                                            value={selectedItem?.assignedToUserId || ''}
                                                            onChange={(e) => updateAssignedUserForReport(report.id, e.target.value ? parseInt(e.target.value) : null)}
                                                            className="flat-input w-full text-xs py-1.5 rounded-lg"
                                                        >
                                                            <option value="">Default Parent Assignee</option>
                                                            {users.map(u => (
                                                                <option key={u.id} value={u.id}>{u.fullName}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-6 p-4 border-2 border-dashed border-slate-300 rounded-2xl bg-white">
                                    <h4 className="font-semibold text-slate-700 text-sm mb-2">➕ Add Custom Report</h4>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={customReportName}
                                            onChange={(e) => setCustomReportName(e.target.value)}
                                            placeholder="New Report Title..."
                                            className="flat-input flex-1 py-2 rounded-xl text-sm"
                                        />
                                        <button
                                            onClick={handleAddCustomReport}
                                            className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t bg-white flex justify-end gap-3">
                        <button onClick={onClose} className="flat-button px-6 py-2.5 rounded-xl font-bold text-sm">Cancel</button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || (selectedForms.length === 0 && selectedReports.length === 0)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg hover:shadow-xl disabled:opacity-50 transition-all text-sm"
                        >
                            {isSubmitting ? 'Creating...' : `Confirm & Create (${selectedForms.length + selectedReports.length} items)`}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default FormSelectionModal;