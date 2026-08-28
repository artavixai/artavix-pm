import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { projectService, userService, basicDataService, crmService } from '../services/apiService';
import moment from 'jalali-moment';
import Select from 'react-select';
import { useAuth } from '../contexts/AuthContext';
import JalaliDatePickerCustom from '../components/common/CustomDatePicker';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/common/ConfirmModal';
import FormSelectionModal from '../components/common/FormSelectionModal';
import AiProjectAnalysisModal from '../components/project/AiProjectAnalysisModal';

const PROJECT_COLORS = [
  { name: 'System Blue', value: '#3b82f6' },
  { name: 'Emerald Green', value: '#10b981' },
  { name: 'Solar Amber', value: '#f59e0b' },
  { name: 'Coral Red', value: '#ef4444' },
  { name: 'Royal Purple', value: '#8b5cf6' },
  { name: 'Deep Pink', value: '#ec4899' },
  { name: 'Dark Navy', value: '#1e40af' },
  { name: 'Modern Slate', value: '#64748b' },
];

const CrmImportTab = ({ onSelectProject }) => {
    const [endDate, setEndDate] = useState(moment().format('YYYY/MM/DD'));
    const [fetchedProjects, setFetchedProjects] = useState([]);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [isFetching, setIsFetching] = useState(false);
    const [isForceSyncing, setIsForceSyncing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const loadData = async () => {
        setIsFetching(true);
        try {
            const response = await crmService.importProjects(endDate);
            if (response.data && response.data.projects) {
                setFetchedProjects(response.data.projects);
                setLastUpdate(response.data.lastUpdate);
                if (response.data.projects.length === 0) toast('New CRM projects list is empty.', { icon: 'ℹ️' });
            }
        } catch (error) {
            console.error(error);
            toast.error("Error fetching CRM data.");
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleForceSync = async () => {
        setIsForceSyncing(true);
        try {
            await loadData();
            toast.success("List updated successfully.");
        } catch (error) {
            toast.error("Error updating CRM list.");
        } finally {
            setIsForceSyncing(false);
        }
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        return moment.utc(dateStr).local().format('YYYY/MM/DD HH:mm');
    };

    const filteredProjects = fetchedProjects.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.crmCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4" dir="ltr">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-700 flex items-center">
                    <span className="font-bold mr-2">Last Auto-Sync:</span>
                    <span className="font-bold text-blue-700">
                        {lastUpdate ? formatTime(lastUpdate) : 'Not synced yet'}
                    </span>
                </div>
                <button
                    onClick={handleForceSync}
                    disabled={isFetching || isForceSyncing}
                    className="bg-white border border-blue-200 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-50 disabled:opacity-50 transition-all flex items-center gap-2 text-xs"
                >
                    <svg className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Sync List Now
                </button>
            </div>

            <div className="relative">
                <input
                    type="text"
                    placeholder="Search project title or CRM code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flat-input w-full px-4 py-2.5 rounded-xl text-xs"
                />
            </div>

            <div className="overflow-y-auto max-h-[350px] border rounded-xl relative">
                {isFetching && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                        <div className="text-blue-600 font-bold text-sm">Loading CRM Projects...</div>
                    </div>
                )}
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 sticky top-0 z-0">
                        <tr>
                            <th className="p-3 font-bold text-slate-600">CRM Code</th>
                            <th className="p-3 font-bold text-slate-600">Project Title</th>
                            <th className="p-3 font-bold text-slate-600">Buyer</th>
                            <th className="p-3 font-bold text-slate-600">Status</th>
                            <th className="p-3 font-bold text-slate-600">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProjects.map((p, idx) => (
                            <tr key={idx} className="border-b hover:bg-slate-50 transition-colors">
                                <td className="p-3 font-bold text-slate-500">{p.crmCode}</td>
                                <td className="p-3 font-semibold text-slate-800">{p.title}</td>
                                <td className="p-3 text-slate-500">{p.buyerName}</td>
                                <td className="p-3"><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">{p.status}</span></td>
                                <td className="p-3">
                                    <button
                                        onClick={() => onSelectProject(p)}
                                        className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded-lg transition-colors font-bold text-xs"
                                    >
                                        Select
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const ProjectModal = ({ project, allProjects, parentProject, isOpen, onClose, onSave }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('manual');
  const [formData, setFormData] = useState({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [users, setUsers] = useState([]);
  const [isSubProject, setIsSubProject] = useState(false);
  const isEditMode = !!project;
  const [basicData, setBasicData] = useState([]);
  const [selectedSubsystemIds, setSelectedSubsystemIds] = useState([]);
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [defaultProductGroup, setDefaultProductGroup] = useState('');

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        userService.getAll(),
        basicDataService.getProductGroupsTree()
      ]).then(([usersRes, basicDataRes]) => {
        setUsers(usersRes.data);
        setBasicData(basicDataRes.data);
        
        let defaultGroup = '';
        if (basicDataRes.data.length > 0) {
          defaultGroup = basicDataRes.data[0].name;
        }
        setDefaultProductGroup(defaultGroup);

        const isCreatingSubProject = !!parentProject;
        setIsSubProject(isCreatingSubProject || (project && project.parentProjectId));
        const initialParentId = parentProject ? parentProject.id : (project ? project.parentProjectId : null);

        let initialFormData = {
            title: '', crmCode: '', buyerName: '', status: 'Planned',
            productGroup: defaultGroup,
            complexity: 'Medium', projectStage: 'Deployment',
            projectManagerId: user?.id || '', parentProjectId: initialParentId,
            projectAssigneeId: '',
            color: '#3b82f6',
            credit: '', committedHours: ''
        };

        if (isEditMode) {
            initialFormData = { ...project };
            setSelectedColor(project.color || '#3b82f6');
        } else if (isCreatingSubProject) {
            initialFormData = {
                ...initialFormData,
                buyerName: parentProject.buyerName,
                projectManagerId: parentProject.projectManagerId,
                projectAssigneeId: parentProject.projectAssigneeId || '',
                crmCode: parentProject.crmCode,
                color: parentProject.color || '#3b82f6',
                productGroup: parentProject.productGroup || defaultGroup
            };
            setSelectedColor(parentProject.color || '#3b82f6');
        }

        setFormData(initialFormData);
        setSelectedSubsystemIds([]);
        setActiveTab('manual');

        const parseDate = (dateStr) => {
          if (!dateStr) return '';
          const m = moment(dateStr);
          return m.isValid() ? m.format('YYYY/MM/DD') : '';
        };

        const initialStartDate = isEditMode ? project.startDate : (isCreatingSubProject ? parentProject.startDate : '');
        const initialEndDate = isEditMode ? project.endDate : (isCreatingSubProject ? parentProject.endDate : '');

        setStartDate(parseDate(initialStartDate));
        setEndDate(parseDate(initialEndDate));
      });
    }
  }, [project, isOpen, user, parentProject, isEditMode]);

  const handleCrmSelect = (crmProject) => {
      const foundManager = users.find(u => u.fullName === crmProject.projectManager);
      setFormData(prev => ({
          ...prev,
          title: crmProject.title,
          crmCode: crmProject.crmCode,
          buyerName: crmProject.buyerName,
          credit: crmProject.credit || '',
          committedHours: crmProject.committedHours || '',
          projectManagerId: foundManager ? foundManager.id : prev.projectManagerId,
          productGroup: prev.productGroup || defaultProductGroup
      }));
      if(crmProject.startDate) setStartDate(crmProject.startDate);
      if(crmProject.endDate) setEndDate(crmProject.endDate);
      setActiveTab('manual');
      toast.success("Loaded project data from CRM.");
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.title) {
        toast.error("Project Title is required.");
        return;
    }

    const formatToISOString = (dateStr) => {
        if (!dateStr) return null;
        const m = moment(dateStr, 'YYYY/MM/DD');
        m.hour(12).minute(0).second(0);
        return m.isValid() ? m.toISOString() : null;
    };

    const finalData = {
      ...formData,
      startDate: formatToISOString(startDate),
      endDate: formatToISOString(endDate),
      parentProjectId: formData.parentProjectId ? parseInt(formData.parentProjectId, 10) : null,
      projectManagerId: formData.projectManagerId ? parseInt(formData.projectManagerId, 10) : null,
      projectAssigneeId: formData.projectAssigneeId ? parseInt(formData.projectAssigneeId, 10) : null,
      weight: formData.weight ? parseInt(formData.weight, 10) : null,
      committedHours: formData.committedHours ? parseInt(formData.committedHours, 10) : null,
      subsystemIds: selectedSubsystemIds,
      color: selectedColor,
      productGroup: formData.productGroup || null
    };
    onSave(finalData, project?.id);
  };

  const projectOptions = allProjects.map(p => ({ value: p.id, label: p.title }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 modal-backdrop" dir="ltr">
      <div className="flat-card rounded-2xl p-8 max-w-4xl w-full bg-white overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">{isEditMode ? 'Edit Project' : (isSubProject ? 'Create Sub-Project' : 'Create New Project')}</h3>
            {!isEditMode && !isSubProject && (
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('manual')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Manual Input</button>
                    <button onClick={() => setActiveTab('crm')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'crm' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Import from CRM</button>
                </div>
            )}
        </div>

        {activeTab === 'crm' ? (
            <CrmImportTab onSelectProject={handleCrmSelect} />
        ) : (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  <div className="space-y-5">
                    <div><label className="block text-xs font-bold text-slate-700 mb-1.5">Project Title *</label><input type="text" name="title" value={formData.title || ''} onChange={handleChange} required className="flat-input w-full text-xs py-2 rounded-xl" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1.5">Buyer Name</label><input type="text" name="buyerName" value={formData.buyerName || ''} onChange={handleChange} className="flat-input w-full text-xs py-2 rounded-xl" disabled={isSubProject && !isEditMode}/></div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Product Group</label>
                        <select name="productGroup" value={formData.productGroup || ''} onChange={handleChange} className="flat-input w-full text-xs py-2 rounded-xl">
                            <option value="">No Product Group</option>
                            {basicData.map(group => <option key={group.id} value={group.name}>{group.name}</option>)}
                        </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Project Identification Color</label>
                      <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        {PROJECT_COLORS.map(c => (
                          <button key={c.value} type="button" onClick={() => setSelectedColor(c.value)} className={`w-7 h-7 rounded-full transition-all ${selectedColor === c.value ? 'ring-4 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'}`} style={{ backgroundColor: c.value }} title={c.name} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div><label className="block text-xs font-bold text-slate-700 mb-1.5">CRM Code</label><input type="text" name="crmCode" value={formData.crmCode || ''} onChange={handleChange} required={!isSubProject} className="flat-input w-full text-xs py-2 rounded-xl" disabled={isSubProject && !isEditMode}/></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1.5">Project Manager</label><select name="projectManagerId" value={formData.projectManagerId || ''} onChange={handleChange} className="flat-input w-full text-xs py-2 rounded-xl">{users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}</select></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1.5">Specialist (Assignee)</label><select name="projectAssigneeId" value={formData.projectAssigneeId || ''} onChange={handleChange} className="flat-input w-full text-xs py-2 rounded-xl"><option value="">Unassigned</option>{users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}</select></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1.5">Status *</label><select name="status" value={formData.status || ''} onChange={handleChange} required className="flat-input w-full text-xs py-2 rounded-xl"><option value="Planned">Planned</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option><option value="Suspended">Suspended</option></select></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-slate-700 mb-1.5">Credit</label><input type="text" name="credit" value={formData.credit || ''} onChange={handleChange} className="flat-input w-full text-xs py-2 rounded-xl" /></div>
                        <div><label className="block text-xs font-bold text-slate-700 mb-1.5">Committed Hours</label><input type="number" name="committedHours" value={formData.committedHours || ''} onChange={handleChange} className="flat-input w-full text-xs py-2 rounded-xl" /></div>
                    </div>
                  </div>

                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                    <div><label className="block text-xs font-bold text-slate-700 mb-1.5">Start Date</label><JalaliDatePickerCustom value={startDate} onChange={setStartDate} /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1.5">End Date</label><JalaliDatePickerCustom value={endDate} onChange={setEndDate} /></div>
                  </div>

                  <div className="md:col-span-2 grid grid-cols-2 gap-x-8">
                    <div><label className="block text-xs font-bold text-slate-700 mb-1.5">Project Stage</label><select name="projectStage" value={formData.projectStage || ''} onChange={handleChange} className="flat-input w-full text-xs py-2 rounded-xl"><option>Deployment</option><option>QC</option><option>QA</option><option>Handover</option></select></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1.5">Parent Project</label><Select options={projectOptions} isClearable placeholder="Search..." value={projectOptions.find(p => p.value === formData.parentProjectId)} onChange={selectedOption => handleChange({ target: { name: 'parentProjectId', value: selectedOption ? selectedOption.value : null } })} isDisabled={isSubProject} className="text-xs"/></div>
                  </div>
                </div>
                <div className="flex space-x-3 pt-6 mt-6 border-t">
                  <button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md">Save Project</button>
                  <button onClick={onClose} className="flex-1 flat-button px-6 py-3 rounded-xl font-bold text-sm">Cancel</button>
                </div>
            </>
        )}
      </div>
    </div>
  );
};

const ProjectCard = ({ project, onDelete, onAnalyzeAi }) => {
    const themeColor = project.color || '#64748b';
    return (
        <div className="block group relative" dir="ltr">
            <div className="flat-card rounded-2xl p-5 bg-white flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1" style={{ borderTop: `6px solid ${themeColor}` }}>
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                    <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAnalyzeAi(project); }} 
                        className="bg-indigo-50 text-indigo-600 rounded-full p-1.5 shadow-sm hover:bg-indigo-600 hover:text-white transition-all"
                        title="تحلیل هوشمند با AI"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </button>
                    <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(project.id); }} 
                        className="bg-red-50 text-red-500 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                        title="حذف پروژه"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <Link to={`/projects/${project.id}`} className="block flex-1">
                    <div className="flex justify-between items-start mb-3 pr-16">
                        <h3 className="font-bold text-slate-800 text-base truncate max-w-[80%]">{project.title}</h3>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: themeColor }}></div>
                            <p className="text-xs text-slate-500 font-medium">CRM Code: {project.crmCode}</p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 whitespace-nowrap">{project.status}</span>
                    </div>
                    <div className="space-y-1 mb-4">
                        <div className="flex justify-between text-xs text-slate-400 font-medium"><span>Progress</span><span>{project.progress}%</span></div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full transition-all" style={{ width: `${project.progress}%`, backgroundColor: themeColor }}></div></div>
                    </div>
                    <div className="border-t pt-3 mt-auto">
                        {project.subProjects && project.subProjects.length > 0 ? (
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sub-Projects ({project.subProjects.length}):</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {project.subProjects.slice(0, 3).map(sub => (
                                        <span key={sub.id} className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded border border-slate-200 text-[10px] font-medium">{sub.title}</span>
                                    ))}
                                    {project.subProjects.length > 3 && <span className="text-[10px] text-slate-400 font-bold">+{project.subProjects.length - 3}</span>}
                                </div>
                            </div>
                        ) : ( <p className="text-center text-[10px] text-slate-400 py-1 font-medium">No Sub-projects</p> )}
                    </div>
                </Link>
            </div>
        </div>
    );
};

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [flatProjects, setFlatProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, projectId: null });
    const [isFormSelectionModalOpen, setIsFormSelectionModalOpen] = useState(false);
    const [newlyCreatedProject, setNewlyCreatedProject] = useState(null);
    
    // AI Analysis State
    const [aiModal, setAiModal] = useState({ isOpen: false, projectId: null, projectTitle: '' });

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [treeRes, flatRes] = await Promise.all([projectService.getAll(), projectService.getAllFlat()]);
            setProjects(treeRes.data);
            setFlatProjects(flatRes.data);
        } catch (error) {
            toast.error("Error fetching projects list.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.crmCode.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [projects, searchTerm, statusFilter]);

    const handleSaveProject = async (projectData, projectId) => {
        try {
            if (projectId) {
                await projectService.update(projectId, projectData);
                toast.success("Project updated successfully.");
            } else {
                const response = await projectService.create(projectData);
                toast.success("New project created successfully.");
                if (!projectData.parentProjectId) {
                    setNewlyCreatedProject(response.data);
                    setIsFormSelectionModalOpen(true);
                }
            }
            setIsModalOpen(false);
            setEditingProject(null);
            fetchData();
        } catch (error) {
            toast.error("Operation failed.");
        }
    };

    const handleDeleteProject = async () => {
        if (!deleteModal.projectId) return;
        try {
            await projectService.delete(deleteModal.projectId);
            toast.success("Project and all sub-projects deleted.");
            fetchData();
        } catch (error) {
            toast.error("Failed to delete project.");
        } finally {
            setDeleteModal({ isOpen: false, projectId: null });
        }
    };

    const handleOpenAiAnalysis = (project) => {
        setAiModal({ isOpen: true, projectId: project.id, projectTitle: project.title });
    };

    if (loading) return <div className="p-8 font-medium text-slate-500 text-sm" dir="ltr">Loading projects portfolio...</div>;

    return (
        <div className="h-full flex flex-col overflow-hidden" dir="ltr">
            <div className="p-8 pb-4 flex-shrink-0">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Projects Portfolio</h1>
                        <p className="mt-1 text-slate-500 text-sm font-medium">Manage parent projects, enterprise WBS hierarchy, and AI-driven insights</p>
                    </div>
                    <button onClick={() => { setEditingProject(null); setIsModalOpen(true); }} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:shadow-lg transition-all flex items-center space-x-2 text-sm shadow-blue-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        <span>New Project</span>
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex-1 relative">
                        <input 
                            type="text" 
                            placeholder="Search project title or CRM code..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flat-input w-full pl-10 py-2.5 rounded-xl text-sm"
                        />
                        <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <div className="w-full md:w-64">
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="flat-input w-full py-2.5 rounded-xl text-sm font-bold text-slate-700"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Planned">Planned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Suspended">Suspended</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-12 scrollbar-flat">
                {filteredProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map(project => (
                            <ProjectCard 
                                key={project.id} 
                                project={project} 
                                onDelete={(id) => setDeleteModal({ isOpen: true, projectId: id })} 
                                onAnalyzeAi={handleOpenAiAnalysis}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flat-card rounded-2xl p-16 text-center bg-white border-2 border-dashed">
                        <h3 className="text-lg font-bold text-slate-700">No Projects Found</h3>
                        <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or search criteria.</p>
                    </div>
                )}
            </div>

            <ProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveProject} allProjects={flatProjects} project={editingProject} />
            <FormSelectionModal isOpen={isFormSelectionModalOpen} onClose={() => setIsFormSelectionModalOpen(false)} onConfirm={fetchData} projectId={newlyCreatedProject?.id} projectTitle={newlyCreatedProject?.title} crmCode={newlyCreatedProject?.crmCode} projectAssigneeId={newlyCreatedProject?.projectAssigneeId || newlyCreatedProject?.projectManagerId} />
            <ConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, projectId: null })} onConfirm={handleDeleteProject} title="Delete Project" message="Are you sure you want to delete this project and all its sub-projects?" confirmText="Delete Project" type="danger" />
            
            <AiProjectAnalysisModal 
                isOpen={aiModal.isOpen} 
                onClose={() => setAiModal({ isOpen: false, projectId: null, projectTitle: '' })} 
                projectId={aiModal.projectId} 
                projectTitle={aiModal.projectTitle} 
            />
        </div>
    );
};

export default Projects;