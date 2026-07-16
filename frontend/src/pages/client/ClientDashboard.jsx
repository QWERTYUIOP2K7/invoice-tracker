import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { dashboardAPI } from '../../services/api';
import KPICard from '../../components/KPICard';
import InvoiceTable from '../../components/InvoiceTable';
import InvoiceTimeline from '../../components/InvoiceTimeline';
import RemarksSection from '../../components/RemarksSection';
import { FiDollarSign, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import Navbar from '../../components/Navbar';
export default function ClientDashboard() {
  const { user } = useSelector((state) => state.auth);
  const [kpis, setKpis] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data...');

      const [kpiRes, invoiceRes] = await Promise.all([
        dashboardAPI.getClientDashboard(),
        dashboardAPI.getClientInvoices({ skip: 0, limit: 20 }),
      ]);

      console.log('KPI Response:', kpiRes.data);
      console.log('Invoice Response:', invoiceRes.data);

      setKpis(kpiRes.data.data);
      setInvoices(invoiceRes.data.data);
      if (invoiceRes.data.data.length > 0) {
        setSelectedInvoice(invoiceRes.data.data[0]);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (invoice) => {
    if (!invoice.pdfUrl) {
      alert('No PDF available for this invoice');
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const baseUrl = apiUrl.replace('/api', '');
      const pdfUrl = `${baseUrl}/${invoice.pdfUrl}`; const response = await fetch(pdfUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      console.error('PDF download error:', err);
      alert('Failed to download PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <p className="font-medium">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Invoice Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome, {user?.name}!</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Invoice Table */}
          <div className="lg:col-span-2">
            <InvoiceTable
              invoices={invoices}
              selectedInvoice={selectedInvoice}
              onSelectInvoice={setSelectedInvoice}
              onDownloadPDF={handleDownloadPDF}
            />
          </div>

          {/* Right Column - Timeline and Remarks */}
          <div className="space-y-8">
            {selectedInvoice && (
              <>
                <InvoiceTimeline invoice={selectedInvoice} />
                <RemarksSection invoice={selectedInvoice} />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}