import React, { useState, useEffect } from 'react';
import { basicDataService } from '../../services/apiService';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ConfirmModal from '../common/ConfirmModal';

const GeneralModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <AnimatePresence>
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose} dir="ltr">
                <motion.div initial={{ y: "-30px", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "30px", opacity: 0 }} className="flat-card rounded-xl p-6 w-full max-w-md bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-base font-bold text-slate-800 mb-6">{title}</h3>
                    {children}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

const FolderIcon = ({ className = 'w-5 h-5' }) => <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path></svg>;
const DocumentTextIcon = ({ className = 'w-5 h-5' }) => <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path></svg>;
const TagIcon = ({ className = 'w-5 h-5' }) => <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A1 1 0 012 10V5a1 1 0 011-1h5a1 1 0 01.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path></svg>;
const PlusCircleIcon = ({className='w-5 h-5'}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const Column = ({ title, items, selectedId, onSelect, onAdd, icon: Icon, emptyText, onEdit, onDelete }) => (
    <div className="flex flex-col bg-white border rounded-xl h-full" dir="ltr">
        <div className="flex justify-between items-center p-3 border-b bg-slate-50">
            <h3 className="font-bold text-slate-800 text-xs flex items-center">
                <Icon className="mr-2 text-slate-500" />
                {title}
            </h3>
            <button onClick={onAdd} className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!onAdd}>
                <PlusCircleIcon className="w-5 h-5" />
            </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-flat">
            {items.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-8 px-2 font-medium">{emptyText}</div>
            ) : (
                items.map(item => (
                <div key={item.id} className={`group w-full text-left rounded-lg text-xs flex items-center justify-between ${selectedId === item.id ? 'bg-blue-100' : ''}`}>
                    <button onClick={() => onSelect(item.id)} className={`flex-1 text-left p-2.5 flex items-center transition-colors rounded-lg font-bold ${selectedId === item.id ? 'text-blue-800 font-bold' : 'hover:bg-slate-100 text-slate-700'}`}>
                        {item.color && <span className="w-2.5 h-2.5 rounded-full mr-2" style={{backgroundColor: item.color}}></span>}
                        {item.name || item.title}
                    </button>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                        {onEdit && <button onClick={() => onEdit(item)} className="p-1 text-slate-400 hover:text-amber-500">✏️</button>}
                        {onDelete && <button onClick={() => onDelete(item)} className="p-1 text-slate-400 hover:text-red-500">🗑️</button>}
                    </div>
                </div>
            )))}
        </div>
    </div>
);

const TaskTemplateManager = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [selectedSubsystemId, setSelectedSubsystemId] = useState(null);
    
    const [modal, setModal] = useState({ type: null, data: null, isEdit: false });
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, item: null });
    
    const fetchData = async (keepSelection = false) => {
        try {
            setLoading(true);
            const response = await basicDataService.getProductGroupsTree();
            setData(response.data);
            if (!keepSelection && response.data.length > 0) {
                setSelectedGroupId(response.data[0].id);
            }
            setError('');
        } catch (err) {
            console.error("Failed to fetch basic data:", err);
            setError("Error fetching master data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const selectedGroup = data.find(g => g.id === selectedGroupId);
    const subsystems = selectedGroup ? selectedGroup.subsystems : [];
    const selectedSubsystem = subsystems.find(s => s.id === selectedSubsystemId);
    const taskTemplates = selectedSubsystem ? selectedSubsystem.taskTemplates : [];
    
    useEffect(() => {
        if (selectedGroup && selectedGroup.subsystems.length > 0) {
            const doesCurrentSelectionExist = selectedGroup.subsystems.some(s => s.id === selectedSubsystemId);
            if (!doesCurrentSelectionExist) {
                setSelectedSubsystemId(selectedGroup.subsystems[0].id);
            }
        } else {
            setSelectedSubsystemId(null);
        }
    }, [selectedGroupId, selectedGroup, selectedSubsystemId]);
    
    const openModal = (type, data = null) => {
        setModal({ type, data, isEdit: !!data });
        setFormData(data ? { ...data } : {});
    };

    const closeModal = () => {
        setModal({ type: null, data: null, isEdit: false });
        setFormData({});
    };

    const handleFormChange = (e) => {
        const { name, value, type } = e.target;
        const parsedValue = type === 'number' && value !== '' ? parseInt(value, 10) : value;
        setFormData(prev => ({...prev, [name]: parsedValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        const { type, isEdit, data } = modal;
        try {
            switch(type) {
                case 'group':
                    if (isEdit) {
                        await basicDataService.updateProductGroup(data.id, formData);
                    } else {
                        await basicDataService.createProductGroup(formData);
                    }
                    break;
                case 'subsystem':
                    if (isEdit) {
                        await basicDataService.updateSubsystem(data.id, formData);
                    } else {
                        await basicDataService.createSubsystem({ ...formData, productGroupId: selectedGroupId });
                    }
                    break;
                case 'template':
                    if (isEdit) {
                        await basicDataService.updateTaskTemplate(data.id, formData);
                    } else {
                        await basicDataService.createTaskTemplate({ ...formData, subsystemId: selectedSubsystemId });
                    }
                    break;
                default: break;
            }
            toast.success(`Operation completed successfully.`);
            closeModal();
            fetchData(true);
        } catch (error) {
            toast.error("Operation failed.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const confirmDelete = (item, type) => {
        setDeleteModal({ isOpen: true, type, item });
    };

    const handleDelete = async () => {
        const { type, item } = deleteModal;
        try {
            switch(type) {
                case 'group': await basicDataService.deleteProductGroup(item.id); break;
                case 'subsystem': await basicDataService.deleteSubsystem(item.id); break;
                case 'template': await basicDataService.deleteTaskTemplate(item.id); break;
                default: break;
            }
            toast.success(`Item deleted successfully.`);
            const shouldResetSelection = (type === 'group' && item.id === selectedGroupId) || (type === 'subsystem' && item.id === selectedSubsystemId);
            fetchData(!shouldResetSelection);
        } catch (error) {
            toast.error("Error deleting item.");
        } finally {
            setDeleteModal({ isOpen: false, type: null, item: null });
        }
    };

    if (loading) return <div className="text-xs text-slate-500" dir="ltr">Loading master data...</div>;

    return (
        <div dir="ltr">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-base font-bold text-slate-800">Process Task Templates Management</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[55vh]">
                <Column
                    title="Product Groups" items={data} selectedId={selectedGroupId} onSelect={setSelectedGroupId}
                    onAdd={() => openModal('group')} 
                    onEdit={(item) => openModal('group', item)} 
                    onDelete={(item) => confirmDelete(item, 'group')}
                    icon={FolderIcon} emptyText="No product groups defined."
                />
                <AnimatePresence>
                {selectedGroup && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                        <Column
                            title="Subsystems" items={subsystems} selectedId={selectedSubsystemId} onSelect={setSelectedSubsystemId}
                            onAdd={selectedGroupId ? () => openModal('subsystem') : null} 
                            onEdit={(item) => openModal('subsystem', item)} 
                            onDelete={(item) => confirmDelete(item, 'subsystem')}
                            icon={TagIcon} emptyText="No subsystems defined for this group."
                        />
                    </motion.div>
                )}
                </AnimatePresence>
                 <AnimatePresence>
                {selectedSubsystem && (
                     <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                        <Column
                            title="Task Templates" items={taskTemplates} selectedId={null} onSelect={(id) => openModal('template', taskTemplates.find(t => t.id === id))}
                            onAdd={selectedSubsystemId ? () => openModal('template') : null}
                            onEdit={(item) => openModal('template', item)} 
                            onDelete={(item) => confirmDelete(item, 'template')}
                            icon={DocumentTextIcon} emptyText="No task templates defined for this subsystem."
                        />
                     </motion.div>
                )}
                </AnimatePresence>
            </div>

            <GeneralModal isOpen={!!modal.type} onClose={closeModal} title={`${modal.isEdit ? 'Edit' : 'Add'} ${modal.type === 'group' ? 'Product Group' : modal.type === 'subsystem' ? 'Subsystem' : 'Task Template'}`}>
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    {modal.type === 'group' && <>
                        <div>
                            <label className="block font-bold text-slate-700 mb-1.5">Group Name</label>
                            <input type="text" name="name" value={formData.name || ''} onChange={handleFormChange} required className="flat-input w-full py-2" />
                        </div>
                        <div>
                            <label className="block font-bold text-slate-700 mb-1.5">Color Tag</label>
                            <input type="color" name="color" value={formData.color || '#3b82f6'} onChange={handleFormChange} className="w-full h-9 p-1 bg-white border rounded-xl cursor-pointer"/>
                        </div>
                    </>}
                    {modal.type === 'subsystem' && <>
                        <div>
                            <label className="block font-bold text-slate-700 mb-1.5">Subsystem Name</label>
                            <input type="text" name="name" value={formData.name || ''} onChange={handleFormChange} required className="flat-input w-full py-2" />
                        </div>
                    </>}
                    {modal.type === 'template' && <>
                        <div>
                            <label className="block font-bold text-slate-700 mb-1.5">Task Title</label>
                            <input type="text" name="title" value={formData.title || ''} onChange={handleFormChange} required className="flat-input w-full py-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1.5">Default Weight (%)</label>
                                <input type="number" name="defaultWeight" value={formData.defaultWeight || ''} onChange={handleFormChange} placeholder="e.g. 50" className="flat-input w-full py-2" />
                            </div>
                            <div>
                                <label className="block font-bold text-slate-700 mb-1.5">Duration (Days)</label>
                                <input type="number" name="defaultDurationInDays" value={formData.defaultDurationInDays || ''} onChange={handleFormChange} required className="flat-input w-full py-2" placeholder="e.g. 1" />
                            </div>
                        </div>
                    </>}
                    <div className="flex space-x-3 pt-4">
                        <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-60 transition-colors">
                            {isSubmitting ? 'Saving...' : (modal.isEdit ? 'Save Changes' : 'Create')}
                        </button>
                        <button type="button" onClick={closeModal} className="flex-1 flat-button px-6 py-2.5 rounded-xl font-bold">Cancel</button>
                    </div>
                </form>
            </GeneralModal>

            <ConfirmModal 
                isOpen={deleteModal.isOpen} 
                onClose={() => setDeleteModal({ isOpen: false, type: null, item: null })} 
                onConfirm={handleDelete} 
                title="Confirm Delete" 
                message="Are you sure you want to delete this item?" 
                confirmText="Delete" 
                type="danger" 
            />
        </div>
    );
};

export default TaskTemplateManager;