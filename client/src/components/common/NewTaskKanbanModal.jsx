import React, { useState, useEffect } from 'react';
import { userService, projectService } from '../../services/apiService';
import moment from 'moment';
import CustomDatePicker from './CustomDatePicker';

const NewTaskKanbanModal = ({ isOpen, onClose, onSaveTask, taskToEdit, projectId, defaultChecklistStepId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [checklistStepId, setChecklistStepId] = useState('');
  const [checklistSteps, setChecklistSteps] = useState([]);
  
  const [users, setUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!taskToEdit;

  useEffect(() => {
    if (isOpen) {
      userService.getAll()
        .then(response => setUsers(response.data))
        .catch(error => console.error("Failed to fetch users:", error));

      if (projectId) {
        projectService.getChecklistSteps(projectId)
          .then(response => setChecklistSteps(response.data))
          .catch(error => console.error("Failed to fetch checklist steps:", error));
      }

      if (isEditMode) {
        setTitle(taskToEdit.title || '');
        setDescription(taskToEdit.description || '');
        setPriority(taskToEdit.priority || 'Medium');
        setAssigneeId(taskToEdit.assigneeId || '');
        setDueDate(taskToEdit.dueDate ? moment(taskToEdit.dueDate).format('YYYY/MM/DD') : '');
        const stepId = taskToEdit.checklistStepId;
        setChecklistStepId(stepId ? String(stepId) : '');
      } else {
        setTitle('');
        setDescription('');
        setPriority('Medium');
        setAssigneeId('');
        setDueDate('');
        setChecklistStepId(defaultChecklistStepId ? String(defaultChecklistStepId) : '');
      }
    }
  }, [isOpen, taskToEdit, isEditMode, projectId, defaultChecklistStepId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a task title.');
      return;
    }
    
    let dueDateISO = null;
    if (dueDate) {
      const m = moment(dueDate, 'YYYY/MM/DD');
      if (m.isValid()) {
        dueDateISO = m.toISOString();
      }
    }

    let finalChecklistStepId = null;
    if (checklistStepId && checklistStepId !== '') {
      const parsed = parseInt(checklistStepId, 10);
      if (!isNaN(parsed) && parsed > 0) {
        finalChecklistStepId = parsed;
      }
    }

    const taskData = {
      title,
      description,
      priority,
      assigneeId: assigneeId ? parseInt(assigneeId, 10) : null,
      dueDate: dueDateISO,
      checklistStepId: finalChecklistStepId,
    };
    
    setIsSubmitting(true);
    const success = await onSaveTask(taskData, taskToEdit?.id);
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 modal-backdrop" dir="ltr">
      <div className="flat-card rounded-2xl p-8 max-w-lg w-full bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800">
            {isEditMode ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Task Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="flat-input w-full px-4 py-3 rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="flat-input w-full px-4 py-3 rounded-xl text-sm resize-none"></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Assignee</label>
              <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="flat-input w-full px-4 py-3 rounded-xl text-sm">
                <option value="">Unassigned</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="flat-input w-full px-4 py-3 rounded-xl text-sm">
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Project Step (Optional)</label>
            <select value={checklistStepId} onChange={(e) => setChecklistStepId(e.target.value)} className="flat-input w-full px-4 py-3 rounded-xl text-sm">
              <option value="">No Step</option>
              {checklistSteps.map(step => (
                <option key={step.id} value={step.id}>{step.stepName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Due Date</label>
            <CustomDatePicker value={dueDate} onChange={setDueDate} />
          </div>
          <div className="flex space-x-3 pt-4">
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all text-sm disabled:opacity-70">
              {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Task')}
            </button>
            <button type="button" onClick={onClose} className="flex-1 flat-button px-6 py-3 rounded-xl font-bold text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTaskKanbanModal;