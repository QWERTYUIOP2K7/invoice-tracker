import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { dashboardAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import KPICard from '../../components/KPICard';
import { FiTrendingUp, FiDollarSign, FiCheckCircle, FiClock, FiAlertCircle, FiUsers } from 'react-icons/fi';
import { formatCurrency } from '../../utils/currency';

export default function AdminDashboard() {
  const { user } = useSelector((state) => state.auth);
  const [kpis, setKpis] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [financePerformance, setFinancePerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [kpiRes, actRes, topRes, perfRes] = await Promise.all([
        dashboardAPI.getAdminDashboard(),
        dashboardAPI.getAdminRecentActivity({ limit: 10 }),
        dashboardAPI.getAdminTopClients({ limit: 5 }),
        dashboardAPI.getAdminFinancePerformance(),
      ]);

      setKpis(kpiRes.data.data);
      setRecentActivity(actRes.data.data);
      setTopClients(topRes.data.data);
      setFinancePerformance(perfRes.data.data);
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
            <p className="text-gray-600">Loading dashboard...</p>
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
            <button onClick={fetchDashboardData} className="mt-4 bg-red-600 text-white px-4 py-2 hover:bg-red-700">
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">System Overview</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <KPICard title="Active Clients" value={kpis?.activeClients || 0} icon={<FiUsers size={24} />} color="blue" />
          <KPICard title="Finance Users" value={kpis?.totalFinanceUsers || 0} icon={<FiUsers size={24} />} color="green" />
          <KPICard title="Total Invoices" value={kpis?.totalInvoices || 0} icon={<FiDollarSign size={24} />} color="blue" />
          <KPICard title="Paid Amount" value={kpis?.paidAmount || 0} icon={<FiCheckCircle size={24} />} color="green" />
          <KPICard title="Pending Amount" value={kpis?.pendingAmount || 0} icon={<FiClock size={24} />} color="yellow" />
          <KPICard title="Outstanding" value={kpis?.outstandingAmount || 0} icon={<FiAlertCircle size={24} />} color="red" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Activity */}
          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Recent Invoice Activity</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {recentActivity.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No recent activity</div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity._id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{activity.invoiceNumber}</p>
                        <p className="text-sm text-gray-600">{activity.clientName}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{formatCurrency(activity.amount)}</span>
                      <span>{new Date(activity.updatedAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Clients */}
          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Top Clients by Outstanding</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {topClients.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No clients</div>
              ) : (
                topClients.map((client, idx) => (
                  <div key={client._id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{idx + 1}. {client.clientName}</p>
                        <p className="text-xs text-gray-500">{client.clientCode}</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{client.invoiceCount} invoices</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(client.outstandingAmount)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Finance Performance */}
        <div className="bg-white border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Finance Team Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Client</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Total Invoices</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Pending</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Overdue</th>
                </tr>
              </thead>
              <tbody>
                {financePerformance.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No finance users</td>
                  </tr>
                ) : (
                  financePerformance.map((user) => (
                    <tr key={user._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 text-gray-700">{user.clientName}</td>
                      <td className="px-6 py-4 text-gray-700">{user.totalInvoices}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium">
                          {user.pendingInvoices}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium">
                          {user.overdueInvoices}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function getStatusColor(status) {
  const colors = {
    Draft: 'bg-gray-100 text-gray-800',
    Generated: 'bg-blue-100 text-blue-800',
    Approved: 'bg-indigo-100 text-indigo-800',
    Sent: 'bg-purple-100 text-purple-800',
    Paid: 'bg-green-100 text-green-800',
    Pending: 'bg-yellow-100 text-yellow-800',
    Overdue: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}