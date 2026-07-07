import { useNavigate } from 'react-router-dom';

export default function WorkQueue({ workQueue }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Work Queue</h2>
      </div>

      <div className="divide-y divide-gray-200">
        {/* Draft Invoices */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Draft Invoices ({workQueue?.draft?.length || 0})
          </h3>
          <div className="space-y-2">
            {workQueue?.draft && workQueue.draft.length > 0 ? (
              workQueue.draft.map((invoice) => (
                <div
                  key={invoice._id}
                  onClick={() => navigate(`/invoice/detail/${invoice._id}`)}
                  className="p-3 bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                    <span className="text-xs text-gray-600">₹{invoice.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No draft invoices</p>
            )}
          </div>
        </div>

        {/* Pending Invoices */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Pending Invoices ({workQueue?.pending?.length || 0})
          </h3>
          <div className="space-y-2">
            {workQueue?.pending && workQueue.pending.length > 0 ? (
              workQueue.pending.map((invoice) => (
                <div
                  key={invoice._id}
                  onClick={() => navigate(`/invoice/detail/${invoice._id}`)}
                  className="p-3 bg-yellow-50 border border-yellow-200 cursor-pointer hover:bg-yellow-100"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                    <span className="text-xs text-gray-600">₹{invoice.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-xs text-gray-600">Reason: {invoice.pendingReason}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No pending invoices</p>
            )}
          </div>
        </div>

        {/* Overdue Invoices */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Overdue Invoices ({workQueue?.overdue?.length || 0})
          </h3>
          <div className="space-y-2">
            {workQueue?.overdue && workQueue.overdue.length > 0 ? (
              workQueue.overdue.map((invoice) => (
                <div
                  key={invoice._id}
                  onClick={() => navigate(`/invoice/detail/${invoice._id}`)}
                  className="p-3 bg-red-50 border border-red-200 cursor-pointer hover:bg-red-100"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                    <span className="text-xs text-gray-600">₹{invoice.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-xs text-gray-600">Due: {new Date(invoice.dueDate).toLocaleDateString('en-IN')}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No overdue invoices</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}