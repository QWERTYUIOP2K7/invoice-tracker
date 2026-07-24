import { FiCheck } from 'react-icons/fi';

export default function InvoiceTimeline({ invoice }) {
  const statuses = ['Performa Invoice Generated', 'Performa Invoice Sent', 'Approved', 'Sent', 'Paid'];
  const currentStatusIndex = statuses.indexOf(invoice.status);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Invoice Timeline</h3>
      
      <div className="space-y-6">
        {statuses.map((status, index) => (
          <div key={status} className="flex items-center gap-4">
            {/* Circle */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition ${
                index <= currentStatusIndex
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {index <= currentStatusIndex ? (
                <FiCheck size={20} />
              ) : (
                index + 1
              )}
            </div>

            {/* Status Text */}
            <div>
              <p className={`font-medium ${
                index <= currentStatusIndex
                  ? 'text-gray-900'
                  : 'text-gray-500'
              }`}>
                {status}
              </p>
              {index === currentStatusIndex && (
                <p className="text-sm text-blue-600 font-medium">Current Status</p>
              )}
            </div>

            {/* Line */}
            {index < statuses.length - 1 && (
              <div className="absolute left-5 w-0.5 h-12 bg-gray-300 -translate-y-12"></div>
            )}
          </div>
        ))}
      </div>

      {/* Special Statuses */}
      {(invoice.status === 'Pending' || invoice.status === 'Overdue') && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium">
            {invoice.status === 'Pending' ? 'Invoice is Pending' : 'Invoice is Overdue'}
          </p>
          {invoice.pendingReason && (
            <p className="text-sm text-yellow-700 mt-1">
              Reason: {invoice.pendingReason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}