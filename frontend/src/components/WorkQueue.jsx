import { useNavigate } from 'react-router-dom';

export default function WorkQueue({ workQueue }) {
  const navigate = useNavigate();

  const getStatusBadge = (status) => {
    const badges = {
      Draft: 'bg-gray-100 text-gray-800',
      Generated: 'bg-blue-100 text-blue-800',
      Approved: 'bg-indigo-100 text-indigo-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Overdue: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Work Queue</h2>
        <p className="text-sm text-gray-500 mt-1">Action Required</p>
      </div>

      <div className="divide-y divide-gray-200">
        {/* Draft Invoices - Need to be generated */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            📝 Draft ({workQueue?.draft?.length || 0})
          </h3>
          <p className="text-xs text-gray-500 mb-3">Need to finalize and generate</p>
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

        {/* Generated Invoices - Ready to approve */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            ✍️ Generated ({workQueue?.generated?.length || 0})
          </h3>
          <p className="text-xs text-gray-500 mb-3">Ready for approval</p>
          <div className="space-y-2">
            {workQueue?.generated && workQueue.generated.length > 0 ? (
              workQueue.generated.map((invoice) => (
                <div
                  key={invoice._id}
                  onClick={() => navigate(`/invoice/detail/${invoice._id}`)}
                  className="p-3 bg-blue-50 border border-blue-200 cursor-pointer hover:bg-blue-100"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                    <span className="text-xs text-gray-600">₹{invoice.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No generated invoices</p>
            )}
          </div>
        </div>

        {/* Approved Invoices - Ready to send */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            ✓ Approved ({workQueue?.approved?.length || 0})
          </h3>
          <p className="text-xs text-gray-500 mb-3">Ready to send to client</p>
          <div className="space-y-2">
            {workQueue?.approved && workQueue.approved.length > 0 ? (
              workQueue.approved.map((invoice) => (
                <div
                  key={invoice._id}
                  onClick={() => navigate(`/invoice/detail/${invoice._id}`)}
                  className="p-3 bg-indigo-50 border border-indigo-200 cursor-pointer hover:bg-indigo-100"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                    <span className="text-xs text-gray-600">₹{invoice.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No approved invoices</p>
            )}
          </div>
        </div>

        {/* Pending Invoices - Waiting for action */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            ⏳ Pending ({workQueue?.pending?.length || 0})
          </h3>
          <p className="text-xs text-gray-500 mb-3">Waiting for client action</p>
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

        {/* Overdue Invoices - URGENT */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            🔴 Overdue ({workQueue?.overdue?.length || 0})
          </h3>
          <p className="text-xs text-gray-500 mb-3">Past due date - urgent action needed</p>
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