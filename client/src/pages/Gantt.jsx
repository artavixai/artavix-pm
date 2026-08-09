import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'jalali-moment';
import { Popover, Transition } from '@headlessui/react';
import JalaliDatePickerCustom from '../components/common/CustomDatePicker';
import { projectService, taskService, basicDataService } from '../services/apiService';
import toast from 'react-hot-toast';
import ProjectTreeSelector from '../components/common/ProjectTreeSelector';

const PlusIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);
const TrashIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>);
const LayersIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>);

const AddFromTemplateModal = ({ isOpen, onClose, onAdd }) => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubsystems, setSelectedSubsystems] = useState(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [startDate, setStartDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            basicDataService.getProductGroupsTree()
                .then(res => setGroups(res.data))
                .catch(err => toast.error("Error fetching master data."))
                .finally(() => setLoading(false));

            setSelectedSubsystems(new Set());
            setStartDate(moment().format('YYYY/MM/DD'));
        }
    }, [isOpen]);
    
    const handleToggleSubsystem = (id) => {
        setSelectedSubsystems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };
    
    const handleAddClick = async () => {
        if (selectedSubsystems.size === 0) {
            toast.error("At least one subsystem must be selected.");
            return;
        }
        setIsSubmitting(true);
        await onAdd(Array.from(selectedSubsystems), startDate);
        setIsSubmitting(false);
    };

    if (!isOpen) return null;
    
    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose} dir="ltr">
                <motion.div initial={{ y: "-50px", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "50px", opacity: 0 }} className="flat-card rounded-2xl p-6 w-full max-w-4xl h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <h2 className="text-2xl font-bold mb-1 text-slate-900">Add Tasks from Process Template</h2>
                    <p className="text-slate-500 mb-6 text-sm">Select one or more subsystems to add standard template tasks to the Gantt Chart.</p>
                    
                    <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <label className="block text-xs font-bold mb-2 text-slate-700">Task Start Date</label>
                        <div className="w-64">
                            <JalaliDatePickerCustom value={startDate} onChange={setStartDate} />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">New tasks will be scheduled starting from this date.</p>
                    </div>

                    {loading ? <div className="text-center p-10 text-slate-500 text-sm">Loading master data...</div> : (
                        <div className="flex-1 overflow-y-auto pr-2 scrollbar-flat">
                            <div className="space-y-6">
                                {groups.map(group => (
                                    <div key={group.id} className="border rounded-xl overflow-hidden">
                                        <div className="p-4 bg-slate-50 flex items-center" style={{ borderLeft: `4px solid ${group.color || '#cbd5e1'}`}}>
                                            <h3 className="font-bold text-slate-800 text-sm">{group.name}</h3>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
                                            {group.subsystems.map(subsystem => (
                                                 <label key={subsystem.id} className={`flex items-center p-3 rounded-lg cursor-pointer transition-all border-2 ${selectedSubsystems.has(subsystem.id) ? 'bg-blue-100 border-blue-400' : 'bg-white hover:bg-slate-50 border-transparent'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSubsystems.has(subsystem.id)}
                                                        onChange={() => handleToggleSubsystem(subsystem.id)}
                                                        className="w-4 h-4 mr-3 rounded"
                                                    />
                                                    <span className="font-medium text-slate-700 text-xs">{subsystem.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-4 pt-4 mt-4 border-t">
                        <button type="button" onClick={onClose} className="flat-button px-8 py-2.5 rounded-lg font-bold text-xs">Cancel</button>
                        <button onClick={handleAddClick} disabled={isSubmitting || loading} className="px-8 py-2.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-bold transition-colors disabled:opacity-50 text-xs">
                             {isSubmitting ? "Adding..." : `Add ${selectedSubsystems.size > 0 ? `(${selectedSubsystems.size})` : ''} Subsystems`}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const ColorPickerPopover = ({ label, color, setColor }) => {
  const colors = ['#3b82f6', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#d946ef', '#64748b', '#22c55e', '#eab308', '#ec4899', '#06b6d4', '#f59e0b'];
  return (
    <div>
      <label className="block text-xs font-bold mb-2 text-slate-600">{label}</label>
      <Popover className="relative">
        {({ open, close }) => (<>
            <Popover.Button className="w-full flex items-center justify-between flat-input py-2 px-3">
              <span className="text-slate-700 text-xs">Select Color</span>
              <div className="w-5 h-5 rounded-md border border-slate-300" style={{ backgroundColor: color }}></div>
            </Popover.Button>
            <Transition as={React.Fragment} enter="transition ease-out duration-200" enterFrom="opacity-0 translate-y-1" enterTo="opacity-100 translate-y-0" leave="transition ease-in duration-150" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-1">
              <Popover.Panel className="absolute z-30 mt-2 w-full bg-white shadow-lg rounded-xl border p-3">
                <div className="grid grid-cols-6 gap-2">{colors.map((c) => (<button key={c} type="button" onClick={() => { setColor(c); close(); }} className={`w-8 h-8 rounded-full transition-transform duration-200 ${color === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''}`} style={{ backgroundColor: c }}/>))}</div>
              </Popover.Panel>
            </Transition>
        </>)}
      </Popover>
    </div>
  );
};

const TaskModal = ({ isOpen, onClose, onSave, taskToEdit }) => {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if(formData.startDate && formData.endDate) {
        const start = moment(formData.startDate, 'YYYY/MM/DD');
        const end = moment(formData.endDate, 'YYYY/MM/DD');
        if(start.isValid() && end.isValid() && !end.isBefore(start)) {
            const duration = end.diff(start, 'days') + 1;
            setFormData(prev => {
                const newCompleted = Math.min(prev.completedUnits || 0, duration);
                return { ...prev, totalUnits: duration, completedUnits: newCompleted };
            });
        }
    }
  }, [formData.startDate, formData.endDate]);

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setFormData({ ...taskToEdit });
      } else {
        const today = moment().format('YYYY/MM/DD');
        const nextWeek = moment().add(7, 'days').format('YYYY/MM/DD');
        const duration = moment(nextWeek, 'YYYY/MM/DD').diff(moment(today, 'YYYY/MM/DD'), 'days') + 1;
        setFormData({ 
          title: '', 
          startDate: today, 
          endDate: nextWeek, 
          weight: 50, 
          totalUnits: duration, 
          completedUnits: 0,
          estimatedHours: 0,
          allocatedHours: 0,
          plannedColor: '#3b82f6', 
          executedColor: '#10b981' 
        });
      }
      setError('');
    }
  }, [taskToEdit, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCompletedUnitsChange = (e) => {
    let numValue = parseInt(e.target.value, 10) || 0;
    if (numValue < 0) numValue = 0;
    if (numValue > (formData.totalUnits || 1)) numValue = (formData.totalUnits || 1);
    setFormData(prev => ({ ...prev, completedUnits: numValue }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) { setError('Task title cannot be empty.'); return; }
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;
  
  const progressPercentage = (formData.totalUnits || 1) > 0 ? Math.round(((formData.completedUnits || 0) / (formData.totalUnits || 1)) * 100) : 0;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 flex justify-center items-center p-4" onClick={onClose} dir="ltr">
        <motion.div initial={{ y: "-50px", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "50px", opacity: 0 }} className="flat-card rounded-2xl p-8 w-full max-w-2xl bg-white" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-xl font-bold mb-6 text-slate-900">{taskToEdit ? 'Edit Task' : 'Add New Task'}</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className="block text-xs font-bold mb-2 text-slate-600">Task Title</label><input required type="text" value={formData.title || ''} onChange={(e) => handleChange('title', e.target.value)} className="flat-input w-full text-xs py-2" placeholder="e.g. Frontend UI Design" /></div>
              <div><label className="block text-xs font-bold mb-2 text-slate-600">Weight (%)</label><input type="number" min="0" max="100" value={formData.weight || ''} onChange={(e) => handleChange('weight', parseInt(e.target.value, 10))} className="flat-input w-full text-xs py-2" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className="block text-xs font-bold mb-2 text-slate-600">Start Date</label><JalaliDatePickerCustom value={formData.startDate} onChange={(val) => handleChange('startDate', val)} /></div>
              <div><label className="block text-xs font-bold mb-2 text-slate-600">End Date</label><JalaliDatePickerCustom value={formData.endDate} onChange={(val) => handleChange('endDate', val)} /></div>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-700">Task Progress (Sessions/Units)</label>
                    <span className="text-xs font-black text-blue-600">{progressPercentage}%</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-[11px] font-semibold text-slate-500">Completed Sessions</label>
                        <input type="number" value={formData.completedUnits ?? 0} onChange={handleCompletedUnitsChange} className="flat-input w-full text-center mt-1 text-xs py-1.5" />
                     </div>
                     <div>
                        <label className="text-[11px] font-semibold text-slate-500">Total Sessions (Days)</label>
                        <input type="number" readOnly value={formData.totalUnits || 1} className="flat-input w-full text-center mt-1 bg-slate-100 text-slate-500 text-xs py-1.5" />
                     </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-2 text-slate-600">Estimated Hours</label>
                <input type="number" step="0.5" min="0" value={formData.estimatedHours ?? 0} onChange={(e) => handleChange('estimatedHours', parseFloat(e.target.value) || 0)} className="flat-input w-full text-xs py-2" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-2 text-slate-600">Allocated Hours</label>
                <input type="number" step="0.5" min="0" value={formData.allocatedHours ?? 0} onChange={(e) => handleChange('allocatedHours', parseFloat(e.target.value) || 0)} className="flat-input w-full text-xs py-2" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ColorPickerPopover label="Planned Color" color={formData.plannedColor || '#3b82f6'} setColor={(val) => handleChange('plannedColor', val)} />
              <ColorPickerPopover label="Executed Color" color={formData.executedColor || '#10b981'} setColor={(val) => handleChange('executedColor', val)} />
            </div>

            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
            <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="flat-button px-6 py-2 rounded-lg font-bold text-xs">Cancel</button><button type="submit" className="px-6 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-bold transition-colors text-xs"> {taskToEdit ? 'Save Changes' : 'Create Task'}</button></div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const CELL_WIDTH = 40;
const CELL_HEIGHT = 50;
const HEADER_HEIGHT = 60;
const WEEKDAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const ENGLISH_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const TaskBar = ({ task, rowIndex, onUpdate, dateToDayIndex, onDoubleClick }) => {
    const [isInteracting, setIsInteracting] = useState(null);

    const handleMouseDown = (e, action) => {
        e.preventDefault();
        
        const startX = e.clientX;
        const initialStartDate = moment(task.startDate, 'YYYY/MM/DD');
        const initialEndDate = moment(task.endDate, 'YYYY/MM/DD');
        const initialCompletedUnits = task.completedUnits || 0;
        const totalUnits = task.durationInDays || 1;

        setIsInteracting(action);

        const handleMouseMove = (moveEvent) => {
            const currentX = moveEvent.clientX;
            const deltaX = currentX - startX; 
            
            let updates = {};

            switch (action) {
                case 'drag': {
                    const movedDays = Math.round(deltaX / CELL_WIDTH);
                    updates = {
                        startDate: initialStartDate.clone().add(movedDays, 'days').format('YYYY/MM/DD'),
                        endDate: initialEndDate.clone().add(movedDays, 'days').format('YYYY/MM/DD'),
                    };
                    break;
                }
                case 'resize_end': {
                    const movedDays = Math.round(deltaX / CELL_WIDTH);
                    let newEndDate = initialEndDate.clone().add(movedDays, 'days');
                    if (newEndDate.isBefore(initialStartDate)) newEndDate = initialStartDate.clone();
                    updates = { endDate: newEndDate.format('YYYY/MM/DD') };
                    break;
                }
                case 'resize_start': {
                    const movedDays = Math.round(deltaX / CELL_WIDTH);
                    let newStartDate = initialStartDate.clone().add(movedDays, 'days');
                    if (newStartDate.isAfter(initialEndDate)) newStartDate = initialEndDate.clone();
                    updates = { startDate: newStartDate.format('YYYY/MM/DD') };
                    break;
                }
                case 'progress': {
                    const taskWidth = totalUnits * CELL_WIDTH;
                    if (taskWidth > 0) {
                        const newProgressWidth = ((initialCompletedUnits / totalUnits) * taskWidth) + deltaX;
                        const newCompletedRatio = Math.max(0, Math.min(1, newProgressWidth / taskWidth));
                        updates = { completedUnits: newCompletedRatio * totalUnits };
                    }
                    break;
                }
                default: break;
            }

            onUpdate(task.id, updates, false);
        };

        const handleMouseUp = (upEvent) => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            setIsInteracting(null);
            
            const finalDeltaX = upEvent.clientX - startX;
            
            if (action === 'progress') {
                const taskWidth = totalUnits * CELL_WIDTH;
                if (taskWidth > 0) {
                    const newProgressWidth = ((initialCompletedUnits / totalUnits) * taskWidth) + finalDeltaX;
                    const newCompletedUnitsFinal = Math.round(Math.max(0, Math.min(totalUnits, (newProgressWidth / CELL_WIDTH))));
                    onUpdate(task.id, { completedUnits: newCompletedUnitsFinal }, true);
                    return;
                }
            }

            onUpdate(task.id, {}, true);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <motion.div
            layout
            style={{
                gridRowStart: rowIndex,
                gridColumn: `${dateToDayIndex(task.startDate)} / span ${task.durationInDays}`,
            }}
            className="flex items-center h-full p-1 group z-10"
            transition={{ type: 'spring', stiffness: 600, damping: 30 }}
        >
            <div
                onMouseDown={(e) => isInteracting ? null : handleMouseDown(e, 'drag')}
                onDoubleClick={() => onDoubleClick(task)}
                className={`relative w-full h-[60%] rounded-md flex items-center justify-center px-2 text-xs font-bold text-white select-none transition-shadow hover:shadow-lg ${isInteracting === 'drag' ? 'cursor-grabbing opacity-75 shadow-xl scale-105' : 'cursor-grab'}`}
                style={{ backgroundColor: task.plannedColor }}
            >
                <motion.div 
                    className="absolute top-0 left-0 bottom-0 h-full rounded-l-md pointer-events-none" 
                    style={{ backgroundColor: task.executedColor }}
                    initial={false}
                    animate={{ width: `${task.progress || 0}%` }}
                    transition={{ duration: 0.1, ease: "linear" }}
                />
                
                <motion.div
                    onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'progress'); }}
                    className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow border-2 border-slate-700 cursor-ew-resize z-20 transition-opacity ${isInteracting ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    style={{ left: `calc(${task.progress || 0}% - 6px)`}}
                    whileHover={{ scale: 1.5 }}
                    initial={false}
                    animate={{ left: `calc(${task.progress || 0}% - 6px)`}}
                    transition={{ duration: 0.1, ease: "linear" }}
                />

                <span className="relative truncate">{`${task.title} (${Math.round(task.completedUnits || 0)}/${task.totalUnits || 0})`}</span>

                {(!isInteracting || isInteracting === 'resize_start' || isInteracting === 'resize_end') && (
                    <>
                        <div onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'resize_start'); }} className="absolute top-0 bottom-0 left-0 w-3 cursor-ew-resize z-10" />
                        <div onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'resize_end'); }} className="absolute top-0 bottom-0 right-0 w-3 cursor-ew-resize z-10" />
                    </>
                )}
            </div>
        </motion.div>
    );
};

const GanttPage = () => {
    const [tasks, setTasks] = useState([]);
    const gridRef = useRef(null);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState(null);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [isProjectTreeOpen, setIsProjectTreeOpen] = useState(false);

    const fetchTasks = useCallback(async (projectId) => {
        if (!projectId) return;
        setLoadingTasks(true);
        try {
            const res = await taskService.getGanttTasksForProject(projectId);
            setTasks(res.data);
        } catch (err) { toast.error("Error fetching Gantt chart tasks."); setTasks([]); } 
        finally { setLoadingTasks(false); }
    }, []);

    useEffect(() => {
        projectService.getAllFlat().then(res => {
            const projectOptions = res.data.map(p => ({ value: p.id, label: p.title }));
            setProjects(projectOptions);
            if (projectOptions.length > 0) setSelectedProject(projectOptions[0]);
        }).catch(err => console.error("Failed to fetch projects:", err));
    }, []);

    useEffect(() => { 
        if (selectedProject) fetchTasks(selectedProject.value);
    }, [selectedProject, fetchTasks]);

    const { days, months, viewStartDate } = useMemo(() => {
        const viewStartDate = moment().startOf('month').startOf('day');
        const endView = viewStartDate.clone().add(12, 'months').endOf('month');
        const dayArray = [];
        const monthArray = [];
        let currentMonth = viewStartDate.clone();
        while (currentMonth.isBefore(endView)) {
            const daysInMonth = currentMonth.daysInMonth();
            monthArray.push({ name: `${ENGLISH_MONTHS[currentMonth.month()]} ${currentMonth.year()}`, days: daysInMonth });
            for (let i = 1; i <= daysInMonth; i++) { dayArray.push(currentMonth.clone().date(i)); }
            currentMonth.add(1, 'month');
        }
        return { days: dayArray, months: monthArray, viewStartDate };
    }, []);

    const dateToDayIndex = useCallback((dateStr) => {
        if (!dateStr) return 1;
        const taskDate = moment(dateStr, 'YYYY/MM/DD').startOf('day');
        if (!taskDate.isValid()) return 1;
        const daysDiff = taskDate.diff(viewStartDate, 'days');
        return daysDiff + 1;
    }, [viewStartDate]);
    
    const handleSaveTask = async (taskData) => {
        try {
            const projectId = selectedProject.value;
            const { progress, ...payload } = taskData;
            
            if (payload.id) {
                await taskService.updateGanttTask(projectId, payload.id, payload);
                toast.success("Task updated successfully.");
            } else {
                await taskService.createGanttTask(projectId, payload);
                toast.success("New task created successfully.");
            }
            fetchTasks(projectId);
            setIsTaskModalOpen(false);
        } catch (err) {
            toast.error("Error saving task.");
            console.error(err);
        }
    };
    
    const handleAddFromTemplates = async (subsystemIds, startDate) => {
        if (!selectedProject) {
            toast.error("Please select a project first.");
            return;
        }
        try {
            const response = await taskService.addGanttTasksFromTemplates(selectedProject.value, subsystemIds, startDate);
            setTasks(response.data);
            toast.success(`${subsystemIds.length} subsystems added successfully.`);
            setIsTemplateModalOpen(false);
        } catch (err) {
            toast.error("Error adding tasks from template.");
            console.error(err);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!selectedProject) { toast.error("Please select a project first."); return; }
        try {
            await taskService.deleteGanttTask(selectedProject.value, taskId);
            toast.success("Task deleted.");
            fetchTasks(selectedProject.value);
        } catch (err) {
            toast.error("Error deleting task.");
            console.error(err);
        }
    };
    
    const { groupedTasks, totalRows } = useMemo(() => {
        if (!tasks || !Array.isArray(tasks)) { 
            return { groupedTasks: [], totalRows: 0 };
        }
        const groups = {};
        tasks.forEach(task => {
            const groupName = task.subsystemName || 'General Tasks';
            if (!groups[groupName]) {
                groups[groupName] = { name: groupName, color: task.plannedColor, productGroupName: task.productGroupName || '', tasks: [] };
            }
            
            const start = moment(task.startDate, 'YYYY/MM/DD');
            const end = moment(task.endDate, 'YYYY/MM/DD');
            const duration = end.isValid() && start.isValid() && !end.isBefore(start) ? end.diff(start, 'days') + 1 : 1;
            groups[groupName].tasks.push({ ...task, durationInDays: duration });
        });
        
        const sortedGroups = Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
        
        let rowIndexCounter = 1;
        const flatList = [];
        sortedGroups.forEach(group => {
            flatList.push({ type: 'group', id: `group-${group.name}`, ...group, rowIndex: rowIndexCounter });
            rowIndexCounter++;
            group.tasks.forEach(task => {
                flatList.push({ type: 'task', ...task, rowIndex: rowIndexCounter });
                rowIndexCounter++;
            });
        });

        return { groupedTasks: flatList, totalRows: flatList.length };

    }, [tasks]);
    
    const handleDoubleClickOnTask = useCallback((task) => {
        const taskToEdit = tasks.find(t => t.id === task.id);
        setTaskToEdit(taskToEdit);
        setIsTaskModalOpen(true);
    }, [tasks]);

    const handleOptimisticTaskUpdate = (taskId, updates, saveToServer = true) => {
        let originalTasks;
        setTasks(prevTasks => {
            originalTasks = [...prevTasks]; 
            const newTasks = prevTasks.map(t => {
                if (t.id.toString() === taskId.toString()) {
                    let updatedTask = { ...t, ...updates };
                    
                    if (updates.startDate || updates.endDate) {
                        const start = moment(updatedTask.startDate, 'YYYY/MM/DD');
                        const end = moment(updatedTask.endDate, 'YYYY/MM/DD');
                        if (start.isValid() && end.isValid() && !end.isBefore(start)) {
                            const duration = end.diff(start, 'days') + 1;
                            if (!updatedTask.totalUnits || updatedTask.totalUnits === t.durationInDays) {
                               updatedTask.totalUnits = duration;
                            }
                            updatedTask.completedUnits = Math.min(updatedTask.completedUnits || 0, updatedTask.totalUnits);
                        }
                    }
                    
                    if (updates.hasOwnProperty('completedUnits')) {
                         const newProgress = (updatedTask.totalUnits || 1) > 0 
                            ? Math.round(((updatedTask.completedUnits || 0) / updatedTask.totalUnits) * 100) 
                            : 0;
                        updatedTask.progress = newProgress;
                    }
                    
                    return updatedTask;
                }
                return t;
            });

            if (saveToServer) {
                if (window.ganttSaveTimeout) clearTimeout(window.ganttSaveTimeout);
                window.ganttSaveTimeout = setTimeout(async () => {
                    try {
                        const taskToSave = newTasks.find(t => t.id.toString() === taskId.toString());
                        if (!selectedProject) throw new Error("No project selected");
                        const { progress, ...payload } = taskToSave;
                        await taskService.updateGanttTask(selectedProject.value, taskId, payload);
                        toast.success("Task updated.", { id: `task-update-${taskId}`, duration: 2000 });
                    } catch (err) {
                        toast.error("Error updating task. Rolling back...");
                        console.error("Gantt update failed:", err);
                        setTasks(originalTasks); 
                    }
                }, 800);
            }
            return newTasks;
        });
    };

    const handleProjectSelect = (project) => {
        setSelectedProject({ value: project.id, label: project.title });
        setIsProjectTreeOpen(false);
        fetchTasks(project.id);
    };

    return (
        <div className="p-6 bg-white flat-card rounded-xl shadow-lg h-full flex flex-col" dir="ltr">
            <h1 className="text-2xl font-black text-slate-800 mb-6">Project Gantt Chart</h1>
            <div className="flex justify-between items-center mb-6 z-20">
                <div className="flex items-center space-x-4">
                    <label className="text-slate-600 font-bold text-xs">Select Project:</label>
                    <button onClick={() => setIsProjectTreeOpen(true)} className="px-4 py-2 bg-white border border-slate-300 rounded-xl shadow-sm hover:bg-slate-50 flex items-center gap-2 min-w-[220px] justify-between text-xs font-bold text-slate-800">
                        <span>{selectedProject ? selectedProject.label : 'Select Project'}</span>
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsTemplateModalOpen(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center font-bold text-xs shadow-md shadow-emerald-100">
                        <LayersIcon className="w-4 h-4 mr-2" />
                        Add from Template
                    </button>
                    <button onClick={() => { setTaskToEdit(null); setIsTaskModalOpen(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center font-bold text-xs shadow-md shadow-blue-100">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Add Manual Task
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-auto border rounded-2xl bg-slate-50/50">
                <div className="flex h-full">
                    <div className="sticky left-0 w-80 bg-white border-r shadow-md z-10 flex flex-col">
                        <div className="flex items-center justify-between p-3 border-b" style={{ height: HEADER_HEIGHT }}>
                            <h3 className="text-xs font-bold text-slate-700">Task Title / Dates</h3>
                        </div>
                        <div className="overflow-y-auto" style={{ height: `calc(100% - ${HEADER_HEIGHT}px)` }}>
                            {loadingTasks ? <div className="p-4 text-center text-slate-400 text-xs">Loading tasks...</div>
                             : totalRows === 0 ? <div className="p-4 text-center text-slate-400 text-xs">No tasks available for this project.</div>
                             : groupedTasks.map((item) => {
                                 if (item.type === 'group') {
                                     return (
                                        <div key={item.id} className="flex items-center font-bold text-slate-800 bg-slate-100 p-2 border-b h-[50px] sticky top-0 text-xs" style={{borderLeft: `4px solid ${item.color}`}}>
                                           {item.name}
                                        </div>
                                     )
                                 }
                                 return (
                                    <div key={item.id} onDoubleClick={() => handleDoubleClickOnTask(item)} className="flex items-center justify-between border-b p-2 pl-4 cursor-pointer h-[50px] text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors">
                                        <span className="truncate">{item.title}</span>
                                        <button className="text-red-400 hover:text-red-600 p-1 opacity-0 hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleDeleteTask(item.id); }}><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                 )
                             })
                            }
                        </div>
                    </div>
                    <div className="overflow-x-scroll flex-1 relative" ref={gridRef}>
                        <div className="sticky top-0 z-10 bg-white shadow-sm border-b" style={{ height: HEADER_HEIGHT }}>
                            <div className="flex" style={{ width: days.length * CELL_WIDTH }}>
                                {months.map((month) => (<div key={month.name} className="border-r border-b text-center p-1 text-xs font-bold text-slate-700 bg-slate-100" style={{ width: month.days * CELL_WIDTH }}>{month.name}</div>))}
                            </div>
                            <div className="flex absolute bottom-0 left-0" style={{ width: days.length * CELL_WIDTH }}>
                                {days.map((dayMoment, index) => {
                                    const dayNumber = dayMoment.date();
                                    const dayOfWeekIndex = dayMoment.day();
                                    const dayOfWeek = WEEKDAYS_SHORT[dayOfWeekIndex];
                                    const isWeekend = dayOfWeekIndex === 0 || dayOfWeekIndex === 6;
                                    const isToday = dayMoment.isSame(moment(), 'day');
                                    return (
                                        <div key={index} className={`flex flex-col justify-center items-center text-[10px] border-r border-b ${isWeekend ? 'bg-amber-50/40' : 'bg-white'} ${isToday ? 'ring-2 ring-blue-500 z-10' : ''}`} style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH }}>
                                            <span className={`font-bold ${isToday ? 'text-blue-600' : 'text-slate-800'}`}>{dayNumber}</span>
                                            <span className={`text-slate-400 ${isWeekend ? 'text-amber-600' : ''}`}>{dayOfWeek}</span>
                                        </div>);
                                })}
                            </div>
                        </div>
                        
                        <div className="relative grid" style={{ gridTemplateColumns: `repeat(${days.length}, ${CELL_WIDTH}px)`, gridTemplateRows: `repeat(${totalRows || 1}, ${CELL_HEIGHT}px)` }}>
                            {days.map((dayMoment, index) => {
                                const dayOfWeekIndex = dayMoment.day();
                                const isWeekend = dayOfWeekIndex === 0 || dayOfWeekIndex === 6;
                                return (
                                <div key={`col-line-${index}`} className={`border-r ${isWeekend ? 'bg-amber-50/20' : ''}`} style={{ gridColumn: index + 1, gridRow: `1 / span ${totalRows || 1}` }} />
                                );
                            })}
                            {groupedTasks.map((item) => (
                                <div key={item.id} className={`border-b ${item.type === 'group' ? 'bg-slate-100' : ''}`} style={{ gridRow: item.rowIndex, gridColumn: `1 / span ${days.length}` }} />
                            ))}

                            {groupedTasks.map((item) => {
                                if (item.type === 'task') {
                                    return (
                                        <TaskBar 
                                            key={item.id} 
                                            task={item} 
                                            rowIndex={item.rowIndex}
                                            onUpdate={handleOptimisticTaskUpdate}
                                            onDoubleClick={handleDoubleClickOnTask}
                                            dateToDayIndex={dateToDayIndex}
                                        />
                                    )
                                }
                                return null;
                            })}
                        </div>
                    </div>
                </div>
            </div>
            <TaskModal 
                isOpen={isTaskModalOpen} 
                onClose={() => {setIsTaskModalOpen(false); setTaskToEdit(null);}} 
                onSave={handleSaveTask} 
                taskToEdit={taskToEdit} 
            />
            <AddFromTemplateModal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                onAdd={handleAddFromTemplates}
            />
            <ProjectTreeSelector 
                isOpen={isProjectTreeOpen} 
                onClose={() => setIsProjectTreeOpen(false)} 
                onSelect={handleProjectSelect} 
                currentProjectId={selectedProject?.value} 
            />
        </div>
    );
};

export default GanttPage;