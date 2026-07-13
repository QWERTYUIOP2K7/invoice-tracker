import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import { FiSearch, FiDownload, FiEye, FiFilter } from 'react-icons/fi';
import { formatCurrency } from '../../utils/currency';

export default function InvoiceList() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [amountMinFilter, setAmountMinFilter] = useState('');
  const [amountMaxFilter, setAmountMaxFilter] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await invoiceAPI.getInvoices({ limit: 1000 });
      setInvoices(res.data.invoices);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  // Apply all filters
  const filteredInvoices = invoices.filter((invoice) => {
    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      if (
        !invoice.invoiceNumber.toLowerCase().includes(searchLower) &&
        !invoice.clientId?.companyName?.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'all' && invoice.status !== statusFilter) {
      return false;
    }

    // Date range filter
    if (dateFromFilter) {
      const invoiceDate = new Date(invoice.invoiceDate);
      const fromDate = new Date(dateFromFilter);
      if (invoiceDate < fromDate) return false;
    }

    if (dateToFilter) {
      const invoiceDate = new Date(invoice.invoiceDate);
      const toDate = new Date(dateToFilter);
      if (invoiceDate > toDate) return false;
    }

    // Amount range filter
    if (amountMinFilter && invoice.amount < parseFloat(amountMinFilter)) {
      return false;
    }

    if (amountMaxFilter && invoice.amount > parseFloat(amountMaxFilter)) {
      return false;
    }

    return true;
  });

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/export/excel`, {        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoices_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export Excel: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
    setAmountMinFilter('');
    setAmountMaxFilter('');
  };

  const getStatusColor = (status) => {
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
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">All Invoices</h1>
              <p className="text-gray-600 mt-2">View and manage all invoices</p>
            </div>
            <button
              onClick={handleExportExcel}
              disabled={exporting || filteredInvoices.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiDownload size={18} />
              {exporting ? 'Exporting...' : 'Export to Excel'}
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white border border-gray-200 p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <FiFilter size={20} className="text-gray-600" />
              <h2 className="text-lg font-bold text-gray-900">Filters</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Invoice # or Client"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Generated">Generated</option>
                  <option value="Approved">Approved</option>
                  <option value="Sent">Sent</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Amount Min */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Amount</label>
                <input
                  type="number"
                  value={amountMinFilter}
                  onChange={(e) => setAmountMinFilter(e.target.value)}
                  placeholder="₹"
                  className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Amount Max */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Amount</label>
                <input
                  type="number"
                  value={amountMaxFilter}
                  onChange={(e) => setAmountMaxFilter(e.target.value)}
                  placeholder="₹"
                  className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {(search || statusFilter !== 'all' || dateFromFilter || dateToFilter || amountMinFilter || amountMaxFilter) && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm bg-gray-300 text-gray-700 hover:bg-gray-400"
              >
                Clear All Filters
              </button>
            )}
          </div>

          {/* Results Info */}
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredInvoices.length} of {invoices.length} invoices
          </div>

          {/* Invoices Table */}
          <div className="bg-white border border-gray-200">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading invoices...</div>
            ) : filteredInvoices.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No invoices found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Invoice #</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Client</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Invoice Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Due Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{invoice.invoiceNumber}</td>
                        <td className="px-6 py-4 text-gray-700">{invoice.clientId?.companyName || 'N/A'}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(invoice.amount)}</td>
                        <td className="px-6 py-4 text-gray-700">
                          {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {new Date(invoice.dueDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <button
                            onClick={() => navigate(`/invoice/detail/${invoice._id}`)}
                            className="p-2 hover:bg-blue-100 text-blue-600"
                            title="View"
                          >
                            <FiEye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}