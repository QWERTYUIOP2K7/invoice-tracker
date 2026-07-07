import { formatCurrency } from '../utils/currency';

export default function MyClientsTable({ clients }) {
  return (
    <div className="bg-white border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">My Clients</h2>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Client Code</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Company</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Location</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Outstanding</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Pending</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Last Invoice</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No clients assigned
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {client.clientCode}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {client.companyName}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {client.location}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {formatCurrency(client.outstandingAmount)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium">
                      {client.pendingInvoices}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {client.lastInvoiceDate
                      ? new Date(client.lastInvoiceDate).toLocaleDateString('en-IN')
                      : 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}