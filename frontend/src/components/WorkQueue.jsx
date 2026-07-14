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

  const invoiceSection = (title, icon, invoices, color) => (
    <div className={`p-6 border-b border-gray-200 last:border-b-0`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        {icon} {title} ({Array.isArray(invoices) ? invoices.length : 0})
      </h3>
      <div className="space-y-2">
        {Array.isArray(invoices) && invoices.length > 0 ? (
          invoices.map((invoice) => (
            <div
              key={String(invoice._id)}
              onClick={() => navigate(`/invoice/detail/${invoice._id}`)}
              className={`p-3 border cursor-pointer hover:shadow-md transition ${color}`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                <span className="text-xs text-gray-600">₹{invoice.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No invoices</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Work Queue</h2>
        <p className="text-sm text-gray-500 mt-1">Status by Stage</p>
      </div>

      {/* Draft - Need Action */}
      {invoiceSection(
        'Draft',
        workQueue?.draft,
        'bg-gray-50 border-gray-200'
      )}

      {/* Generated - Review Needed */}
      {invoiceSection(
        'Generated',
        workQueue?.generated,
        'bg-blue-50 border-blue-200'
      )}

      {/* Approved - Ready to Send */}
      {invoiceSection(
        'Approved',
        workQueue?.approved,
        'bg-indigo-50 border-indigo-200'
      )}

      {/* Sent - Awaiting Payment */}
      {invoiceSection(
        'Sent',
        workQueue?.sent,
        'bg-purple-50 border-purple-200'
      )}

      {/* Paid - Completed */}
      {invoiceSection(
        'Paid',
        workQueue?.paid,
        'bg-green-50 border-green-200'
      )}

      {/* Pending - On Hold */}
      {invoiceSection(
        'Pending',
        workQueue?.pending,
        'bg-yellow-50 border-yellow-200'
      )}

      {/* Overdue - URGENT */}
      {invoiceSection(
        'Overdue',
        workQueue?.overdue,
        'bg-red-50 border-red-200'
      )}
    </div>
  );
}