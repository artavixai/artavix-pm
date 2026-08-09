import React, { useState } from 'react';

const NewTaskModal = ({ isOpen, onClose, onAddTask }) => {
  const [taskText, setTaskText] = useState('');
  const [dueDate, setDueDate] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!taskText.trim()) {
      alert('Please enter task title.');
      return;
    }
    const newTask = {
      id: Date.now(),
      text: taskText,
      dueDate: dueDate || 'No Due Date',
      completed: false,
    };
    onAddTask(newTask);
    handleClose();
  };

  const handleClose = () => {
    setTaskText('');
    setDueDate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 modal-backdrop" dir="ltr">
      <div className="flat-card rounded-2xl p-8 max-w-md w-full bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800">New Task</h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Task Title</label>
            <input
              type="text"
              required
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              className="flat-input w-full px-4 py-3 rounded-xl text-sm"
              placeholder="Enter task title"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description / Due Date</label>
            <input
              type="text"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="flat-input w-full px-4 py-3 rounded-xl text-sm"
              placeholder="e.g. Due: Tomorrow - High priority"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button type="submit" className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all text-sm">
              Create Task
            </button>
            <button type="button" onClick={handleClose} className="flex-1 flat-button px-6 py-3 rounded-xl font-bold text-sm">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTaskModal;