import { useNavigate } from 'react-router-dom';

export default function WorkQueue({ workQueue }) {
  const navigate = useNavigate();

  if (!workQueue) {
    return <div className="bg-white border border-gray-200 p-6 text-gray-500">Loading...</div>;
  }

  const Section = ({ title, icon, items, color }) => (
    <div className="p-6 border-b border-gray-200 last:border-b-0">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        {icon} {title} ({items?.length || 0})
      </h3>
      <div className="space-y-2">
        {items && items.length > 0 ? (
          items.map((inv) => (
            <div
              key={inv._id}
              onClick={() => navigate(`/invoice/detail/${inv._id}`)}
              className={`p-3 border cursor-pointer hover:shadow-md ${color}`}
            >
              <div className="flex justify-between">
                <span className="font-medium">{inv.invoiceNumber}</span>
                <span className="text-xs text-gray-600">₹{(inv.amount || 0).toLocaleString('en-IN')}</span>
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

      <Section title="Performa Invoice(PI) Generated" icon="" items={workQueue.draft} color="bg-gray-50 border-gray-200" />
      <Section title="Performa Invoice(PI) Sent" icon="" items={workQueue.generated} color="bg-blue-50 border-blue-200" />
      <Section title="Approved" icon="" items={workQueue.approved} color="bg-indigo-50 border-indigo-200" />
      <Section title="Invoice Sent" icon="" items={workQueue.sent} color="bg-purple-50 border-purple-200" />
      <Section title="Paid" icon="" items={workQueue.paid} color="bg-green-50 border-green-200" />
      <Section title="Pending" icon="" items={workQueue.pending} color="bg-yellow-50 border-yellow-200" />
      <Section title="Overdue" icon="" items={workQueue.overdue} color="bg-red-50 border-red-200" />
    </div>
  );
}