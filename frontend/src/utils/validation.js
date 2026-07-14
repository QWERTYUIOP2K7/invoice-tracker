export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validateAmount = (amount) => {
  return !isNaN(amount) && amount > 0;
};

export const validateDate = (date) => {
  return !isNaN(new Date(date).getTime());
};

export const validateInvoiceForm = (formData) => {
  const errors = {};

  if (!formData.clientId) errors.clientId = 'Client is required';
  if (!formData.invoicePrefix) errors.invoicePrefix = 'Invoice prefix is required';
  if (!formData.amount || !validateAmount(formData.amount)) errors.amount = 'Valid amount required';
  if (!formData.invoiceDate || !validateDate(formData.invoiceDate)) errors.invoiceDate = 'Valid date required';
  if (!formData.dueDate || !validateDate(formData.dueDate)) errors.dueDate = 'Valid date required';

  if (new Date(formData.invoiceDate) > new Date(formData.dueDate)) {
    errors.dueDate = 'Due date must be after invoice date';
  }

  return errors;
};