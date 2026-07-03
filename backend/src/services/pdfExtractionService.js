const pdf = require('pdf-parse');

const extractInvoiceData = async (pdfBuffer) => {
  try {
    console.log('Starting PDF parsing...');
    const data = await pdf(pdfBuffer);
    console.log('PDF parsed successfully');
    const text = data.text;

    console.log('Text length:', text.length);

    const extracted = {
      invoiceNumber: extractInvoiceNumber(text),
      invoiceDate: extractInvoiceDate(text),
      dueDate: extractDueDate(text),
      amount: extractAmount(text),
      clientName: extractClientName(text),
      gstin: extractGSTIN(text),
      poNumber: extractPONumber(text),
      rawText: text,
    };

    return extracted;
  } catch (err) {
    console.error('PDF extraction error:', err.message);
    throw new Error(`Failed to extract from PDF: ${err.message}`);
  }
};

const extractInvoiceNumber = (text) => {
  const patterns = [
    /invoice\s*(?:no|number|#)[.\s:]*([A-Z0-9\/-]+)/i,
    /inv\s*(?:no|#)[.\s:]*([A-Z0-9\/-]+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
};

const extractInvoiceDate = (text) => {
  const patterns = [
    /invoice\s*date[.\s:]*(\d{1,2}[-\/]\w{3,9}[-\/]\d{2,4})/i,
    /dated[.\s:]*(\d{1,2}[-\/]\w{3,9}[-\/]\d{2,4})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const date = parseDate(match[1]);
      if (date) return date.toISOString().split('T')[0];
    }
  }
  return null;
};

const extractDueDate = (text) => {
  const patterns = [
    /due\s*date[.\s:]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
    /due\s*(?:in|within)?[.\s:]*(\d+)\s*days?/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[1] && !isNaN(parseInt(match[1]))) {
        const days = parseInt(match[1]);
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
      } else {
        const date = parseDate(match[1]);
        if (date) return date.toISOString().split('T')[0];
      }
    }
  }
  return null;
};

const extractAmount = (text) => {
  const patterns = [
    /total\s*₹?\s*([0-9,]+\.?\d{0,2})/i,
    /₹\s*([0-9,]+\.?\d{0,2})\s*only/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amountStr = match[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) return amount;
    }
  }
  return null;
};

const extractClientName = (text) => {
  const pattern = /(?:bill\s*to|buyer|consignee)[.\s:]*\n?\s*([A-Z][A-Z\s&,.-]{5,})/i;
  const match = text.match(pattern);
  return match ? match[1].trim() : null;
};

const extractGSTIN = (text) => {
  const pattern = /GSTIN[\/:\s]*([0-9]{2}[A-Z]{2}[A-Z0-9]{5}[0-9]{1}[A-Z]{1}[0-9]{1}[A-Z]{1}[0-9]{1})/i;
  const match = text.match(pattern);
  return match ? match[1].trim() : null;
};

const extractPONumber = (text) => {
  const pattern = /(?:PO|Purchase Order)[:\s]*([A-Z0-9\-]+)/i;
  const match = text.match(pattern);
  return match ? match[1].trim() : null;
};

const parseDate = (dateStr) => {
  if (!dateStr) return null;

  const formats = [
    {
      regex: /^(\d{1,2})-(\w{3})-(\d{2})$/,
      parse: (parts) => {
        const day = parts[1];
        const month = getMonthNumber(parts[2]);
        let year = parseInt(parts[3], 10);
        year = year < 50 ? 2000 + year : 1900 + year;
        return new Date(year, month - 1, day);
      },
    },
    {
      regex: /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/,
      parse: (parts) => new Date(parts[3], parts[2] - 1, parts[1]),
    },
  ];

  for (const format of formats) {
    const match = dateStr.match(format.regex);
    if (match) {
      const date = format.parse(match);
      if (!isNaN(date.getTime())) return date;
    }
  }
  return null;
};

const getMonthNumber = (monthStr) => {
  const months = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  return months[monthStr.toLowerCase().slice(0, 3)] || 0;
};

module.exports = { extractInvoiceData };

//pdf parse is still not working, come tomorrow and fix thisparse pdf shit, if you feel to keep it manually, the data entry shit, make it manual only, ye ocr wali cheez ek alag branch me hai github pe soo it wil not be a problem