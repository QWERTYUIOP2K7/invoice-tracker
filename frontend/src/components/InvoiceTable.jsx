import { useState } from 'react';
import { FiDownload, FiEye, FiSearch } from 'react-icons/fi';
import { formatCurrency } from '../utils/currency';
export default function InvoiceTable({ invoices, selectedInvoice, onSelectInvoice, onDownloadPDF }) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');

  // Filter invoices
  let filtered = filter === 'all'
    ? invoices
    : invoices.filter(inv => inv.status === filter);

  // Search invoices
  if (searchTerm.trim()) {
    filtered = filtered.filter(inv =>
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.billingMonth.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Sort invoices
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'amount':
        return b.amount - a.amount;
      case 'due':
        return new Date(a.dueDate) - new Date(b.dueDate);
      default:
        return 0;
    }
  });

  const getStatusColor = (status) => {
    const colors = {
      'Performa Invoice Generated': 'bg-gray-100 text-gray-800',
      'Performa Invoice Sent': 'bg-blue-100 text-blue-800',
      'Approved': 'bg-indigo-100 text-indigo-800',
      'Sent': 'bg-purple-100 text-purple-800',
      'Paid': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Overdue': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };


  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search and Filters */}
      <div className="p-6 border-b space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by invoice number or billing month..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex flex-wrap gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="Performa Invoice Generated">Performa Invoice Generated</option>
              <option value="Performa Invoice Sent">Performa Invoice Sent</option>
              <option value="Approved">Approved</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="date">Latest First</option>
              <option value="amount">Highest Amount</option>
              <option value="due">Due Soon</option>
            </select>
          </div>

          {/* Clear Filters */}
          {(searchTerm || filter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilter('all');
              }}
              className="self-end px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          Showing {sorted.length} of {invoices.length} invoices
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Invoice #</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Month</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Due Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  {invoices.length === 0
                    ? 'No invoices found'
                    : 'No invoices match your filters'}
                </td>
              </tr>
            ) : (
              sorted.map((invoice) => (
                <tr
                  key={invoice._id}
                  onClick={() => onSelectInvoice(invoice)}
                  className={`border-b cursor-pointer transition ${selectedInvoice?._id === invoice._id
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                    }`}
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {invoice.billingMonth}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {new Date(invoice.dueDate).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    {invoice.pdfUrl ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadPDF(invoice);
                        }}
                        className="p-2 hover:bg-blue-100 rounded transition"
                        title="Download PDF"
                      >
                        <FiDownload size={18} className="text-blue-600 hover:text-blue-800" />
                      </button>
                    ) : (
                      <button
                        disabled
                        className="p-2 text-gray-300 cursor-not-allowed"
                        title="No PDF available"
                      >
                        <FiDownload size={18} />
                      </button>
                    )}
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 hover:bg-gray-100 rounded transition"
                      title="View Details"
                    >
                      <FiEye size={18} className="text-gray-600 hover:text-gray-800" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}