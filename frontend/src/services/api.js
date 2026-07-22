import axios from 'axios';
import { store } from '../store/store';
import { logout, setDeactivated } from '../store/authSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const message = error.response?.data?.message || '';

      if (message.includes('deactivated')) {
        store.dispatch(setDeactivated());
      } else {
        store.dispatch(logout());
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  registerClient: (name, email, password, clientCode) =>
    api.post('/auth/register-client', { name, email, password, clientCode }),
  registerFinance: (name, email, password, confirmPassword) =>
    api.post('/auth/register-finance', { name, email, password, confirmPassword }),
  registerAdmin: (name, email, password, confirmPassword, adminSecret) =>
    api.post('/auth/register-admin', { name, email, password, confirmPassword, adminSecret }),
  getMe: () =>
    api.get('/auth/me'),
};

export const dashboardAPI = {
  getAdminDashboard: () => api.get('/dashboard/admin'),
  getAdminStatusDistribution: () => api.get('/dashboard/admin/status-distribution'),
  getAdminRecentActivity: (params) => api.get('/dashboard/admin/recent-activity', { params }),
  getAdminTopClients: (params) => api.get('/dashboard/admin/top-clients', { params }),
  getAdminFinancePerformance: () => api.get('/dashboard/admin/finance-performance'),
  getFinanceDashboard: () => api.get('/dashboard/finance'),
  getFinanceMyClients: () => api.get('/dashboard/finance/my-clients'),
  getFinanceWorkQueue: () => api.get('/dashboard/finance/work-queue'),
  getClientDashboard: () => api.get('/dashboard/client'),
  getClientInvoices: (params) => api.get('/dashboard/client/invoices', { params }),
};

export const clientAPI = {
  getClients: (params) => api.get('/clients', { params }),
  createClient: (data) => api.post('/clients', data),
  updateClient: (id, data) => api.put(`/clients/${id}`, data),
  deleteClient: (id) => api.delete(`/clients/${id}`),
};

export const invoiceAPI = {
  getInvoices: (params) => api.get('/invoices', { params }),
  getInvoice: (id) => api.get(`/invoices/${id}`),
  getInvoiceHistory: (id) => api.get(`/invoices/${id}/history`),
  createInvoice: (data) => api.post('/invoices', data),
  updateInvoice: (id, data) => api.put(`/invoices/${id}`, data),
  updateInvoiceStatus: (id, data) => api.put(`/invoices/${id}/status`, data),
  uploadPDF: (id, formData) => api.post(`/invoices/${id}/upload-pdf`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  downloadPDF: (id) => api.get(`/invoices/${id}/download-pdf`),
  viewPDF: (id) => api.get(`/invoices/${id}/view-pdf`),
  uploadReceipt: (id, formData) => api.post(`/invoices/${id}/upload-receipt`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteReceipt: (id) => api.delete(`/invoices/${id}/receipt`),
};

export const remarkAPI = {
  getRemarks: (invoiceId) => api.get(`/remarks/${invoiceId}`),
  addRemark: (invoiceId, message) => api.post(`/remarks/${invoiceId}`, { message }),
};

export const userAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  resetPassword: (id, password) => api.put(`/users/${id}/reset-password`, { password }),
  deleteUser: (id) => api.delete(`/users/${id}`),
  approveUser: (userId, clientId) =>
    api.put(`/users/${userId}/approve`, { clientId }),
  rejectUser: (userId) =>
    api.put(`/users/${userId}/reject`),
  reactivateUser: (id) => api.put(`/users/${id}/reactivate`),
};