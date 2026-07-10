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

      // Check if account was deactivated
      if (message.includes('deactivated')) {
        store.dispatch(setDeactivated());
      } else {
        store.dispatch(logout());
      }
    }
    return Promise.reject(error);
  }
);

// ... rest of API exports

// Auth endpoints
export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  register: (name, email, password, role, clientId) =>
    api.post('/auth/register', { name, email, password, role, clientId }),
  getMe: () => api.get('/auth/me'),
};

// Dashboard endpoints
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

export const userAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  resetPassword: (id, password) => api.put(`/users/${id}/reset-password`, { password }),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// Client endpoints
export const clientAPI = {
  getClients: (params) => api.get('/clients', { params }),
  createClient: (data) => api.post('/clients', data),
  updateClient: (id, data) => api.put(`/clients/${id}`, data),
  deleteClient: (id) => api.delete(`/clients/${id}`),
};

// Invoice endpoints
export const invoiceAPI = {
  getInvoices: (params) => api.get('/invoices', { params }),
  getInvoice: (id) => api.get(`/invoices/${id}`),
  getInvoiceHistory: (id) => api.get(`/invoices/${id}/history`),
  createInvoice: (data) => api.post('/invoices', data),
  updateInvoice: (id, data) => api.put(`/invoices/${id}`, data),
  updateInvoiceStatus: (id, data) => api.put(`/invoices/${id}/status`, data),
  uploadPDF: (id, formData) => api.post(`/pdfs/${id}/upload-pdf`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  downloadPDF: (id) => api.get(`/pdfs/${id}/download-pdf`),
  viewPDF: (id) => api.get(`/pdfs/${id}/view-pdf`),
};

export const remarkAPI = {
  getRemarks: (invoiceId) => api.get(`/remarks/${invoiceId}`),
  addRemark: (invoiceId, message) => api.post(`/remarks/${invoiceId}`, { message }),
};

export default api;

/* XHR

POST

http://localhost:5000/api/invoices

[HTTP/1.1 500 Internal Server Error 48ms]

	

POST

  http://localhost:5000/api/invoices

Status

500

Internal Server Error

VersionHTTP/1.1

Transferred1.85 kB (1.56 kB size)

Referrer Policystrict-origin-when-cross-origin

Request PriorityHighest

DNS ResolutionSystem

    	

    Access-Control-Allow-Origin

      *

    Connection

      keep-alive

    Content-Length

      1557

    Content-Type

      application/json; charset=utf-8

    Date

      Mon, 06 Jul 2026 12:06:35 GMT

    ETag

      W/"615-gB0Ew28sdFXCs1WO2cMmzxNB50s"

    Keep-Alive

      timeout=5

    X-Powered-By

      Express

    	

    Accept

      application/json, text/plain, */
/*

Accept-Encoding

gzip, deflate, br, zstd

Accept-Language

en-US,en;q=0.9

Authorization

Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNDc4YWU5YjQxNzlkYTU0MTZkOTRiZSIsImlhdCI6MTc4MzMzOTEwOSwiZXhwIjoxNzgzMzY3OTA5fQ.Im7RAEENNpuUiQuMbMGnGUHwAyYIo69MRf6IXk7xWJY

Connection

keep-alive

Content-Length

212

Content-Type

application/json

Host

localhost:5000

Origin

http://localhost:5173

Priority

u=0

Referer

http://localhost:5173/

Sec-Fetch-Dest

empty

Sec-Fetch-Mode

cors

Sec-Fetch-Site

same-site

User-Agent

Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0

​



*/