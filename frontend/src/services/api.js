import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  enable2FA: () => api.post('/auth/2fa/enable'),
  verify2FA: (code) => api.post('/auth/2fa/verify', { code }),
  disable2FA: (password) => api.post('/auth/2fa/disable', { password }),
};

// Users endpoints
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getStatistics: (id) => api.get(`/users/${id}/statistics`),
};

// Memberships endpoints
export const membershipsAPI = {
  getAll: (params) => api.get('/memberships', { params }),
  getById: (id) => api.get(`/memberships/${id}`),
  getMyCurrent: () => api.get('/memberships/my/current'),
  approve: (id, data) => api.post(`/memberships/${id}/approve`, data),
  reject: (id, reason) => api.post(`/memberships/${id}/reject`, { reason }),
  renew: (id) => api.post(`/memberships/${id}/renew`),
  update: (id, data) => api.put(`/memberships/${id}`, data),
  addLinkedMember: (id, data) => api.post(`/memberships/${id}/linked-members`, data),
  removeLinkedMember: (id, linkedId) => api.delete(`/memberships/${id}/linked-members/${linkedId}`),
  getExpiring: (days) => api.get('/memberships/reports/expiring', { params: { days } }),
};

// Membership Types endpoints
export const membershipTypesAPI = {
  getAll: (params) => api.get('/membership-types', { params }),
  getById: (id) => api.get(`/membership-types/${id}`),
  create: (data) => api.post('/membership-types', data),
  update: (id, data) => api.put(`/membership-types/${id}`, data),
  delete: (id) => api.delete(`/membership-types/${id}`),
  addCustomField: (id, data) => api.post(`/membership-types/${id}/custom-fields`, data),
  deleteCustomField: (id, fieldId) => api.delete(`/membership-types/${id}/custom-fields/${fieldId}`),
};

// Committees endpoints
export const committeesAPI = {
  getAll: (params) => api.get('/committees', { params }),
  getById: (id) => api.get(`/committees/${id}`),
  create: (data) => api.post('/committees', data),
  update: (id, data) => api.put(`/committees/${id}`, data),
  addPosition: (id, data) => api.post(`/committees/${id}/positions`, data),
  updatePosition: (id, positionId, data) => api.put(`/committees/${id}/positions/${positionId}`, data),
  addMember: (id, data) => api.post(`/committees/${id}/members`, data),
  removeMember: (id, memberId) => api.delete(`/committees/${id}/members/${memberId}`),
};

// Email Templates endpoints
export const emailTemplatesAPI = {
  getAll: () => api.get('/email-templates'),
  getById: (id) => api.get(`/email-templates/${id}`),
  create: (data) => api.post('/email-templates', data),
  update: (id, data) => api.put(`/email-templates/${id}`, data),
  delete: (id) => api.delete(`/email-templates/${id}`),
};

// Email Campaigns endpoints
export const emailCampaignsAPI = {
  getAll: () => api.get('/email-campaigns'),
  create: (data) => api.post('/email-campaigns', data),
  send: (id, data) => api.post(`/email-campaigns/${id}/send`, data),
};

// Documents endpoints
export const documentsAPI = {
  getAll: () => api.get('/documents'),
  upload: (formData) => api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  download: (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
};

// Events endpoints
export const eventsAPI = {
  getAll: () => api.get('/events'),
  create: (data) => api.post('/events', data),
  register: (id) => api.post(`/events/${id}/register`),
};

// Forum endpoints
export const forumAPI = {
  getCategories: () => api.get('/forum/categories'),
  getTopics: (params) => api.get('/forum/topics', { params }),
  createTopic: (data) => api.post('/forum/topics', data),
  createReply: (topicId, data) => api.post(`/forum/topics/${topicId}/replies`, data),
};

// Organization endpoints
export const organizationAPI = {
  get: () => api.get('/organization'),
  update: (data) => api.put('/organization', data),
  uploadLogo: (formData) => api.post('/organization/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getStatistics: () => api.get('/organization/statistics'),
};

// Analytics endpoints
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getMembershipReport: () => api.get('/analytics/reports/memberships'),
};

// Feature Flags endpoints
export const featureFlagsAPI = {
  getAll: () => api.get('/feature-flags'),
  update: (featureName, data) => api.put(`/feature-flags/${featureName}`, data),
};

// Notifications endpoints
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
};

export default api;