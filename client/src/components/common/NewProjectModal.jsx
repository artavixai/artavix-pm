import React, { useState } from 'react';

const NewProjectModal = ({ isOpen, onClose, onAddProject }) => {
  const [formData, setFormData] = useState({
    title: '',
    crmCode: '',
    description: '',
    status: 'Planned',
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.crmCode.trim()) {
      alert('Please enter both Project Title and CRM Code.');
      return;
    }

    const newProject = {
      id: Date.now(),
      ...formData,
      progress: 0,
      dueDate: 'TBD',
      statusColor: formData.status === 'In Progress' ? 'blue' : 'yellow', 
    };

    onAddProject(newProject);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      crmCode: '',
      description: '',
      status: 'Planned',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 modal-backdrop" dir="ltr">
      <div className="flat-card rounded-2xl p-8 max-w-lg w-full bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800">Create New Project</h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Project Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="flat-input w-full px-4 py-3 rounded-xl text-sm"
                placeholder="e.g. Financial Master"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">CRM Code</label>
              <input
                type="text"
                name="crmCode"
                value={formData.crmCode}
                onChange={handleChange}
                required
                className="flat-input w-full px-4 py-3 rounded-xl text-sm"
                placeholder="e.g. CRM-1024"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Project Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="flat-input w-full px-4 py-3 rounded-xl text-sm resize-none"
              placeholder="Brief description of the project..."
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Initial Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="flat-input w-full px-4 py-3 rounded-xl text-sm"
            >
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all text-sm">
              Create Project
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

export default NewProjectModal;