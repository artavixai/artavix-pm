import React, { useState, useEffect } from 'react';
import { basicDataService } from '../../services/apiService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../common/ConfirmModal';

const StepTemplateManager = () => {
    const [productGroups, setProductGroups] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [steps, setSteps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingStep, setEditingStep] = useState(null);
    const [formData, setFormData] = useState({ stepName: '', displayOrder: 0, isActive: true });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, stepId: null, stepName: '' });

    useEffect(() => {
        fetchProductGroups();
    }, []);

    const fetchProductGroups = async () => {
        try {
            const res = await basicDataService.getProductGroupsTree();
            setProductGroups(res.data);
            if (res.data.length > 0) {
                setSelectedGroupId(res.data[0].id);
            }
        } catch (err) {
            toast.error("Error fetching product groups.");
        }
    };

    useEffect(() => {
        if (selectedGroupId) {
            fetchSteps(selectedGroupId);
        }
    }, [selectedGroupId]);

    const fetchSteps = async (groupId) => {
        setLoading(true);
        try {
            const res = await basicDataService.getStepTemplatesByProductGroup(groupId);
            setSteps(res.data);
        } catch (err) {
            toast.error("Error fetching step templates.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.stepName.trim()) {
            toast.error("Please enter step name.");
            return;
        }
        try {
            if (editingStep) {
                await basicDataService.updateStepTemplate(editingStep.id, {
                    ...formData,
                    productGroupId: selectedGroupId
                });
                toast.success("Step template updated.");
            } else {
                await basicDataService.createStepTemplate({
                    ...formData,
                    productGroupId: selectedGroupId
                });
                toast.success("New step template added.");
            }
            setModalOpen(false);
            setEditingStep(null);
            setFormData({ stepName: '', displayOrder: 0, isActive: true });
            fetchSteps(selectedGroupId);
        } catch (err) {
            toast.error("Error saving step template.");
        }
    };

    const handleEdit = (step) => {
        setEditingStep(step);
        setFormData({
            stepName: step.stepName,
            displayOrder: step.displayOrder,
            isActive: step.isActive
        });
        setModalOpen(true);
    };

    const confirmDelete = (step) => {
        setDeleteModal({ isOpen: true, stepId: step.id, stepName: step.stepName });
    };

    const handleDelete = async () => {
        try {
            await basicDataService.deleteStepTemplate(deleteModal.stepId);
            toast.success(`Step "${deleteModal.stepName}" deleted.`);
            fetchSteps(selectedGroupId);
        } catch (err) {
            toast.error("Error deleting step template.");
        } finally {
            setDeleteModal({ isOpen: false, stepId: null, stepName: '' });
        }
    };

    return (
        <div dir="ltr">
            <h2 className="text-base font-bold text-slate-800 mb-6">Dynamic Project Steps Management</h2>
            <div className="mb-6">
                <label className="block text-xs font-bold mb-1.5 text-slate-700">Product Group</label>
                <select
                    value={selectedGroupId || ''}
                    onChange={(e) => setSelectedGroupId(parseInt(e.target.value))}
                    className="flat-input w-64 text-xs py-2 rounded-xl"
                >
                    {productGroups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                </select>
            </div>

            <div className="flex justify-end mb-4">
                <button
                    onClick={() => {
                        setEditingStep(null);
                        setFormData({ stepName: '', displayOrder: steps.length + 1, isActive: true });
                        setModalOpen(true);
                    }}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-xs"
                >
                    + Add New Step
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8 text-xs text-slate-500">Loading steps...</div>
            ) : steps.length === 0 ? (
                <div className="text-center py-8 text-slate-400 border rounded-xl text-xs">No steps defined for this product group.</div>
            ) : (
                <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="p-3 font-bold text-slate-600">Order</th>
                                <th className="p-3 font-bold text-slate-600">Step Name</th>
                                <th className="p-3 font-bold text-slate-600">Status</th>
                                <th className="p-3 font-bold text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {steps.map((step) => (
                                <tr key={step.id} className="border-b hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-700">{step.displayOrder}</td>
                                    <td className="p-3 font-semibold text-slate-800">{step.stepName}</td>
                                    <td className="p-3">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${step.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {step.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex gap-3 font-bold">
                                            <button onClick={() => handleEdit(step)} className="text-blue-600 hover:underline">Edit</button>
                                            <button onClick={() => confirmDelete(step)} className="text-red-600 hover:underline">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <AnimatePresence>
                {modalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                        onClick={() => setModalOpen(false)}
                    >
                        <motion.div
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-base font-bold mb-4">{editingStep ? 'Edit Step' : 'New Step'}</h3>
                            <div className="space-y-4 text-xs">
                                <div>
                                    <label className="block font-bold mb-1.5 text-slate-700">Step Name</label>
                                    <input
                                        type="text"
                                        value={formData.stepName}
                                        onChange={e => setFormData({ ...formData, stepName: e.target.value })}
                                        className="flat-input w-full py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold mb-1.5 text-slate-700">Display Order</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.displayOrder}
                                        onChange={e => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                                        className="flat-input w-32 py-2"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 rounded text-blue-600"
                                    />
                                    <label htmlFor="isActive" className="font-bold text-slate-700">Active</label>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold">Save</button>
                                    <button onClick={() => setModalOpen(false)} className="flex-1 flat-button py-2.5 rounded-xl font-bold">Cancel</button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, stepId: null, stepName: '' })}
                onConfirm={handleDelete}
                title="Delete Step Template"
                message={`Are you sure you want to delete step "${deleteModal.stepName}"?`}
                confirmText="Delete"
                type="danger"
            />
        </div>
    );
};

export default StepTemplateManager;