export const formatCurrency = (amount) => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const formatAmount = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  return formatCurrency(amount);
};