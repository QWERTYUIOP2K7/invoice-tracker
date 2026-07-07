import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { invoiceAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import { formatCurrency } from '../../utils/currency';
import { FiDownload, FiEdit, FiArrowLeft } from 'react-icons/fi';
import RemarksSection from '../../components/RemarksSection';


const VALID_TRANSITIONS = {
  Draft: ['Generated'],
  Generated: ['Approved'],
  Approved: ['Sent'],
  Sent: ['Paid', 'Pending', 'Overdue'],
  Paid: [],
  Pending: ['Sent', 'Approved'],
  Overdue: ['Paid', 'Pending'],
};

const PENDING_REASONS = [
  'Client approval pending',
  'PO not received',
  'Payment processing',
  'Document verification pending',
  'Budget issue',
  'Other',
];

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [invoice, setInvoice] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [pendingReason, setPendingReason] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(null);

  useEffect(() => {
    fetchInvoiceDetail();
  }, [id]);

  const fetchInvoiceDetail = async () => {
    try {
      setLoading(true);
      const [invRes, histRes] = await Promise.all([
        invoiceAPI.getInvoice(id),
        invoiceAPI.getInvoiceHistory(id),
      ]);
      setInvoice(invRes.data.invoice);
      setHistory(histRes.data.history);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPDF = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      await invoiceAPI.uploadPDF(id, formData);
      setSelectedFile(null);
      fetchInvoiceDetail();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload PDF');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice?.pdfUrl) return;
    try {
      const response = await fetch(`http://localhost:5000/${invoice.pdfUrl}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
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
      alert('Failed to download PDF');
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdate) return;
    setStatusLoading(true);
    setStatusError(null);
    try {
      await invoiceAPI.updateInvoiceStatus(id, {
        status: statusUpdate,
        pendingReason: statusUpdate === 'Pending' ? pendingReason : undefined,
      });
      setStatusUpdate('');
      setPendingReason('');
      fetchInvoiceDetail();
    } catch (err) {
      setStatusError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  if (error || !invoice) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 p-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8">
            <FiArrowLeft size={18} /> Back
          </button>
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4">
            {error || 'Invoice not found'}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
                <FiArrowLeft size={18} /> Back
              </button>
              <h1 className="text-3xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
            </div>
            <div className="flex gap-4">
              {(user?.role === 'finance' || user?.role === 'admin') && (
                <button onClick={() => navigate(`/invoice/edit/${id}`)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700">
                  <FiEdit size={18} /> Edit
                </button>
              )}
              {invoice.pdfUrl && (
                <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700">
                  <FiDownload size={18} /> Download PDF
                </button>
              )}
            </div>
          </div>

          {/* Main Details */}
          <div className="bg-white border border-gray-200 p-8 mb-8">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-gray-600 mb-1">Client</p>
                <p className="text-lg font-semibold text-gray-900">{invoice.clientId?.companyName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <span className={`px-3 py-1 text-sm font-medium ${getStatusColor(invoice.status)}`}>
                  {invoice.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Amount</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(invoice.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Invoice Date</p>
                <p className="text-lg font-semibold text-gray-900">{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Due Date</p>
                <p className="text-lg font-semibold text-gray-900">{new Date(invoice.dueDate).toLocaleDateString('en-IN')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Billing Month</p>
                <p className="text-lg font-semibold text-gray-900">{invoice.billingMonth || 'N/A'}</p>
              </div>
            </div>
            {invoice.poNumber && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-1">PO Number</p>
                <p className="text-lg font-semibold text-gray-900">{invoice.poNumber}</p>
              </div>
            )}
          </div>

          {/* Status Update - Finance/Admin only */}
          {(user?.role === 'finance' || user?.role === 'admin') && (
            <div className="bg-white border border-gray-200 p-8 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Update Invoice Status</h2>

              {statusError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4">
                  {statusError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Status</p>
                  <span className={`px-3 py-1 text-sm font-medium ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </div>

                {VALID_TRANSITIONS[invoice.status]?.length > 0 ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Change Status To
                      </label>
                      <select
                        value={statusUpdate}
                        onChange={(e) => {
                          setStatusUpdate(e.target.value);
                          setPendingReason('');
                        }}
                        className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="">Select new status</option>
                        {VALID_TRANSITIONS[invoice.status].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    {statusUpdate === 'Pending' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pending Reason *
                        </label>
                        <select
                          value={pendingReason}
                          onChange={(e) => setPendingReason(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                          <option value="">Select a reason</option>
                          {PENDING_REASONS.map((reason) => (
                            <option key={reason} value={reason}>
                              {reason}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      onClick={handleStatusUpdate}
                      disabled={
                        statusLoading ||
                        !statusUpdate ||
                        (statusUpdate === 'Pending' && !pendingReason)
                      }
                      className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {statusLoading ? 'Updating...' : 'Update Status'}
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">
                    No further status transitions available for this invoice.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* PDF Upload - Finance/Admin only */}
          {!invoice.pdfUrl && (user?.role === 'finance' || user?.role === 'admin') && (
            <div className="bg-white border border-gray-200 p-8 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Invoice PDF</h2>
              <form onSubmit={handleUploadPDF} className="space-y-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300"
                  required
                />
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload PDF'}
                </button>
              </form>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Change History</h2>
              <div className="space-y-4">
                {history.map((entry) => (
                  <div key={entry._id} className="pb-4 border-b border-gray-200 last:border-b-0">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-gray-900">{entry.action}</p>
                      <span className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="text-sm text-gray-600">Changed by: {entry.changedBy?.name}</p>
                    {entry.fieldChanged && (
                      <p className="text-sm text-gray-600">Field: {entry.fieldChanged}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Remarks/Communication */}
          <div className="mt-8">
            <RemarksSection invoice={invoice} />
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