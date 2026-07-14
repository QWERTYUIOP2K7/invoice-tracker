import { useNavigate } from 'react-router-dom';

export default function WorkQueue({ workQueue }) {
  const navigate = useNavigate();

  const getStatusBadge = (status) => {
    const badges = {
      Draft: 'bg-gray-100 text-gray-800',
      Generated: 'bg-blue-100 text-blue-800',
      Approved: 'bg-indigo-100 text-indigo-800',
      Sent: 'bg-purple-100 text-purple-800',
      Paid: 'bg-green-100 text-green-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Overdue: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const renderSection = (title, icon, invoices, bgColor, borderColor) => {
    const invoiceArray = Array.isArray(invoices) ? invoices : [];
    
    return (
      <div className="p-6 border-b border-gray-200 last:border-b-0">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          {icon} {title} ({invoiceArray.length})
        </h3>
        <div className="space-y-2">
          {invoiceArray.length > 0 ? (
            invoiceArray.map((invoice) => (
              <button
                key={String(invoice._id)}
                onClick={() => navigate(`/invoice/detail/${String(invoice._id)}`)}
                className={`w-full text-left p-3 border cursor-pointer hover:shadow-md transition ${bgColor} ${borderColor}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                  <span className="text-xs text-gray-600">
                    ₹{(invoice.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <p className="text-sm text-gray-500">No invoices</p>
          )}
        </div>
      </div>
    );
  };

  if (!workQueue) {
    return (
      <div className="bg-white border border-gray-200 p-6">
        <p className="text-gray-500">Loading work queue...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Work Queue</h2>
        <p className="text-sm text-gray-500 mt-1">Status by Stage</p>
      </div>

      {renderSection('Draft', workQueue.draft, 'bg-gray-50', 'border-gray-200')}
      {renderSection('Generated', workQueue.generated, 'bg-blue-50', 'border-blue-200')}
      {renderSection('Approved', workQueue.approved, 'bg-indigo-50', 'border-indigo-200')}
      {renderSection('Sent', workQueue.sent, 'bg-purple-50', 'border-purple-200')}
      {renderSection('Paid', workQueue.paid, 'bg-green-50', 'border-green-200')}
      {renderSection('Pending', workQueue.pending, 'bg-yellow-50', 'border-yellow-200')}
      {renderSection('Overdue', workQueue.overdue, 'bg-red-50', 'border-red-200')}
    </div>
  );
}