import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { projectService, crmService, followUpService, taskService, userService } from '../services/apiService';
import { ProjectModal } from './Projects';
import moment from 'jalali-moment';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import JalaliDatePickerCustom from '../components/common/CustomDatePicker';
import NewTaskKanbanModal from '../components/common/NewTaskKanbanModal';
import ConfirmModal from '../components/common/ConfirmModal';
import api from '../services/apiService';
import { SERVER_URL } from '../config';
import StepTimeline from '../components/project/StepTimeline';
import DeliverablesTab from '../components/project/DeliverablesTab';
import AiProjectAnalysisModal from '../components/project/AiProjectAnalysisModal';

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ActionDetailModal = ({ isOpen, onClose, action }) => {
    if (!isOpen || !action) return null;
    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        return moment(dateStr).format('YYYY/MM/DD HH:mm');
    };
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose} dir="ltr">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="text-lg font-bold text-slate-800">Action Details</h3>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block font-bold text-slate-400">User</label><p className="text-slate-800 font-semibold mt-0.5">{action.crmUser || '-'}</p></div>
                        <div><label className="block font-bold text-slate-400">Date & Time</label><p className="text-slate-800 font-medium mt-0.5">{formatDateTime(action.actionDate)}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block font-bold text-slate-400">Activity Type</label><p className="text-slate-800 font-medium mt-0.5">{action.activityType || '-'}</p></div>
                        <div><label className="block font-bold text-slate-400">Duration</label><p className="text-slate-800 font-medium mt-0.5">{action.duration}</p></div>
                    </div>
                    <div><label className="block font-bold text-slate-400">Full Description</label><div className="mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 whitespace-pre-wrap text-slate-700 font-mono text-xs">{action.description || '-'}</div></div>
                    {action.nextAction && (<div><label className="block font-bold text-slate-400">Next Planned Action</label><p className="mt-1 text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-100 font-medium">{action.nextAction}</p></div>)}
                </div>
                <div className="flex justify-end mt-6"><button onClick={onClose} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs">Close</button></div>
            </div>
        </div>
    );
};

const SubProjectCard = ({ project, onEdit, onDelete }) => {
    const themeColor = project.color || '#64748b';
    const isCompleted = project.progress >= 100;
    const avatarUrl = project.projectAssigneeAvatarUrl 
        ? `${SERVER_URL}/${project.projectAssigneeAvatarUrl}` 
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(project.projectAssigneeName || '?')}&background=random&color=fff&size=64`;
    
    return (
        <div className="relative group" dir="ltr">
            <div className="absolute top-2 right-2 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(project); }} 
                    className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-slate-500 hover:bg-amber-400 hover:text-white transition-all duration-200 hover:scale-110"
                    title="Edit Sub-project"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                </button>
                <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(project.id, project.title); }} 
                    className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-slate-500 hover:bg-red-500 hover:text-white transition-all duration-200 hover:scale-110"
                    title="Delete Sub-project"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
            
            <Link to={`/projects/${project.id}`} className="block">
                <div 
                    className="bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full border-l-4"
                    style={{ 
                        borderLeftColor: themeColor,
                        borderTopColor: themeColor,
                        borderTopWidth: '2px',
                        borderTopStyle: 'solid'
                    }}
                >
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-slate-800 text-sm truncate max-w-[70%]">{project.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColor }}></div>
                        <p className="text-xs text-slate-500 font-medium">CRM Code: {project.crmCode}</p>
                    </div>
                    
                    <div className="flex items-center gap-2.5 mt-3 pt-2.5 border-t border-slate-100">
                        <img 
                            src={avatarUrl} 
                            alt="Specialist" 
                            className="w-7 h-7 rounded-full object-cover border border-slate-200" 
                            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(project.projectAssigneeName || '?')}&background=random&color=fff&size=64`; }}
                        />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Specialist:</span>
                            <span className="text-xs text-slate-700 font-semibold">{project.projectAssigneeName || 'Unassigned'}</span>
                        </div>
                    </div>
                    
                    <div className="mt-3">
                        <div className="flex justify-between items-center text-xs text-slate-400 mb-1 font-medium">
                            <span>Progress</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-700">{project.progress}%</span>
                                {isCompleted && (
                                    <span className="bg-emerald-100 text-emerald-700 text-[9px] px-2 py-0.5 rounded-full flex items-center gap-0.5 font-bold">
                                        ✓ Completed
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="bg-slate-100 rounded-full h-1.5 w-full overflow-hidden">
                            <div className="h-1.5 rounded-full transition-all duration-500" style={{ backgroundColor: themeColor, width: `${project.progress}%` }}></div>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
};

const FollowUpModal = ({ isOpen, onClose, onSave, followUpToEdit, projectId }) => {
    const [content, setContent] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    const [reminderDate, setReminderDate] = useState('');
    const [isResolved, setIsResolved] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (followUpToEdit) {
                setContent(followUpToEdit.content || '');
                setFollowUpDate(moment(followUpToEdit.followUpDate).format('YYYY/MM/DD'));
                setReminderDate(followUpToEdit.reminderDate ? moment(followUpToEdit.reminderDate).format('YYYY/MM/DD') : '');
                setIsResolved(followUpToEdit.isResolved || false);
            } else {
                setContent('');
                setFollowUpDate(moment().format('YYYY/MM/DD'));
                setReminderDate('');
                setIsResolved(false);
            }
        }
    }, [isOpen, followUpToEdit]);

    const convertToISO = (dateStr) => {
        if (!dateStr) return null;
        const m = moment(dateStr, 'YYYY/MM/DD');
        if (!m.isValid()) return null;
        m.hour(12).minute(0).second(0);
        return m.toISOString();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!content.trim()) { toast.error('Please enter follow-up content.'); return; }
        const submitData = {
            projectId,
            content,
            followUpDate: convertToISO(followUpDate),
            isResolved,
            reminderDate: reminderDate ? convertToISO(reminderDate) : null
        };
        onSave(submitData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose} dir="ltr">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-slate-800 mb-4">{followUpToEdit ? 'Edit Follow-Up' : 'Add New Follow-Up'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-xs font-bold text-slate-700 mb-1.5">Follow-up / Note Content</label><textarea value={content} onChange={e => setContent(e.target.value)} rows="4" className="flat-input w-full text-xs py-2" required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-slate-700 mb-1.5">Follow-up Date</label><JalaliDatePickerCustom value={followUpDate} onChange={setFollowUpDate} /></div>
                        <div><label className="block text-xs font-bold text-slate-700 mb-1.5">Reminder Date (Optional)</label><JalaliDatePickerCustom value={reminderDate} onChange={setReminderDate} /></div>
                    </div>
                    <div className="flex items-center"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isResolved} onChange={e => setIsResolved(e.target.checked)} className="w-4 h-4 rounded text-blue-600" /><span className="text-xs font-bold text-slate-700">Mark as Resolved</span></label></div>
                    <div className="flex gap-3 pt-4"><button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-bold text-xs shadow-md">Save</button><button type="button" onClick={onClose} className="flex-1 flat-button py-2 rounded-xl font-bold text-xs">Cancel</button></div>
                </form>
            </div>
        </div>
    );
};

const DocumentsTab = ({ projectId }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [description, setDescription] = useState('');
    const { user } = useAuth();

    const fetchDocuments = async () => {
        try {
            const res = await api.get(`/projects/${projectId}/documents`);
            setDocuments(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Error fetching documents");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDocuments(); }, [projectId]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) { toast.error("Please select a file."); return; }
        const formData = new FormData();
        formData.append('File', selectedFile);
        formData.append('Description', description);
        setUploading(true);
        try {
            await api.post(`/projects/${projectId}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success("File uploaded successfully.");
            setSelectedFile(null);
            setDescription('');
            fetchDocuments();
        } catch (err) { toast.error("Error uploading file"); } finally { setUploading(false); }
    };

    const handleDownload = async (doc) => {
        try {
            const res = await api.get(`/projects/${projectId}/documents/${doc.id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', doc.originalFileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) { toast.error("Error downloading file"); }
    };

    const handleDelete = async (docId) => {
        if (!window.confirm("Are you sure you want to delete this document?")) return;
        try {
            await api.delete(`/projects/${projectId}/documents/${docId}`);
            toast.success("Document deleted.");
            fetchDocuments();
        } catch (err) { toast.error("Error deleting file"); }
    };

    if (loading) return <div className="text-center py-8 text-slate-500 text-sm">Loading documents...</div>;
    return (
        <div dir="ltr">
            <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-3 text-sm">Upload New Document</h3>
                <div className="flex flex-col md:flex-row gap-4">
                    <input type="file" onChange={handleFileChange} className="flex-1 flat-input py-2 px-3 text-xs" />
                    <input type="text" placeholder="Description (Optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="flex-1 flat-input py-2 px-3 text-xs" />
                    <button onClick={handleUpload} disabled={!selectedFile || uploading} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-xs disabled:opacity-50">{uploading ? 'Uploading...' : 'Upload File'}</button>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 font-medium">Max file size: 20 MB</p>
            </div>
            {documents.length === 0 ? (<p className="text-slate-400 text-center py-8 bg-white rounded-2xl border-2 border-dashed text-xs">No documents uploaded for this project yet.</p>) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents.map(doc => (
                        <div key={doc.id} className="bg-white border rounded-xl p-3 flex justify-between items-center hover:shadow-md transition-shadow">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2"><svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><span className="font-bold text-slate-800 text-xs truncate" title={doc.originalFileName}>{doc.originalFileName}</span></div>
                                <div className="text-[11px] text-slate-400 mt-1 font-medium">{formatFileSize(doc.fileSize)} • {moment(doc.uploadedAt).format('YYYY/MM/DD HH:mm')} • By {doc.uploadedBy}</div>
                                {doc.description && <div className="text-xs text-slate-600 mt-1 italic">📝 {doc.description}</div>}
                            </div>
                            <div className="flex gap-1 ml-2">
                                <button onClick={() => handleDownload(doc)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-full transition-colors" title="Download"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
                                {user?.roles?.includes('SuperAdmin') || user?.roles?.includes('ProjectManager') ? (
                                    <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Delete"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ProjectDetail = () => {
    const { projectId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [actions, setActions] = useState([]);
    const [followUps, setFollowUps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [activeTab, setActiveTab] = useState('subprojects');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [flatProjects, setFlatProjects] = useState([]);
    const [editingProject, setEditingProject] = useState(null);
    const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
    const [editingFollowUp, setEditingFollowUp] = useState(null);
    const [selectedAction, setSelectedAction] = useState(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const { user } = useAuth();
    
    // AI Analysis State
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);

    const [groupedTasks, setGroupedTasks] = useState([]);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [defaultChecklistStepId, setDefaultChecklistStepId] = useState(null);
    
    const [deleteSubProjectModal, setDeleteSubProjectModal] = useState({ isOpen: false, projectId: null, projectTitle: '' });
    const [deleteFollowUpModal, setDeleteFollowUpModal] = useState({ isOpen: false, id: null, content: '' });
    const [isSyncingSteps, setIsSyncingSteps] = useState(false);
    
    const [usersList, setUsersList] = useState([]);
    const [projectAssigneeId, setProjectAssigneeId] = useState(null);

    const isSubProject = !!project?.parentProjectId;

    const fetchData = async () => {
        if (!projectId) return;
        try {
            setLoading(true);
            const [detailRes, flatRes, usersRes] = await Promise.all([
                projectService.getById(projectId),
                projectService.getAllFlat(),
                userService.getAll()
            ]);
            setProject(detailRes.data);
            setFlatProjects(flatRes.data);
            setUsersList(usersRes.data);
            setProjectAssigneeId(detailRes.data.projectAssigneeId);
        } catch (error) {
            toast.error("Error fetching project details.");
        } finally {
            setLoading(false);
        }
    };

    const fetchActions = async () => {
        try {
            const res = await crmService.getProjectActions(projectId);
            setActions(res.data);
        } catch (error) { console.error("Failed to fetch actions", error); }
    };

    const fetchFollowUps = async () => {
        try {
            const res = await followUpService.getByProject(projectId);
            setFollowUps(res.data);
        } catch (error) { console.error("Failed to fetch follow-ups", error); }
    };

    const fetchGroupedTasks = async () => {
        try {
            const res = await taskService.getTasksGroupedByChecklist(projectId);
            setGroupedTasks(res.data);
        } catch (error) {
            console.error("Failed to fetch grouped tasks:", error);
            toast.error("Error fetching project steps.");
        }
    };

    const handleSyncSteps = async () => {
        if (!project?.productGroup) {
            toast.error("Product group is not set for this project.");
            return;
        }
        setIsSyncingSteps(true);
        const toastId = toast.loading("Syncing project steps...");
        try {
            await projectService.syncProjectSteps(projectId);
            toast.success("Project steps synced successfully.", { id: toastId });
            await fetchGroupedTasks();
            await fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Error syncing project steps.", { id: toastId });
        } finally {
            setIsSyncingSteps(false);
        }
    };

    const handleSyncActions = async () => {
        setIsSyncing(true);
        const toastId = toast.loading("Fetching CRM actions...");
        try {
            await crmService.syncProjectActions(projectId);
            await fetchActions();
            await fetchData();
            toast.success("CRM actions updated.", { id: toastId });
        } catch (error) {
            toast.error("Error syncing with CRM.", { id: toastId });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSyncStepToGantt = async (stepId) => {
        try {
            await taskService.syncSingleStepToGantt(projectId, stepId);
        } catch (err) {
            console.error("Auto-sync failed:", err);
        }
    };

    const handleSyncToGantt = async () => {
        const tasksToSync = [];
        groupedTasks.forEach(step => {
            (step.tasks || []).forEach(task => {
                if (task.startDate) {
                    tasksToSync.push({
                        stepTaskId: task.id,
                        title: task.title,
                        sessionDate: task.startDate,
                        assigneeId: task.assigneeId || projectAssigneeId,
                        isCompleted: task.status === 'Done',
                        stepId: step.id
                    });
                }
            });
        });

        if (tasksToSync.length === 0) {
            toast.error('No tasks with specified session date found.');
            return;
        }

        try {
            const response = await taskService.syncStepTasksToGantt(projectId, tasksToSync);
            toast.success(response.data.message || 'Gantt Chart sync complete.');
            if (window.confirm('Sync complete. Navigate to Gantt Chart page now?')) {
                navigate(`/gantt?projectId=${projectId}`);
            }
        } catch (error) {
            console.error(error);
            toast.error('Error syncing to Gantt Chart.');
        }
    };

    const goBackToProjects = () => navigate('/projects');
    const goBackToParent = () => {
        if (project?.parentProjectId) navigate(`/projects/${project.parentProjectId}`);
        else navigate('/projects');
    };

    useEffect(() => {
        fetchData();
        fetchActions();
        fetchFollowUps();
        fetchGroupedTasks();
        if (location.state?.activeTab) setActiveTab(location.state.activeTab);
    }, [projectId, location.state]);

    useEffect(() => {
        if (project) {
            if (isSubProject && !location.state?.activeTab) setActiveTab('checklist');
            else if (!isSubProject && !location.state?.activeTab) setActiveTab('subprojects');
        }
    }, [project, isSubProject, location.state?.activeTab]);

    const handleSaveProject = async (projectData, idToUpdate) => {
        try {
            if (idToUpdate) {
                await projectService.update(idToUpdate, projectData);
                toast.success("Project updated successfully.");
            } else {
                await projectService.create(projectData);
                toast.success("New sub-project created.");
            }
            setIsModalOpen(false);
            setEditingProject(null);
            fetchData();
        } catch (error) { 
            toast.error("Operation failed."); 
        }
    };

    const handleSaveFollowUp = async (data) => {
        try {
            if (editingFollowUp) {
                await followUpService.update(editingFollowUp.id, data);
                toast.success("Follow-up updated.");
            } else {
                await followUpService.create(data);
                toast.success("Follow-up added.");
            }
            setIsFollowUpModalOpen(false);
            setEditingFollowUp(null);
            fetchFollowUps();
        } catch (error) { toast.error("Error saving follow-up."); }
    };

    const confirmDeleteFollowUp = (id, content) => setDeleteFollowUpModal({ isOpen: true, id, content });
    const handleDeleteFollowUp = async () => {
        try {
            await followUpService.delete(deleteFollowUpModal.id);
            toast.success("Follow-up deleted.");
            fetchFollowUps();
        } catch (error) { toast.error("Error deleting."); } finally { setDeleteFollowUpModal({ isOpen: false, id: null, content: '' }); }
    };

    const confirmDeleteSubProject = (id, title) => setDeleteSubProjectModal({ isOpen: true, projectId: id, projectTitle: title });
    const handleDeleteSubProject = async () => {
        try {
            await projectService.delete(deleteSubProjectModal.projectId);
            toast.success(`Sub-project "${deleteSubProjectModal.projectTitle}" deleted.`);
            fetchData();
        } catch (error) { toast.error("Error deleting sub-project."); } finally { setDeleteSubProjectModal({ isOpen: false, projectId: null, projectTitle: '' }); }
    };

    const handleActionDoubleClick = (action) => {
        setSelectedAction(action);
        setIsActionModalOpen(true);
    };

    const formatDate = (dateString) => dateString ? moment(dateString).format('YYYY/MM/DD') : '-';
    const formatDateTime = (dateString) => dateString ? moment(dateString).format('YYYY/MM/DD HH:mm') : '-';

    const handleSaveTask = async (taskData, taskId) => {
        try {
            if (taskId) await taskService.updateForProject(projectId, taskId, taskData);
            else await taskService.createForProject(projectId, taskData);
            toast.success(taskId ? "Task updated." : "New task created.");
            setIsTaskModalOpen(false);
            setEditingTask(null);
            await fetchGroupedTasks();
            return true;
        } catch (error) {
            toast.error("Error saving task.");
            return false;
        }
    };

    if (loading) return <div className="p-8 text-center font-bold text-slate-500 text-sm" dir="ltr">Loading project details...</div>;
    if (!project) return <div className="p-8 text-center text-red-500 text-sm" dir="ltr">Project not found.</div>;

    const isAdmin = user?.roles?.includes('SuperAdmin') || user?.roles?.includes('ProjectManager');
    const canEditFollowUp = (followUp) => isAdmin || followUp.userId === user?.id;
    const showSyncStepsButton = isSubProject && groupedTasks.length === 0;

    const subProjectTabs = [
        { key: 'checklist', label: 'Project Steps' },
        { key: 'followups', label: 'Follow-ups & Notes' },
        { key: 'crm_actions', label: 'CRM Actions' },
        { key: 'documents', label: 'Documents' }
    ];
    const parentProjectTabs = [ 
        { key: 'subprojects', label: 'Sub-Projects' },
        { key: 'deliverables', label: 'Deliverables' }
    ];
    const tabs = isSubProject ? subProjectTabs : parentProjectTabs;

    return (
        <div className="h-full flex flex-col overflow-hidden" dir="ltr">
            <div className="flat-card rounded-2xl p-5 m-4 mb-0 bg-white flex-shrink-0" style={{ borderTopColor: project.color || '#3b82f6', borderTopWidth: '6px', borderTopStyle: 'solid' }}>
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-black text-slate-800">{project.title}</h1>
                            <button
                                onClick={() => setIsAiModalOpen(true)}
                                className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs hover:shadow-lg transition-all flex items-center gap-1.5 shadow-indigo-100"
                            >
                                <span>⚡</span> تحلیل هوشمند با AI
                            </button>
                        </div>
                        <p className="text-slate-500 mt-1 text-xs">{project.description || 'No description provided.'}</p>
                        {project.customStatus && (<span className="inline-block mt-2 bg-purple-100 text-purple-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold">Custom Status: {project.customStatus}</span>)}
                        {project.blockedBy && (<div className="mt-1 text-red-600 text-xs font-bold">⛔ Administrative Block - {project.blockedBy}: {project.blockedReason}</div>)}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setEditingProject(project); setIsModalOpen(true); }}
                            className="flat-button px-3 py-1 text-xs font-bold text-slate-700 hover:text-blue-600"
                        >
                            ✏️ Edit Project
                        </button>
                        <span className="px-3 py-1 rounded-xl text-xs font-bold bg-blue-100 text-blue-700 shadow-sm">{project.status}</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 border-t pt-3 text-xs">
                    <div><strong className="block text-slate-400">CRM Code:</strong> <span className="text-slate-800 font-bold">{project.crmCode}</span></div>
                    <div><strong className="block text-slate-400">Buyer:</strong> <span className="text-slate-800 font-bold">{project.buyerName || '-'}</span></div>
                    <div><strong className="block text-slate-400">Project Manager:</strong> <span className="text-slate-800 font-bold">{project.projectManagerName || '-'}</span></div>
                    <div><strong className="block text-slate-400">Specialist:</strong> <span className="text-slate-800 font-bold">{project.projectAssigneeName || 'Unassigned'}</span></div>
                    <div><strong className="block text-slate-400">Start Date:</strong> <span className="text-slate-800 font-bold">{formatDate(project.startDate)}</span></div>
                    <div><strong className="block text-slate-400">End Date:</strong> <span className="text-slate-800 font-bold">{formatDate(project.endDate)}</span></div>
                    <div><strong className="block text-slate-400">Credit:</strong> <span className="text-emerald-600 font-bold">{project.credit || '-'}</span></div>
                    <div><strong className="block text-slate-400">Committed Hours:</strong> <span className="text-slate-800 font-bold">{project.committedHours || 0} hrs</span></div>
                </div>
                <div className="mt-4 pt-3 border-t">
                    <div className="flex justify-between items-center mb-1"><span className="font-bold text-slate-700 text-xs">Overall Progress (Weighted):</span><span className="font-black text-blue-600 text-sm">{project.calculatedProgress}%</span></div>
                    <div className="bg-slate-100 rounded-full h-2 w-full overflow-hidden"><div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-1000" style={{ width: `${project.calculatedProgress}%` }}></div></div>
                </div>
            </div>

            <div className="px-4 mt-4">
                <div className="flex gap-6 border-b border-slate-200">
                    {tabs.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`pb-2.5 px-1 text-sm font-bold transition-all duration-200 ${activeTab === tab.key ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400 hover:text-slate-700'}`}>{tab.label}</button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-4 px-4 mt-4 scrollbar-flat">
                {!isSubProject && activeTab === 'subprojects' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-base font-bold text-slate-700">Sub-Projects Portfolio</h2>
                            <div className="flex gap-3">
                                <button onClick={goBackToProjects} className="flat-button px-4 py-2 rounded-xl text-slate-600 font-bold text-xs flex items-center gap-2">
                                    ← Back to Projects
                                </button>
                                <button onClick={() => { setEditingProject(null); setIsModalOpen(true); }} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-xl font-bold hover:shadow-lg transition-all text-xs flex items-center gap-2">
                                    + Add Sub-Project
                                </button>
                            </div>
                        </div>
                        {project.subProjects && project.subProjects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {project.subProjects.map(sub => (
                                    <SubProjectCard 
                                        key={sub.id} 
                                        project={sub} 
                                        onEdit={(p) => { setEditingProject(p); setIsModalOpen(true); }} 
                                        onDelete={(id, title) => confirmDeleteSubProject(id, title)} 
                                    />
                                ))}
                            </div>
                        ) : ( <p className="text-slate-400 text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed text-xs">No sub-projects associated with this project yet.</p> )}
                    </div>
                )}

                {!isSubProject && activeTab === 'deliverables' && (
                    <DeliverablesTab projectId={parseInt(projectId)} />
                )}

                {isSubProject && activeTab === 'checklist' && (
                    <div className="space-y-6">
                        <div className="flex justify-end gap-3">
                            <button onClick={goBackToParent} className="flat-button px-4 py-2 rounded-xl text-slate-600 font-bold text-xs flex items-center gap-2">
                                ← Back to Parent Project
                            </button>
                            <button onClick={handleSyncToGantt} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-xs">
                                ⚡ Sync to Gantt Chart
                            </button>
                        </div>
                        {showSyncStepsButton && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex justify-between items-center">
                                <div><p className="text-amber-800 font-bold text-sm">Project steps not synced yet.</p><p className="text-amber-600 text-xs">Product Group: {project.productGroup || 'Undefined'}</p></div>
                                <button onClick={handleSyncSteps} disabled={isSyncingSteps} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-bold text-xs disabled:opacity-50">{isSyncingSteps ? 'Syncing...' : 'Sync Steps'}</button>
                            </div>
                        )}
                        {groupedTasks.length > 0 ? (
                            groupedTasks.map((step, idx) => (
                                <StepTimeline 
                                    key={step.id} 
                                    step={step} 
                                    projectId={parseInt(projectId)} 
                                    onRefresh={fetchGroupedTasks} 
                                    projectAssigneeId={projectAssigneeId}
                                    usersList={usersList}
                                    onSyncStep={handleSyncStepToGantt}
                                    stepCount={groupedTasks.length}
                                    stepIndex={idx + 1}
                                />
                            ))
                        ) : ( !showSyncStepsButton && (
                            <p className="text-slate-400 text-center py-8 bg-white rounded-2xl border-2 border-dashed text-xs">No steps defined for this project.</p>
                        ))}
                    </div>
                )}

                {isSubProject && activeTab === 'followups' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-base font-bold text-slate-700">Follow-ups & Notes</h2>
                            <button onClick={() => { setEditingFollowUp(null); setIsFollowUpModalOpen(true); }} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:shadow-lg transition-all">+ Add Follow-up</button>
                        </div>
                        {followUps.length > 0 ? (
                            <div className="space-y-3">
                                {followUps.map(fu => (
                                    <div key={fu.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">{fu.content}</p>
                                                <div className="flex flex-wrap gap-4 mt-2 text-[11px] text-slate-400 font-medium">
                                                    <span>📅 {formatDateTime(fu.followUpDate)}</span><span>👤 {fu.userFullName}</span>
                                                    <span className={fu.isResolved ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>{fu.isResolved ? '✓ Resolved' : '⏳ Pending'}</span>
                                                    {fu.reminderDate && (<span className="text-blue-500 font-bold">🔔 Reminder: {formatDate(fu.reminderDate)}</span>)}
                                                </div>
                                            </div>
                                            {canEditFollowUp(fu) && (
                                                <div className="flex gap-1 ml-2">
                                                    <button onClick={() => { setEditingFollowUp(fu); setIsFollowUpModalOpen(true); }} className="p-1 text-slate-400 hover:text-amber-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg></button>
                                                    <button onClick={() => confirmDeleteFollowUp(fu.id, fu.content)} className="p-1 text-slate-400 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : ( <p className="text-slate-400 text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed text-xs">No follow-ups recorded yet.</p> )}
                    </div>
                )}

                {isSubProject && activeTab === 'crm_actions' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-base font-bold text-slate-700">CRM Specialist Activity History</h2>
                            <button onClick={handleSyncActions} disabled={isSyncing} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-md transition-all">{isSyncing ? 'Syncing CRM...' : 'Sync from CRM'}</button>
                        </div>
                        {actions.length > 0 ? (
                            <div className="overflow-x-auto border rounded-2xl">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th className="p-3 border-b font-bold text-slate-600">User</th>
                                            <th className="p-3 border-b font-bold text-slate-600">Action Date & Time</th>
                                            <th className="p-3 border-b font-bold text-slate-600">Activity Type</th>
                                            <th className="p-3 border-b font-bold text-slate-600">Duration</th>
                                            <th className="p-3 border-b font-bold text-slate-600">Description Summary</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {actions.map((act, idx) => (
                                            <tr key={idx} className="border-b hover:bg-slate-50 cursor-pointer" onDoubleClick={() => handleActionDoubleClick(act)}>
                                                <td className="p-3 font-semibold text-slate-800">{act.crmUser}</td>
                                                <td className="p-3 font-mono text-slate-600">{moment(act.actionDate).format('YYYY/MM/DD HH:mm')}</td>
                                                <td className="p-3 text-slate-600">{act.activityType}</td>
                                                <td className="p-3 font-semibold text-slate-700">{act.duration}</td>
                                                <td className="p-3 max-w-md truncate text-slate-600">{act.description || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                                <p className="text-slate-400 font-bold text-xs">No CRM actions recorded or fetched for this project yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {isSubProject && activeTab === 'documents' && (<DocumentsTab projectId={parseInt(projectId)} />)}
            </div>

            <ProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveProject} allProjects={flatProjects} parentProject={project} project={editingProject} />
            <FollowUpModal isOpen={isFollowUpModalOpen} onClose={() => { setIsFollowUpModalOpen(false); setEditingFollowUp(null); }} onSave={handleSaveFollowUp} followUpToEdit={editingFollowUp} projectId={parseInt(projectId)} />
            <ActionDetailModal isOpen={isActionModalOpen} onClose={() => setIsActionModalOpen(false)} action={selectedAction} />
            <NewTaskKanbanModal isOpen={isTaskModalOpen} onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); setDefaultChecklistStepId(null); }} onSaveTask={handleSaveTask} taskToEdit={editingTask} projectId={parseInt(projectId)} defaultChecklistStepId={defaultChecklistStepId} />
            <ConfirmModal isOpen={deleteSubProjectModal.isOpen} onClose={() => setDeleteSubProjectModal({ isOpen: false, projectId: null, projectTitle: '' })} onConfirm={handleDeleteSubProject} title="Delete Sub-Project" message={`Are you sure you want to delete sub-project "${deleteSubProjectModal.projectTitle}"?`} confirmText="Delete" type="danger" />
            <ConfirmModal isOpen={deleteFollowUpModal.isOpen} onClose={() => setDeleteFollowUpModal({ isOpen: false, id: null, content: '' })} onConfirm={handleDeleteFollowUp} title="Delete Follow-Up" message="Are you sure you want to delete this follow-up note?" confirmText="Delete" type="danger" />
            
            <AiProjectAnalysisModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                projectId={parseInt(projectId)}
                projectTitle={project.title}
            />
        </div>
    );
};

export default ProjectDetail;