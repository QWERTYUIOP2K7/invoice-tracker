import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { remarkAPI } from '../services/api';
import { FiSend } from 'react-icons/fi';

export default function RemarksSection({ invoice }) {
  const { user } = useSelector((state) => state.auth);
  const [remarks, setRemarks] = useState([]);
  const [newRemark, setNewRemark] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (invoice?._id) {
      fetchRemarks();
    }
  }, [invoice?._id]);

  useEffect(() => {
    // Scroll to bottom on new messages
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [remarks]);

  const fetchRemarks = async () => {
    try {
      setLoading(true);
      const res = await remarkAPI.getRemarks(invoice._id);
      setRemarks(res.data.remarks);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load remarks');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRemark = async () => {
    if (!newRemark.trim()) return;
    setSending(true);
    try {
      const res = await remarkAPI.addRemark(invoice._id, newRemark.trim());
      setRemarks(prev => [...prev, res.data.remark]);
      setNewRemark('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add remark');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddRemark();
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Admin',
      finance: 'Finance Team',
      client: 'Client',
    };
    return labels[role] || role;
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

  return (
    <div className="bg-white border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">
          Communication
          {remarks.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({remarks.length} messages)
            </span>
          )}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Invoice: {invoice.invoiceNumber}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-96">
        {loading ? (
          <div className="text-center text-gray-500 py-8">
            Loading messages...
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : remarks.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          remarks.map((remark) => (
            <div
              key={remark._id}
              className={`flex ${isOwnMessage(remark) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 ${
                  isOwnMessage(remark)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {/* Sender info */}
                <div className={`flex items-center gap-2 mb-1 ${isOwnMessage(remark) ? 'justify-end' : 'justify-start'}`}>
                  <span className={`text-xs font-medium ${isOwnMessage(remark) ? 'text-blue-100' : 'text-gray-600'}`}>
                    {remark.addedBy?.name || 'Unknown'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 ${getRoleBadgeColor(remark.userRole)}`}>
                    {getRoleLabel(remark.userRole)}
                  </span>
                </div>

                {/* Message */}
                <p className="text-sm">{remark.message}</p>

                {/* Timestamp */}
                <p className={`text-xs mt-1 ${isOwnMessage(remark) ? 'text-blue-200' : 'text-gray-500'} text-right`}>
                  {new Date(remark.createdAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            value={newRemark}
            onChange={(e) => setNewRemark(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            className="flex-1 p-3 border border-gray-300 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            rows={3}
          />
          <button
            onClick={handleAddRemark}
            disabled={sending || !newRemark.trim()}
            className="px-4 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <FiSend size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}