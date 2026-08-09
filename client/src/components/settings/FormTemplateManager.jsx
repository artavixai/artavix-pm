import React, { useState, useEffect } from 'react';
import { formTemplateService } from '../../services/apiService';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ConfirmModal from '../common/ConfirmModal';

const FormTemplateManager = () => {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingForm, setEditingForm] = useState(null);
    const [formData, setFormData] = useState({ name: '', color: '#3b82f6', steps: [] });
    const [stepForm, setStepForm] = useState({ stepName: '', requiredSessions: 1, defaultHoursPerSession: 4 });
    const [editingStepIndex, setEditingStepIndex] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

    const fetchForms = async () => {
        setLoading(true);
        try {
            const res = await formTemplateService.getAll();
            setForms(res.data);
        } catch (err) {
            toast.error("Error fetching forms.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchForms(); }, []);

    const openModal = (form = null) => {
        if (form) {
            setEditingForm(form);
            setFormData({
                name: form.name,
                color: form.color,
                steps: form.steps.map(s => ({ ...s }))
            });
        } else {
            setEditingForm(null);
            setFormData({ name: '', color: '#3b82f6', steps: [] });
        }
        setEditingStepIndex(null);
        setStepForm({ stepName: '', requiredSessions: 1, defaultHoursPerSession: 4 });
        setModalOpen(true);
    };

    const handleAddStep = () => {
        if (!stepForm.stepName.trim()) {
            toast.error("Please enter step name");
            return;
        }
        if (editingStepIndex !== null) {
            const newSteps = [...formData.steps];
            newSteps[editingStepIndex] = { ...stepForm, stepOrder: editingStepIndex + 1 };
            setFormData({ ...formData, steps: newSteps });
            setEditingStepIndex(null);
        } else {
            const newStep = {
                ...stepForm,
                stepOrder: formData.steps.length + 1,
                id: Date.now()
            };
            setFormData({ ...formData, steps: [...formData.steps, newStep] });
        }
        setStepForm({ stepName: '', requiredSessions: 1, defaultHoursPerSession: 4 });
    };

    const handleEditStep = (index) => {
        setEditingStepIndex(index);
        setStepForm({
            stepName: formData.steps[index].stepName,
            requiredSessions: formData.steps[index].requiredSessions,
            defaultHoursPerSession: formData.steps[index].defaultHoursPerSession
        });
    };

    const handleRemoveStep = (index) => {
        const newSteps = formData.steps.filter((_, i) => i !== index);
        const reorderedSteps = newSteps.map((step, idx) => ({ ...step, stepOrder: idx + 1 }));
        setFormData({ ...formData, steps: reorderedSteps });
        if (editingStepIndex === index) setEditingStepIndex(null);
    };

    const handleSaveForm = async () => {
        if (!formData.name.trim()) {
            toast.error("Please enter form name");
            return;
        }
        try {
            const payload = {
                name: formData.name,
                color: formData.color,
                steps: formData.steps.map(s => ({
                    stepOrder: s.stepOrder,
                    stepName: s.stepName,
                    requiredSessions: s.requiredSessions,
                    defaultHoursPerSession: s.defaultHoursPerSession
                }))
            };
            if (editingForm) {
                await formTemplateService.update(editingForm.id, payload);
                toast.success("Form updated.");
            } else {
                await formTemplateService.create(payload);
                toast.success("New form template created.");
            }
            setModalOpen(false);
            fetchForms();
        } catch (err) {
            toast.error("Error saving form");
        }
    };

    const handleDeleteForm = async () => {
        try {
            await formTemplateService.delete(deleteModal.id);
            toast.success(`Form "${deleteModal.name}" deleted.`);
            fetchForms();
        } catch (err) {
            toast.error("Error deleting form.");
        } finally {
            setDeleteModal({ isOpen: false, id: null, name: '' });
        }
    };

    if (loading) return <div className="p-8 text-center text-xs text-slate-500" dir="ltr">Loading...</div>;

    return (
        <div dir="ltr">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-base font-bold text-slate-800">Forms & Processes Management</h2>
                <button onClick={() => openModal()} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-xs">+ Add New Form</button>
            </div>
            {forms.length === 0 ? (
                <div className="text-center py-8 text-slate-400 border rounded-xl text-xs">No form templates defined.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {forms.map(form => (
                        <div key={form.id} className="border rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: form.color }}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">{form.name}</h3>
                                        <p className="text-[11px] text-slate-400 font-medium">{form.steps?.length || 0} steps • {form.defaultSessionsCount || 0} sessions</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openModal(form)} className="text-amber-600 hover:text-amber-800 p-1">✏️</button>
                                    <button onClick={() => setDeleteModal({ isOpen: true, id: form.id, name: form.name })} className="text-red-600 hover:text-red-800 p-1">🗑️</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {modalOpen && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
                        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                            <h3 className="text-base font-bold mb-4">{editingForm ? 'Edit Form' : 'New Form'}</h3>
                            <div className="space-y-4 text-xs">
                                <div>
                                    <label className="block font-bold mb-1.5 text-slate-700">Form Name</label>
                                    <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="flat-input w-full py-2" />
                                </div>
                                <div>
                                    <label className="block font-bold mb-1.5 text-slate-700">Color</label>
                                    <input type="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="w-full h-9 rounded-xl border" />
                                </div>
                                <div>
                                    <label className="block font-bold mb-2 text-slate-700">Form Steps</label>
                                    <div className="space-y-2 mb-3">
                                        {formData.steps.map((step, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl">
                                                <span className="w-6 text-center font-bold text-slate-500">{step.stepOrder}</span>
                                                <span className="flex-1 font-bold text-slate-800">{step.stepName}</span>
                                                <span className="text-[11px] text-slate-400 font-medium">{step.requiredSessions} Sessions</span>
                                                <span className="text-[11px] text-slate-400 font-medium">{step.defaultHoursPerSession} Hours/Session</span>
                                                <button onClick={() => handleEditStep(idx)} className="text-amber-600 font-bold">Edit</button>
                                                <button onClick={() => handleRemoveStep(idx)} className="text-red-600 font-bold">Remove</button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <input type="text" placeholder="Step Name" value={stepForm.stepName} onChange={e => setStepForm({ ...stepForm, stepName: e.target.value })} className="flat-input w-full py-2" />
                                        </div>
                                        <div className="w-24">
                                            <input type="number" min="1" placeholder="Sessions" value={stepForm.requiredSessions} onChange={e => setStepForm({ ...stepForm, requiredSessions: parseInt(e.target.value) || 1 })} className="flat-input w-full text-center py-2" />
                                        </div>
                                        <div className="w-24">
                                            <input type="number" min="1" placeholder="Hours" value={stepForm.defaultHoursPerSession} onChange={e => setStepForm({ ...stepForm, defaultHoursPerSession: parseInt(e.target.value) || 4 })} className="flat-input w-full text-center py-2" />
                                        </div>
                                        <button onClick={handleAddStep} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold">{editingStepIndex !== null ? 'Update' : 'Add'}</button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-6 mt-4 border-t">
                                <button onClick={handleSaveForm} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold text-xs">Save</button>
                                <button onClick={() => setModalOpen(false)} className="flex-1 flat-button py-2.5 rounded-xl font-bold text-xs">Cancel</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })} onConfirm={handleDeleteForm} title="Delete Form" message={`Are you sure you want to delete form "${deleteModal.name}"?`} confirmText="Delete" type="danger" />
        </div>
    );
};

export default FormTemplateManager;