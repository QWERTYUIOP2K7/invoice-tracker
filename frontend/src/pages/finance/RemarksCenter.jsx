import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { invoiceAPI, remarkAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import { FiSend } from 'react-icons/fi';

export default function RemarksCenter() {
  const { user } = useSelector((state) => state.auth);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [remarks, setRemarks] = useState([]);
  const [newRemark, setNewRemark] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState('all');

 useEffect(() => {
    fetchInvoices();
}, [filter]);

  useEffect(() => {
    if (selectedInvoice) {
      fetchRemarks();
    }
  }, [selectedInvoice]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      // Fetch pending + overdue invoices (those needing communication)
      const res = await invoiceAPI.getInvoices({
        status: filter === 'all' ? undefined : filter,
        limit: 50,
      });

      const filtered = res.data.invoices.filter(inv =>
        ['Pending', 'Overdue', 'Sent'].includes(inv.status)
      );
      setInvoices(filtered);

      if (filtered.length > 0 && !selectedInvoice) {
        setSelectedInvoice(filtered[0]);
      }
      else if (filtered.length === 0) {
        setSelectedInvoice(null);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRemarks = async () => {
    try {
      const invoiceId =
        typeof selectedInvoice === 'string'
          ? selectedInvoice
          : selectedInvoice?._id;

      if (!invoiceId) return;

      const res = await remarkAPI.getRemarks(invoiceId);
      setRemarks(res.data.remarks || []);
    } catch (err) {
      console.error('Failed to load remarks:', err);
    }
  };


  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      finance: 'bg-blue-100 text-blue-800',
      client: 'bg-green-100 text-green-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const isOwnMessage = (remark) => {
    return remark.addedBy?._id === user?.id || remark.addedBy?.email === user?.email;
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
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Communication Center</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Invoices List */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Invoices</h2>
                <p className="text-sm text-gray-500 mt-1">Pending & Overdue</p>
              </div>

              {/* Filter */}
              <div className="p-4 border-b border-gray-200">
                <select
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                  }} className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Sent">Sent</option>
                </select>
              </div>

              {/* Invoice List */}
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">Loading...</div>
                ) : invoices.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No invoices</div>
                ) : (
                  invoices.map((invoice) => (
                    <button
                      key={invoice._id}
                      onClick={() => setSelectedInvoice(invoice)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition ${selectedInvoice?._id === invoice._id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        }`}
                    >
                      <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {invoice.clientId?.companyName || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        ₹{invoice.amount.toLocaleString('en-IN')}
                      </p>
                      <span className={`inline-block text-xs px-2 py-1 mt-2 font-medium ${invoice.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                        invoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                        {invoice.status}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            {selectedInvoice ? (
              <div className="lg:col-span-2 bg-white border border-gray-200 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">{selectedInvoice.invoiceNumber}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedInvoice.clientId?.companyName}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Amount: ₹{selectedInvoice.amount.toLocaleString('en-IN')} |
                    Due: {new Date(selectedInvoice.dueDate).toLocaleDateString('en-IN')}
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-96">
                  {remarks.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No messages yet
                    </div>
                  ) : (
                    remarks.map((remark) => (
                      <div
                        key={remark._id}
                        className={`flex ${isOwnMessage(remark) ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 ${isOwnMessage(remark)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                            }`}
                        >
                          <div className={`flex items-center gap-2 mb-1 ${isOwnMessage(remark) ? 'justify-end' : 'justify-start'
                            }`}>
                            <span className={`text-xs font-medium ${isOwnMessage(remark) ? 'text-blue-100' : 'text-gray-600'
                              }`}>
                              {remark.addedBy?.name}
                            </span>
                            <span className={`text-xs px-2 py-0.5 ${getRoleBadgeColor(remark.userRole)}`}>
                              {remark.userRole === 'finance' ? 'Finance' : 'Client'}
                            </span>
                          </div>
                          <p className="text-sm">{remark.message}</p>
                          <p className={`text-xs mt-1 ${isOwnMessage(remark) ? 'text-blue-200' : 'text-gray-500'
                            }`}>
                            {new Date(remark.createdAt).toLocaleTimeString('en-IN')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input */}
                <div className="p-6 border-t border-gray-200">
                  <div className="flex gap-2">
                    <textarea
                      value={newRemark}
                      onChange={(e) => setNewRemark(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 p-3 border border-gray-300 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      rows={3}
                    />
                    <button
                      onClick={handleAddRemark}
                      disabled={sending || !newRemark.trim()}
                      className="px-4 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiSend size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-2 bg-white border border-gray-200 flex items-center justify-center p-12">
                <p className="text-gray-500">Select an invoice to view messages</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}