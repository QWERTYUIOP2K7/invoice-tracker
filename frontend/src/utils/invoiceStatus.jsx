export const STATUS_LABELS = {
  'Performa Invoice Generated': 'Performa Invoice Generated',
  'Performa Invoice Sent': 'Performa Invoice Sent',
  'Approved': 'Approved',
  'Sent': 'Sent',
  'Paid': 'Paid',
  'Pending': 'Pending',
  'Overdue': 'Overdue',
};

export const getStatusColor = (status) => {
  const colors = {
    'Performa Invoice Generated': 'bg-blue-100 text-blue-800',
    'Performa Invoice Sent': 'bg-indigo-100 text-indigo-800',
    'Approved': 'bg-purple-100 text-purple-800',
    'Sent': 'bg-cyan-100 text-cyan-800',
    'Paid': 'bg-green-100 text-green-800',
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Overdue': 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getStatusBadge = (status) => {
  return `<span class="${getStatusColor(status)} px-3 py-1 text-xs font-medium rounded">${STATUS_LABELS[status] || status}</span>`;
};