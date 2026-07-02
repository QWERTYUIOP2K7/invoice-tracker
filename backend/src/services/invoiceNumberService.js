const Invoice = require('../models/Invoice');

const generateInvoiceNumber = async (prefix, clientId = null) => {
  /**
   * Generates invoice number in format: PREFIX/FY/SEQUENCE
   * Example: INV/26-27/0001 or EsolG/26-27/0654
   * FY = Financial Year (current year and next year)
   */

  // Get current financial year (Apr-Mar in India, or use calendar year)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Financial year: April-March
  let fy;
  if (currentMonth >= 4) {
    fy = `${currentYear % 100}-${(currentYear + 1) % 100}`; // 26-27
  } else {
    fy = `${(currentYear - 1) % 100}-${currentYear % 100}`; // 25-26
  }

  // Find the highest sequence number for this prefix and FY
  const pattern = `${prefix}/${fy}/`;
  const lastInvoice = await Invoice.findOne({
    invoiceNumber: { $regex: `^${pattern.replace(/\//g, '\\/')}`, $options: 'i' },
  })
    .sort({ createdAt: -1 })
    .select('invoiceNumber');

  let sequence = 1;
  if (lastInvoice) {
    const lastNumber = lastInvoice.invoiceNumber;
    const parts = lastNumber.split('/');
    const lastSeq = parseInt(parts[2], 10);
    sequence = lastSeq + 1;
  }

  // Format: PREFIX/FY/SEQUENCE (zero-padded to 4 digits)
  const sequenceStr = sequence.toString().padStart(4, '0');
  const invoiceNumber = `${prefix}/${fy}/${sequenceStr}`;

  return invoiceNumber;
};

module.exports = { generateInvoiceNumber };