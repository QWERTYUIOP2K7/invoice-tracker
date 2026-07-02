const InvoiceHistory = require('../models/InvoiceHistory');

const recordHistory = async (invoiceId, action, changedBy, fieldChanged = null, oldValue = null, newValue = null) => {
  try {
    await InvoiceHistory.create({
      invoiceId,
      action,
      changedBy,
      fieldChanged,
      oldValue,
      newValue,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('Error recording invoice history:', err);
    // Don't throw — history recording shouldn't break the main operation
  }
};

module.exports = { recordHistory };