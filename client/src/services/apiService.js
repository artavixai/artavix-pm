import axios from 'axios';
import { API_URL } from '../config';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) { config.headers.Authorization = `Bearer ${token}`; }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Session expired or invalid token. Redirecting to login...");
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (credentials) => api.post('/Auth/login', credentials),
  register: (userData) => api.post('/Auth/register', userData),
};

export const projectService = {
  getAll: () => api.get('/Projects'),
  getById: (id) => api.get(`/Projects/${id}`),
  getAllFlat: () => api.get('/Projects/flat'),
  create: (projectData) => api.post('/Projects', projectData),
  delete: (id) => api.delete(`/Projects/${id}`),
  batchCreateSubProjects: (data) => api.post('/Projects/batch-create-subprojects', data),
  updateChecklist: (projectId, data) => api.put(`/Projects/${projectId}/checklist`, data),
  getChecklistSteps: (projectId) => api.get(`/Projects/${projectId}/checklists`),
  syncProjectSteps: (projectId) => api.post(`/Projects/${projectId}/sync-steps`),
  getAvailableFormsForProject: (projectId) => api.get(`/Projects/${projectId}/available-forms`),
  generateSubProjectsFromForms: (projectId, data) => api.post(`/Projects/${projectId}/generate-from-forms`, data),
  getDeliverableSubProjects: (projectId) => api.get(`/Projects/${projectId}/deliverables`),
  markAsDelivered: (projectId, data) => api.put(`/Projects/${projectId}/deliver`, data),
  addStepToProject: (projectId, data) => api.post(`/Projects/${projectId}/steps`, data),
};

export const taskService = {
  getForProject: (projectId) => api.get(`/projects/${projectId}/tasks`),
  createForProject: (projectId, taskData) => api.post(`/projects/${projectId}/tasks`, taskData),
  updateForProject: (projectId, taskId, taskData) => api.put(`/projects/${projectId}/tasks/${taskId}`, taskData),
  updateStatus: (projectId, taskId, status) => api.put(`/projects/${projectId}/tasks/${taskId}/status`, { status }),
  deleteForProject: (projectId, taskId) => api.delete(`/projects/${projectId}/tasks/${taskId}`),
  
  getGanttTasksForProject: (projectId) => api.get(`/projects/${projectId}/tasks/gantt`),
  createGanttTask: (projectId, taskData) => api.post(`/projects/${projectId}/tasks/gantt`, taskData),
  updateGanttTask: (projectId, taskId, taskData) => api.put(`/projects/${projectId}/tasks/gantt/${taskId}`, taskData),
  deleteGanttTask: (projectId, taskId) => api.delete(`/projects/${projectId}/tasks/gantt/${taskId}`),
  addGanttTasksFromTemplates: (projectId, subsystemIds, startDate) => 
    api.post(`/projects/${projectId}/tasks/gantt/add-from-templates`, { subsystemIds, startDate }),
  
  getMyTasks: () => api.get('/Tasks/my-tasks'),
  getAllTasks: () => api.get('/Tasks/all'),
  
  getTasksGroupedByChecklist: (projectId) => api.get(`/projects/${projectId}/tasks/grouped-by-checklist`),
  reorderTask: (taskId, direction) => api.put(`/tasks/${taskId}/reorder`, { direction }),
  
  rebuildStepTasks: (projectId, checklistStepId, sessionCount, assigneeId) => 
    api.post(`/projects/${projectId}/tasks/rebuild-step-tasks`, { checklistStepId, sessionCount, assigneeId }),
  
  syncStepTasksToGantt: (projectId, tasks) => api.post(`/projects/${projectId}/tasks/sync-from-steps`, { projectId, tasks }),
  syncSingleStepToGantt: (projectId, stepId) => api.post(`/projects/${projectId}/tasks/sync-step-to-gantt/${stepId}`),
};

export const userService = {
  getAll: () => api.get('/Users'),
  create: (formData) => api.post('/Users', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (userId, formData) => api.put(`/Users/${userId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (userId) => api.delete(`/Users/${userId}`),
  getColleagues: () => api.get('/Users/colleagues'),
  updateCapacity: (userId, data) => api.put(`/Users/${userId}/capacity`, data),
};

export const noteService = {
  getAll: () => api.get('/Notes'),
  create: (noteData) => api.post('/Notes', noteData),
  update: (id, noteData) => api.put(`/Notes/${id}`, noteData),
  delete: (id) => api.delete(`/Notes/${id}`),
};

export const roleService = {
  getAll: () => api.get('/Roles'),
};

export const dashboardService = {
  getStats: () => api.get('/Dashboard/stats'),
};

export const reportService = {
  getDashboardReport: () => api.get('/Reports/dashboard-report'),
  getProjectStatusReport: () => api.get('/Reports/project-status-report'),
  getAdvancedReport: () => api.get('/Reports/advanced-report'),
  getWeeklyWorkload: (weekStartDate) => api.get('/Reports/weekly-workload', { params: { weekStartDate } }),
};

export const basicDataService = {
  getProductGroupsTree: () => api.get('/BasicData/productgroups'),
  createProductGroup: (data) => api.post('/BasicData/productgroups', data),
  updateProductGroup: (id, data) => api.put(`/BasicData/productgroups/${id}`, data),
  deleteProductGroup: (id) => api.delete(`/BasicData/productgroups/${id}`),
  createSubsystem: (data) => api.post('/BasicData/subsystems', data),
  updateSubsystem: (id, data) => api.put(`/BasicData/subsystems/${id}`, data),
  deleteSubsystem: (id) => api.delete(`/BasicData/subsystems/${id}`),
  createTaskTemplate: (data) => api.post('/BasicData/tasktemplates', data),
  updateTaskTemplate: (id, data) => api.put(`/BasicData/tasktemplates/${id}`, data),
  deleteTaskTemplate: (id) => api.delete(`/BasicData/tasktemplates/${id}`),

  getStepTemplates: () => api.get('/BasicData/steptemplates'),
  getStepTemplatesByProductGroup: (productGroupId) => api.get(`/BasicData/steptemplates/byproductgroup/${productGroupId}`),
  createStepTemplate: (data) => api.post('/BasicData/steptemplates', data),
  updateStepTemplate: (id, data) => api.put(`/BasicData/steptemplates/${id}`, data),
  deleteStepTemplate: (id) => api.delete(`/BasicData/steptemplates/${id}`),
};

export const crmService = {
  importProjects: (endDate) => api.post('/Crm/import-projects', { endDate }),
  getRules: () => api.get('/Crm/rules'),
  addRule: (rule) => api.post('/Crm/rules', rule),
  deleteRule: (id) => api.delete(`/Crm/rules/${id}`),
  getProjectActions: (projectId) => api.get(`/Crm/project-actions/${projectId}`),
  syncProjectActions: (projectId) => api.post(`/Crm/sync-actions/${projectId}`),
  forceSync: () => api.post('/Crm/force-sync'),
};

export const weeklyPlanService = {
  getTeamSchedule: (startDate, endDate, userId = null) => 
    api.get('/UnifiedSchedule/team-schedule', { params: { startDate, endDate, userId } }),
  getSuggestions: (startDate, endDate, userId) => 
    api.get('/WeeklyPlan/suggestions', { params: { startDate, endDate, userId } }),
  createPlan: (data) => api.post('/WeeklyPlan', data),
  updatePlan: (id, data) => api.put(`/WeeklyPlan/${id}`, data),
  deletePlan: (id) => api.delete(`/WeeklyPlan/${id}`),
  moveGanttTask: (data) => api.put('/UnifiedSchedule/move-task', data),
};

export const followUpService = {
  getByProject: (projectId) => api.get(`/FollowUp/project/${projectId}`),
  create: (data) => api.post('/FollowUp', data),
  update: (id, data) => api.put(`/FollowUp/${id}`, data),
  delete: (id) => api.delete(`/FollowUp/${id}`),
};

export const hashtagRuleService = {
  getAll: () => api.get('/HashtagRules'),
  getById: (id) => api.get(`/HashtagRules/${id}`),
  create: (ruleData) => api.post('/HashtagRules', ruleData),
  update: (id, ruleData) => api.put(`/HashtagRules/${id}`, ruleData),
  delete: (id) => api.delete(`/HashtagRules/${id}`),
  toggleStatus: (id, isActive) => api.patch(`/HashtagRules/${id}/status`, { isActive }),
  getActiveRules: () => api.get('/HashtagRules/active'),
  applyRule: (ruleId, text) => api.post(`/HashtagRules/${ruleId}/apply`, { text }),
  getStatistics: () => api.get('/HashtagRules/statistics'),
};

export const userSettingService = {
  getMySetting: () => api.get('/UserSettings/my'),
  updateSetting: (data) => api.put('/UserSettings/my', data),
  getByUserId: (userId) => api.get(`/UserSettings/user/${userId}`),
};

export const systemSettingsService = {
  getAll: () => api.get('/SystemSettings'),
  update: (featureName, isEnabled) => api.put(`/SystemSettings/${featureName}`, { isEnabled }),
};

export const formTemplateService = {
  getAll: () => api.get('/FormTemplates'),
  getById: (id) => api.get(`/FormTemplates/${id}`),
  create: (data) => api.post('/FormTemplates', data),
  update: (id, data) => api.put(`/FormTemplates/${id}`, data),
  delete: (id) => api.delete(`/FormTemplates/${id}`),
};

export const reportTemplateService = {
  getAll: () => api.get('/ReportTemplates'),
  getById: (id) => api.get(`/ReportTemplates/${id}`),
  create: (data) => api.post('/ReportTemplates', data),
  update: (id, data) => api.put(`/ReportTemplates/${id}`, data),
  delete: (id) => api.delete(`/ReportTemplates/${id}`),
};

export const meetingService = {
  getAll: (params) => api.get('/Meetings', { params }),
  getById: (id) => api.get(`/Meetings/${id}`),
  create: (data) => api.post('/Meetings', data),
  update: (id, data) => api.put(`/Meetings/${id}`, data),
  delete: (id) => api.delete(`/Meetings/${id}`),
};

export default api;