import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import KPICard from '../../components/KPICard';
import MyClientsTable from '../../components/MyClientsTable';
import WorkQueue from '../../components/WorkQueue';
import Navbar from '../../components/Navbar';
import { FiDollarSign, FiCheckCircle, FiClock, FiAlertCircle, FiTrendingUp } from 'react-icons/fi';
import { formatCurrency } from '../../utils/currency';
import { getStatusColor, STATUS_LABELS } from '../../utils/invoiceStatus';
export default function FinanceDashboard() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [kpis, setKpis] = useState(null);
  const [clients, setClients] = useState([]);
  const [workQueue, setWorkQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedClient, setSelectedClient] = useState('');
  useEffect(() => {
    if (user?.assignedClients && user.assignedClients.length > 0) {
      const firstClientId =
        user.assignedClients[0]._id || user.assignedClients[0];

      setSelectedClient(firstClientId);
    }
  }, [user]);
  useEffect(() => {
    if (selectedClient) {
      fetchDashboardData();
    }
  }, [selectedClient]);
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = {
        status: [
          'Performa Invoice Generated',
          'Performa Invoice Sent',
          'Approved',
          'Sent',
          'Paid',
          'Pending',
          'Overdue',
        ],
      };
      const [kpiRes, clientRes, queueRes] = await Promise.all([
        dashboardAPI.getFinanceDashboard(),
        dashboardAPI.getFinanceMyClients(),
        dashboardAPI.getFinanceWorkQueue(),
      ]);

      setKpis(kpiRes.data.data);
      setClients(clientRes.data.data);
      setWorkQueue(queueRes.data.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4">
            <p className="font-medium">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-4 bg-red-600 text-white px-4 py-2 hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 p-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Finance Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome, {user?.name}!</p>
          </div>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => navigate('/finance/clients')}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 font-medium"
            >
              Manage Clients
            </button>
            <button
              onClick={() => navigate('/invoice/create')}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 font-medium"
            >
              + Create Invoice
            </button>
            <button
              onClick={() => navigate('/invoice/bulk-upload')}
              className="px-6 py-3 bg-orange-600 text-white font-medium rounded-md hover:bg-orange-700"
            >
              Bulk Upload
            </button>

            <button
              onClick={() => navigate('/finance/invoices')}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 font-medium"
            >
              All Invoices
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium border-b-2 transition ${activeTab === 'overview'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-6 py-3 font-medium border-b-2 transition ${activeTab === 'queue'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
          >
            Work Queue
          </button>
          <button
            onClick={() => navigate('/finance/communication')}
            className="px-6 py-3 font-medium text-gray-600 border-b-2 border-transparent hover:text-gray-900 transition"
          >
            Communication
          </button>
        </div>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Client Selector */}
            {user?.assignedClients?.length > 0 && (
              <div className="bg-white border border-gray-200 p-6 mb-8 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Client to View
                </label>

                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a client...</option>

                  {user.assignedClients.map((client) => (
                    <option
                      key={client._id || client}
                      value={client._id || client}
                    >
                      {client.clientCode
                        ? `${client.clientCode} - ${client.companyName}`
                        : client}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
              <KPICard
                title="Assigned Clients"
                value={kpis?.assignedClients || 0}
                icon={<FiTrendingUp size={24} />}
                color="blue"
              />
              <KPICard
                title="Total Invoices"
                value={kpis?.totalInvoices || 0}
                icon={<FiDollarSign size={24} />}
                color="blue"
              />
              <KPICard
                title="Paid"
                value={kpis?.paidInvoices || 0}
                icon={<FiCheckCircle size={24} />}
                color="green"
              />
              <KPICard
                title="Pending"
                value={kpis?.pendingInvoices || 0}
                icon={<FiClock size={24} />}
                color="yellow"
              />
              <KPICard
                title="Overdue"
                value={kpis?.overdueInvoices || 0}
                icon={<FiAlertCircle size={24} />}
                color="red"
              />
              <KPICard
                title="Outstanding"
                value={kpis?.outstandingAmount || 0}
                icon={<FiDollarSign size={24} />}
                color="purple"
              />
            </div>

            {/* Clients Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <MyClientsTable clients={clients} />
              </div>
            </div>
          </>
        )}

        {/* Work Queue */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Work Queue
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(workQueue).map(([status, invoices]) => (
              <div key={status} className="bg-white border border-gray-200 rounded">
                <div className={`p-4 border-b border-gray-200 ${getStatusColor(status)}`}>
                  <h3 className="font-semibold text-gray-900">
                    {STATUS_LABELS[status]} ({invoices.length})
                  </h3>
                </div>

                <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
                  {invoices.length === 0 ? (
                    <p className="p-4 text-gray-500 text-sm">
                      No invoices
                    </p>
                  ) : (
                    invoices.map((invoice) => (
                      <a
                        key={invoice._id}
                        href={`/invoice/detail/${invoice._id}`}
                        className="block p-4 hover:bg-gray-50 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">
                              {invoice.invoiceNumber}
                            </p>
                            <p className="text-sm text-gray-600">
                              {invoice.clientId?.companyName}
                            </p>
                          </div>

                          <p className="font-semibold text-gray-900">
                            {formatCurrency(invoice.amount)}
                          </p>
                        </div>

                        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                          <span>
                            Due: {new Date(invoice.dueDate).toLocaleDateString('en-IN')}
                          </span>
                          <span>{invoice.invoiceMonth}</span>
                        </div>
                      </a>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}