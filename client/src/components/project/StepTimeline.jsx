import { useState, useEffect } from 'react';
import moment from 'jalali-moment';
import CustomDatePicker from '../common/CustomDatePicker';
import { taskService } from '../../services/apiService';
import toast from 'react-hot-toast';
import api from '../../services/apiService';

const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    return moment(dateStr).format('YYYY/MM/DD');
};

const AddSessionModal = ({ isOpen, onClose, onAdd, projectId, stepId, stepName, nextSessionNumber }) => {
    const [title, setTitle] = useState('');
    const [estimatedHours, setEstimatedHours] = useState(4);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTitle(`${stepName} - Session ${nextSessionNumber}`);
        }
    }, [isOpen, stepName, nextSessionNumber]);

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error("Please enter a session title");
            return;
        }
        setIsSubmitting(true);
        try {
            await taskService.createForProject(projectId, {
                title: title.trim(),
                checklistStepId: stepId,
                estimatedHours,
                allocatedHours: 0,
                priority: 'Medium',
                status: 'ToDo'
            });
            toast.success("New session added successfully.");
            await onAdd();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Error adding session");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose} dir="ltr">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4 text-slate-800">Add New Session</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-1 text-slate-700">Session Subject</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="flat-input w-full text-sm py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1 text-slate-700">Estimated Hours</label>
                        <input type="number" min="1" step="0.5" value={estimatedHours} onChange={e => setEstimatedHours(parseFloat(e.target.value) || 4)} className="flat-input w-full text-sm py-2" />
                    </div>
                </div>
                <div className="flex gap-3 pt-6 mt-4">
                    <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-bold text-sm hover:bg-blue-700">Confirm</button>
                    <button onClick={onClose} className="flex-1 flat-button py-2 rounded-xl font-bold text-sm">Cancel</button>
                </div>
            </div>
        </div>
    );
};

const StepTimeline = ({ step, projectId, onRefresh, usersList, projectAssigneeId, onSyncStep, stepIndex }) => {
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editData, setEditData] = useState({});
    const [isUpdating, setIsUpdating] = useState(false);
    const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);

    const sortedTasks = [...(step.tasks || [])].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    const isStepCompleted = step.isCompleted;
    const stepProgress = sortedTasks.length > 0 
        ? Math.round((sortedTasks.filter(t => t.status === 'Done').length / sortedTasks.length) * 100)
        : 0;

    const getStatusColor = (task) => {
        if (task.status === 'Done') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
        if (task.allocatedHours > task.estimatedHours) return 'text-red-700 bg-red-50 border-red-200';
        if (task.allocatedHours === task.estimatedHours && task.estimatedHours > 0) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
        if (task.allocatedHours > 0 && task.allocatedHours < task.estimatedHours) return 'text-amber-700 bg-amber-50 border-amber-200';
        return 'text-slate-500 bg-slate-50 border-slate-200';
    };

    const startEdit = (task) => {
        setEditingTaskId(task.id);
        const sessionDate = task.startDate ? moment(task.startDate).format('YYYY/MM/DD') : '';
        setEditData({
            sessionDate,
            assigneeId: task.assigneeId ? String(task.assigneeId) : (projectAssigneeId ? String(projectAssigneeId) : ''),
            estimatedHours: task.estimatedHours || 0,
            allocatedHours: task.allocatedHours || 0
        });
    };

    const saveEdit = async (taskId) => {
        setIsUpdating(true);
        try {
            const updatePayload = {};
            if (editData.sessionDate) {
                const m = moment(editData.sessionDate, 'YYYY/MM/DD');
                if (m.isValid()) updatePayload.startDate = m.hour(12).toISOString();
            }
            updatePayload.assigneeId = editData.assigneeId ? parseInt(editData.assigneeId, 10) : null;
            updatePayload.estimatedHours = parseFloat(editData.estimatedHours) || 0;
            updatePayload.allocatedHours = parseFloat(editData.allocatedHours) || 0;
            
            await taskService.updateForProject(projectId, taskId, updatePayload);
            toast.success("Changes saved.");
            if (onSyncStep) onSyncStep(step.id);
            setTimeout(() => {
                onRefresh();
                setEditingTaskId(null);
            }, 500);
        } catch (error) {
            console.error(error);
            toast.error("Error saving changes");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleMarkStepComplete = async () => {
        if (step.isCompleted || isCompleting) return;
        setIsCompleting(true);
        try {
            await api.post(`/projects/${projectId}/steps/${step.id}/complete`);
            toast.success(`Step "${step.stepName}" completed successfully.`);
            setTimeout(() => {
                onRefresh();
                setIsCompleting(false);
            }, 500);
        } catch (error) {
            console.error(error);
            toast.error("Error completing step");
            setIsCompleting(false);
        }
    };

    return (
        <div dir="ltr">
            <div className="relative mb-8">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 -z-0"></div>
                
                <div className="relative flex items-start gap-4">
                    <div className="relative z-10">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${isStepCompleted ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
                            {isStepCompleted ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <span className="font-extrabold text-lg">{stepIndex}</span>
                            )}
                        </div>
                        {!isStepCompleted && stepProgress > 0 && (
                            <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                                {stepProgress}%
                            </div>
                        )}
                    </div>

                    <div className={`flex-1 bg-white rounded-2xl shadow-md border overflow-hidden transition-all ${isStepCompleted ? 'border-emerald-200' : 'border-slate-100'} hover:shadow-lg`}>
                        <div className={`px-5 py-3 border-b flex justify-between items-center ${isStepCompleted ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                            <div className="flex items-center gap-3">
                                <h3 className="font-bold text-slate-800 text-base">{step.stepName}</h3>
                                {isStepCompleted ? (
                                    <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-bold">Completed</span>
                                ) : (
                                    <button
                                        onClick={handleMarkStepComplete}
                                        disabled={isCompleting}
                                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm"
                                    >
                                        {isCompleting ? 'Completing...' : '✓ Complete Step'}
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => setIsAddSessionModalOpen(true)}
                                    className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                    Add Session
                                </button>
                                <div className="text-xs text-slate-400 font-medium">
                                    {sortedTasks.length} Sessions • {stepProgress}% Progress
                                </div>
                            </div>
                        </div>

                        <div className="p-4 space-y-3">
                            {sortedTasks.map((task) => {
                                const isEditing = editingTaskId === task.id;
                                const statusColor = getStatusColor(task);
                                
                                return (
                                    <div key={task.id} className={`border rounded-xl p-3 transition-all ${statusColor}`}>
                                        {isEditing ? (
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-600 mb-1">Session Date</label>
                                                        <div className="h-10">
                                                            <CustomDatePicker 
                                                                value={editData.sessionDate} 
                                                                onChange={(val) => setEditData(prev => ({ ...prev, sessionDate: val }))} 
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-600 mb-1">Specialist</label>
                                                        <select
                                                            value={editData.assigneeId}
                                                            onChange={(e) => setEditData(prev => ({ ...prev, assigneeId: e.target.value }))}
                                                            className="flat-input w-full py-1.5 text-xs rounded-lg h-10"
                                                        >
                                                            <option value="">Unassigned</option>
                                                            {usersList.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-600 mb-1">Estimated Hours</label>
                                                        <input type="number" step="0.5" value={editData.estimatedHours} onChange={(e) => setEditData(prev => ({ ...prev, estimatedHours: e.target.value }))} className="flat-input w-full h-10 text-center rounded-lg text-sm" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-600 mb-1">Allocated Hours</label>
                                                        <input type="number" step="0.5" value={editData.allocatedHours} onChange={(e) => setEditData(prev => ({ ...prev, allocatedHours: e.target.value }))} className="flat-input w-full h-10 text-center rounded-lg text-sm" />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setEditingTaskId(null)} className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-bold">Cancel</button>
                                                    <button onClick={() => saveEdit(task.id)} disabled={isUpdating} className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">Save</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap items-center justify-between gap-3 cursor-pointer" onClick={() => startEdit(task)}>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-slate-700 w-8">{task.displayOrder}</span>
                                                    <span className="text-slate-800 text-sm font-semibold">{task.title}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs font-medium">
                                                    <span className="font-mono text-slate-500">{formatDate(task.startDate)}</span>
                                                    <span className="text-slate-600">{task.assigneeName || 'Unassigned'}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-slate-400">{task.estimatedHours || 0}h</span>
                                                        <span className="text-slate-300">→</span>
                                                        <span className={`font-bold ${task.allocatedHours > task.estimatedHours ? 'text-red-600' : 'text-emerald-600'}`}>{task.allocatedHours || 0}h</span>
                                                    </div>
                                                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(task)}`}>
                                                        {task.status === 'Done' ? 'Completed' : 'In Progress'}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <AddSessionModal
                isOpen={isAddSessionModalOpen}
                onClose={() => setIsAddSessionModalOpen(false)}
                onAdd={onRefresh}
                projectId={projectId}
                stepId={step.id}
                stepName={step.stepName}
                nextSessionNumber={sortedTasks.length + 1}
            />
        </div>
    );
};

export default StepTimeline;