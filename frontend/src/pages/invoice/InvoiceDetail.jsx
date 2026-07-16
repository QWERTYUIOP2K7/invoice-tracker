import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { invoiceAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import { formatCurrency } from '../../utils/currency';
import { FiDownload, FiEdit, FiArrowLeft, FiUpload, FiTrash2 } from 'react-icons/fi';
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
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

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
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL;
    const baseUrl = apiUrl.replace('/api', '');
    
    const response = await fetch(`${baseUrl}/${invoice.pdfUrl}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch PDF');
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
    alert('Failed to download PDF: ' + err.message);
  }
};

  const handleDownloadReceipt = async () => {
  if (!invoice?.receiptUrl) return;
  try {
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL;
    const baseUrl = apiUrl.replace('/api', '');
    
    const response = await fetch(`${baseUrl}/${invoice.receiptUrl}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch receipt');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.invoiceNumber}_receipt`;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  } catch (err) {
    console.error('Receipt download error:', err);
    alert('Failed to download receipt: ' + err.message);
  }
};

  const handleDeleteReceipt = async () => {
    if (!window.confirm('Delete receipt?')) return;
    try {
      setUploadingReceipt(true);
      await invoiceAPI.deleteReceipt(id);
      fetchInvoiceDetail();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete receipt');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdate) return;
    setStatusLoading(true);
    setStatusError(null);
    try {
      // Update invoice status
      await invoiceAPI.updateInvoiceStatus(id, {
        status: statusUpdate,
        pendingReason: statusUpdate === 'Pending' ? pendingReason : undefined,
      });

      // Upload receipt if provided and status is Paid
      if (statusUpdate === 'Paid' && showReceiptUpload && receiptFile) {
        setUploadingReceipt(true);
        const formData = new FormData();
        formData.append('file', receiptFile);
        await invoiceAPI.uploadReceipt(id, formData);
        setUploadingReceipt(false);
      }

      setStatusUpdate('');
      setPendingReason('');
      setShowReceiptUpload(false);
      setReceiptFile(null);
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
                          setShowReceiptUpload(false);
                          setReceiptFile(null);
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

                    {/* Receipt Upload - Only when changing to Paid */}
                    {statusUpdate === 'Paid' && (
                      <div className="border border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <input
                            type="checkbox"
                            id="uploadReceipt"
                            checked={showReceiptUpload}
                            onChange={(e) => {
                              setShowReceiptUpload(e.target.checked);
                              if (!e.target.checked) {
                                setReceiptFile(null);
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <label htmlFor="uploadReceipt" className="text-sm font-medium text-gray-700">
                            Upload Payment Receipt (Optional)
                          </label>
                        </div>

                        {showReceiptUpload && (
                          <div className="border-2 border-dashed border-blue-300 p-4 text-center">
                            <FiUpload className="mx-auto text-blue-400 mb-2" size={24} />
                            <label className="block">
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => setReceiptFile(e.target.files[0] || null)}
                                disabled={uploadingReceipt}
                                className="hidden"
                              />
                              <span className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 cursor-pointer inline-block text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                {uploadingReceipt ? 'Uploading...' : 'Select Receipt File'}
                              </span>
                            </label>
                            {receiptFile && (
                              <p className="text-xs text-gray-600 mt-2">
                                Selected: {receiptFile.name}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">PDF, JPG, or PNG</p>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={handleStatusUpdate}
                      disabled={
                        statusLoading ||
                        uploadingReceipt ||
                        !statusUpdate ||
                        (statusUpdate === 'Pending' && !pendingReason)
                      }
                      className="w-full px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {statusLoading ? 'Updating...' : uploadingReceipt ? 'Uploading Receipt...' : 'Update Status'}
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

          {/* Receipt Section - Only visible for Paid invoices */}
          {invoice.status === 'Paid' && (
            <div className="bg-white border border-gray-200 p-8 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Receipt</h2>

              {invoice.receiptUrl ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200">
                    <FiUpload className="text-green-600" size={24} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Receipt attached</p>
                      <p className="text-xs text-gray-600">
                        Uploaded by {invoice.receiptUploadedBy?.name || 'Unknown'} on{' '}
                        {new Date(invoice.receiptUploadedAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadReceipt}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <FiDownload size={16} />
                      Download Receipt
                    </button>

                    {(user?.role === 'finance' || user?.role === 'admin') && (
                      <button
                        onClick={handleDeleteReceipt}
                        disabled={uploadingReceipt}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiTrash2 size={16} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 p-6 text-center">
                  <FiUpload className="mx-auto text-gray-400 mb-3" size={32} />
                  <p className="text-gray-700 mb-4">No receipt uploaded</p>
                  {(user?.role === 'finance' || user?.role === 'admin') && (
                    <label className="inline-block">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          setUploadingReceipt(true);
                          try {
                            const formData = new FormData();
                            formData.append('file', file);
                            await invoiceAPI.uploadReceipt(id, formData);
                            fetchInvoiceDetail();
                          } catch (err) {
                            alert(err.response?.data?.message || 'Failed to upload receipt');
                          } finally {
                            setUploadingReceipt(false);
                          }
                        }}
                        disabled={uploadingReceipt}
                        className="hidden"
                      />
                      <span className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 cursor-pointer inline-block disabled:opacity-50 disabled:cursor-not-allowed">
                        {uploadingReceipt ? 'Uploading...' : 'Upload Receipt'}
                      </span>
                    </label>
                  )}
                  <p className="text-xs text-gray-500 mt-2">PDF, JPG, or PNG (optional)</p>
                </div>
              )}
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
            <div className="bg-white border border-gray-200 p-8 mb-8">
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