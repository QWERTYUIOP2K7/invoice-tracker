import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/client/ClientDashboard';
import FinanceDashboard from './pages/finance/financeDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateInvoice from './pages/invoice/CreateInvoice';
import ProtectedRoute from './components/ProtectedRoute';
import InvoiceDetail from './pages/invoice/InvoiceDetail';
import EditInvoice from './pages/invoice/EditInvoice';
import ClientManagement from './pages/finance/ClientManagement';
import RemarksCenter from './pages/finance/RemarksCenter';
import UserManagement from './pages/admin/UserManagement';
import InvoiceList from './pages/finance/invoiceList';
import errorBoundary from './components/errorBoundary';
import RegisterFinance from './pages/RegisterFinance';
export default function App() {
  const { user } = useSelector((state) => state.auth);

  return (
    <errorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/client/dashboard"
            element={
              <ProtectedRoute requiredRole="client">
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route path="/register-finance" element={<RegisterFinance />} />
          
          <Route
            path="/finance/dashboard"
            element={
              <ProtectedRoute requiredRole="finance">
                <FinanceDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/finance/clients"
            element={
              <ProtectedRoute requiredRole="finance">
                <ClientManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/communication"
            element={
              <ProtectedRoute requiredRole="finance">
                <RemarksCenter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/finance/invoices"
            element={
              <ProtectedRoute requiredRole="finance">
                <InvoiceList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="admin">
                <UserManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/invoice/create"
            element={
              <ProtectedRoute requiredRole="finance">
                <CreateInvoice />
              </ProtectedRoute>
            }
          />

          <Route
            path="/invoice/detail/:id"
            element={
              <ProtectedRoute requiredRole="finance">
                <InvoiceDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/invoice/edit/:id"
            element={
              <ProtectedRoute requiredRole="finance">
                <EditInvoice />
              </ProtectedRoute>
            }
          />

          <Route
            path="/"
            element={
              user ? (
                <Navigate
                  to={
                    user.role === 'admin'
                      ? '/admin/dashboard'
                      : user.role === 'finance'
                        ? '/finance/dashboard'
                        : '/client/dashboard'
                  }
                  replace
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route path="/admin/*" element={<div className="p-8">Admin Dashboard Coming Soon</div>} />
        </Routes>
      </Router>
    </errorBoundary>
  );
}