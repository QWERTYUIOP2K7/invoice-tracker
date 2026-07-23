import { useEffect, useState } from 'react';
import { invoiceAPI, remarkAPI } from '../../services/api';
import Navbar from '../../components/Navbar';

export default function CommunicationCenter() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [remarks, setRemarks] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, paid

  useEffect(() => {
    fetchInvoices();
  }, [filter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await invoiceAPI.getInvoices(params);
      setInvoices(res.data.invoices || []);
      if (res.data.invoices?.length > 0) {
        setSelectedInvoice(res.data.invoices[0]._id);
      }
    } catch (err) {
      console.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedInvoice) {
      fetchRemarks();
    }
  }, [selectedInvoice]);

  const fetchRemarks = async () => {
    try {
      const res = await remarkAPI.getRemarks(selectedInvoice);
      setRemarks(res.data.remarks || []);
    } catch (err) {
      console.error('Failed to load remarks');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedInvoice) return;

    try {
      await remarkAPI.addRemark(selectedInvoice, message);
      setMessage('');
      fetchRemarks();
    } catch (err) {
      alert('Failed to send message');
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

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">All Communications</h1>

          {/* Filter */}
          <div className="bg-white border border-gray-200 p-4 mb-6 rounded flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded font-medium ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Invoices
            </button>
            <button
              onClick={() => setFilter('Pending')}
              className={`px-4 py-2 rounded font-medium ${
                filter === 'Pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('Paid')}
              className={`px-4 py-2 rounded font-medium ${
                filter === 'Paid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Paid
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Invoice List */}
            <div className="md:col-span-1 bg-white border border-gray-200 rounded">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Invoices ({invoices.length})</h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {invoices.length === 0 ? (
                  <p className="p-4 text-gray-500 text-sm">No invoices</p>
                ) : (
                  invoices.map(invoice => (
                    <button
                      key={invoice._id}
                      onClick={() => setSelectedInvoice(invoice._id)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                        selectedInvoice === invoice._id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-gray-600">{invoice.clientId?.companyName}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Status: <span className="font-medium">{invoice.status}</span>
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Remarks */}
            <div className="md:col-span-2 bg-white border border-gray-200 rounded flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">
                  {selectedInvoice
                    ? `Conversation - ${invoices.find(i => i._id === selectedInvoice)?.invoiceNumber}`
                    : 'Select an invoice'}
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
                {remarks.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No messages yet</p>
                ) : (
                  remarks.map(remark => (
                    <div key={remark._id} className="bg-gray-50 p-4 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{remark.addedBy?.name}</p>
                          <p className="text-xs text-gray-600">{remark.addedBy?.role}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(remark.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <p className="text-gray-700">{remark.message}</p>
                    </div>
                  ))
                )}
              </div>

              {selectedInvoice && (
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded"
                    />
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded font-medium"
                    >
                      Send
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}