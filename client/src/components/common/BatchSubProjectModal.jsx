import React, { useState, useEffect } from 'react';
import { userService, basicDataService } from '../../services/apiService';
import Select from 'react-select';
import { motion, AnimatePresence } from 'framer-motion';

const CONFIG = {
    financial: { 
        title: 'Financial Systems Deployment', 
        keyword: 'Financial', 
        color: '#ef4444',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        )
    },
    admin: { 
        title: 'Administrative Systems Deployment', 
        keyword: 'Admin', 
        color: '#3b82f6',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        )
    },
    hr: { 
        title: 'HR Systems Deployment', 
        keyword: 'HR', 
        color: '#10b981',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        )
    },
    form: { 
        title: 'Form Builder & Processes Deployment', 
        keyword: 'Form', 
        color: '#8b5cf6',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        )
    },
};

const BatchSubProjectModal = ({ isOpen, onClose, onSave, parentProject }) => {
    const [items, setItems] = useState([]);
    const [users, setUsers] = useState([]);
    const [productGroups, setProductGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [defaultAssigneeId, setDefaultAssigneeId] = useState('');

    useEffect(() => {
        if (isOpen && parentProject) {
            setLoading(true);
            Promise.all([
                userService.getAll(),
                basicDataService.getProductGroupsTree()
            ]).then(([usersRes, groupsRes]) => {
                setUsers(usersRes.data);
                setProductGroups(groupsRes.data);
                
                const initialItems = Object.keys(CONFIG).map(key => {
                    const conf = CONFIG[key];
                    const matchedGroup = groupsRes.data.find(g => g.name.toLowerCase().includes(conf.keyword.toLowerCase())) || groupsRes.data[0];
                    
                    return {
                        key,
                        isSelected: true,
                        title: conf.title,
                        color: conf.color,
                        icon: conf.icon,
                        productGroup: matchedGroup ? matchedGroup.name : '',
                        availableSubsystems: matchedGroup ? matchedGroup.subsystems.map(s => ({ value: s.id, label: s.name })) : [],
                        selectedSubsystems: [],
                        projectManagerId: parentProject.projectManagerId || usersRes.data[0]?.id
                    };
                });
                setItems(initialItems);
                
                if (parentProject.projectManagerId) {
                    setDefaultAssigneeId(parentProject.projectManagerId.toString());
                } else if (usersRes.data[0]?.id) {
                    setDefaultAssigneeId(usersRes.data[0].id.toString());
                }
                
                setLoading(false);
            });
        }
    }, [isOpen, parentProject]);

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        if (field === 'productGroup') {
            const group = productGroups.find(g => g.name === value);
            newItems[index].availableSubsystems = group ? group.subsystems.map(s => ({ value: s.id, label: s.name })) : [];
            newItems[index].selectedSubsystems = [];
        }

        setItems(newItems);
    };

    const handleSubmit = () => {
        const selectedItems = items.filter(i => i.isSelected).map(i => ({
            title: i.title,
            productGroup: i.productGroup,
            projectManagerId: parseInt(i.projectManagerId),
            color: i.color,
            subsystemIds: i.selectedSubsystems.map(s => s.value)
        }));

        if (selectedItems.length === 0) {
            alert("Please select at least one sub-project.");
            return;
        }

        onSave({
            subProjects: selectedItems,
            defaultAssigneeId: defaultAssigneeId ? parseInt(defaultAssigneeId) : null
        });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                dir="ltr"
            >
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
                >
                    <div className="p-6 border-b bg-slate-50">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800">Auto-Generate Sub-Projects</h3>
                                <p className="text-sm text-slate-500 mt-1">Parent Project: <span className="font-bold text-blue-600">{parentProject?.title}</span></p>
                            </div>
                            <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-bold text-sm">
                                {items.filter(i => i.isSelected).length} Selected
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-4">
                            <label className="text-sm font-bold text-slate-700">Default Specialist for Tasks:</label>
                            <select 
                                value={defaultAssigneeId} 
                                onChange={(e) => setDefaultAssigneeId(e.target.value)}
                                className="flat-input px-4 py-2 rounded-xl text-sm w-64"
                            >
                                <option value="">Unassigned</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.fullName}</option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-400">Tasks created from subsystems will be assigned to this specialist.</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                        {loading ? <div className="text-center p-10 text-slate-500">Preparing suggestions...</div> : (
                            <div className="grid grid-cols-1 gap-4">
                                {items.map((item, idx) => (
                                    <motion.div 
                                        key={item.key} 
                                        layout
                                        className={`relative border-2 rounded-2xl p-5 transition-all duration-200 ${item.isSelected ? 'bg-white border-blue-500 shadow-lg shadow-blue-100' : 'bg-slate-100 border-slate-200 opacity-60 grayscale'}`}
                                    >
                                        <div className="absolute top-4 right-4">
                                            <input 
                                                type="checkbox" 
                                                checked={item.isSelected} 
                                                onChange={(e) => handleItemChange(idx, 'isSelected', e.target.checked)}
                                                className="w-6 h-6 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                        </div>

                                        <div className="flex flex-col md:flex-row gap-6 items-start">
                                            <div className="flex items-center gap-4 min-w-[250px]">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md`} style={{ backgroundColor: item.color }}>
                                                    {item.icon}
                                                </div>
                                                <div>
                                                    <input 
                                                        type="text" 
                                                        value={item.title}
                                                        onChange={(e) => handleItemChange(idx, 'title', e.target.value)}
                                                        className="font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none w-full transition-colors text-sm"
                                                        disabled={!item.isSelected}
                                                    />
                                                    <div className="text-xs text-slate-400 mt-1">Sub-Project Title</div>
                                                </div>
                                            </div>

                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Product Group</label>
                                                    <select 
                                                        value={item.productGroup} 
                                                        onChange={(e) => handleItemChange(idx, 'productGroup', e.target.value)}
                                                        className="flat-input w-full text-sm py-2 rounded-xl bg-slate-50"
                                                        disabled={!item.isSelected}
                                                    >
                                                        {productGroups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                                                    </select>
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Subsystems (For Tasks Generation)</label>
                                                    <Select
                                                        isMulti
                                                        options={item.availableSubsystems}
                                                        value={item.selectedSubsystems}
                                                        onChange={(val) => handleItemChange(idx, 'selectedSubsystems', val)}
                                                        placeholder="Select subsystems..."
                                                        isDisabled={!item.isSelected}
                                                        className="text-sm"
                                                        styles={{
                                                            control: (base) => ({ ...base, borderRadius: '0.75rem', borderColor: '#e2e8f0', backgroundColor: item.isSelected ? 'white' : '#f1f5f9' }),
                                                        }}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Project Manager</label>
                                                    <select 
                                                        value={item.projectManagerId} 
                                                        onChange={(e) => handleItemChange(idx, 'projectManagerId', e.target.value)}
                                                        className="flat-input w-full text-sm py-2 rounded-xl"
                                                        disabled={!item.isSelected}
                                                    >
                                                        {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t bg-white flex justify-end gap-3">
                        <button onClick={onClose} className="px-6 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors text-sm">
                            Cancel
                        </button>
                        <button onClick={handleSubmit} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm">
                            Confirm & Generate Sub-Projects
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default BatchSubProjectModal;