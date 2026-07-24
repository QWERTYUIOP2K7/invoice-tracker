export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount || 0);
};

export const formatAmount = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  return formatCurrency(amount);
};