import axios from 'axios';

let API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;

if (window.location.hostname.includes('-5173')) {
  const backendHost = window.location.host.replace('-5173', '-5000');
  API_URL = `https://${backendHost}/api`;
}

// Clean and ensure it ends with /api
if (API_URL) {
  let cleaned = API_URL.trim();
  if (cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1);
  }
  if (!cleaned.endsWith('/api')) {
    cleaned = `${cleaned}/api`;
  }
  API_URL = cleaned;
}

const apiInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const setAuthToken = (token) => {
  if (token && token !== 'undefined' && token !== 'null') {
    localStorage.setItem('token', token);
    apiInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete apiInstance.defaults.headers.common['Authorization'];
  }
};

// Initialize authorization headers if a token already exists (e.g., page refresh)
const initialToken = getAuthToken();
if (initialToken && initialToken !== 'undefined' && initialToken !== 'null') {
  apiInstance.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}

// Request Interceptor to inject JWT token
apiInstance.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor to match custom fetch response format and error objects
apiInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMessage = error.response?.data?.error || error.message || 'API Error';
    return Promise.reject(new Error(errorMessage));
  }
);

export const api = {
  // Auth
  login: (data) => apiInstance.post('/auth/login', data),
  verifyOtp: (data) => apiInstance.post('/auth/verify-otp', data),
  register: (data) => apiInstance.post('/auth/register', data),
  forgotPassword: (data) => apiInstance.post('/auth/forgot-password', data),
  resetPassword: (data) => apiInstance.post('/auth/reset-password', data),
  getMe: () => apiInstance.get('/auth/me'),
  updateProfile: (data) => apiInstance.put('/auth/me', data),
  changePassword: (data) => apiInstance.put('/auth/change-password', data),

  // Notes
  getNotes: () => apiInstance.get('/notes'),
  createNote: (formData) => apiInstance.post('/notes', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateNote: (id, data) => apiInstance.put(`/notes/${id}`, data),
  deleteNote: (id) => apiInstance.delete(`/notes/${id}`),

  // Projects
  getProjects: () => apiInstance.get('/projects'),
  getProject: (id) => apiInstance.get(`/projects/${id}`),
  createProject: (data) => apiInstance.post('/projects', data),
  updateProject: (id, data) => apiInstance.put(`/projects/${id}`, data),
  deleteProject: (id) => apiInstance.delete(`/projects/${id}`),
  addProjectMember: (id, data) => apiInstance.post(`/projects/${id}/members`, data),

  // Columns
  getColumns: (projectId) => apiInstance.get(`/columns/project/${projectId}`),
  createColumn: (data) => apiInstance.post('/columns', data),
  updateColumn: (id, data) => apiInstance.put(`/columns/${id}`, data),
  deleteColumn: (id) => apiInstance.delete(`/columns/${id}`),
  reorderColumns: (data) => apiInstance.post('/columns/reorder', data),

  // Tasks
  getTasks: (projectId) => apiInstance.get(`/tasks/project/${projectId}`),
  createTask: (data) => apiInstance.post('/tasks', data),
  updateTask: (id, data) => apiInstance.put(`/tasks/${id}`, data),
  deleteTask: (id) => apiInstance.delete(`/tasks/${id}`),
  reorderTasks: (data) => apiInstance.post('/tasks/reorder', data),
  duplicateTask: (id) => apiInstance.post(`/tasks/${id}/duplicate`),

  // Comments
  getComments: (taskId) => apiInstance.get(`/comments/task/${taskId}`),
  createComment: (data) => apiInstance.post('/comments', data),
  updateComment: (id, data) => apiInstance.put(`/comments/${id}`, data),
  deleteComment: (id) => apiInstance.delete(`/comments/${id}`),

  // Checklists
  getChecklists: (taskId) => apiInstance.get(`/checklists/task/${taskId}`),
  createChecklist: (data) => apiInstance.post('/checklists', data),
  deleteChecklist: (id) => apiInstance.delete(`/checklists/${id}`),
  createChecklistItem: (data) => apiInstance.post('/checklists/item', data),
  toggleChecklistItem: (id, isCompleted) => apiInstance.put(`/checklists/item/${id}`, { is_completed: isCompleted }),
  deleteChecklistItem: (id) => apiInstance.delete(`/checklists/item/${id}`),

  // Labels
  getLabels: (projectId) => apiInstance.get(`/labels/project/${projectId}`),
  createLabel: (data) => apiInstance.post('/labels', data),
  assignLabel: (data) => apiInstance.post('/labels/assign', data),
  unassignLabel: (data) => apiInstance.post('/labels/unassign', data),
  deleteLabel: (id) => apiInstance.delete(`/labels/${id}`),

  // Notifications
  getNotifications: () => apiInstance.get('/notifications'),
  markNotificationRead: (id) => apiInstance.put(`/notifications/${id}/read`),
  markAllNotificationsRead: () => apiInstance.put('/notifications/read-all'),
  deleteNotification: (id) => apiInstance.delete(`/notifications/${id}`),

  // Analytics
  getStats: () => apiInstance.get('/analytics/stats'),
  getCharts: () => apiInstance.get('/analytics/charts'),

  // Reminders
  getReminders: () => apiInstance.get('/reminders'),
  createReminder: (data) => apiInstance.post('/reminders', data),
  deleteReminder: (id) => apiInstance.delete(`/reminders/${id}`),
};
