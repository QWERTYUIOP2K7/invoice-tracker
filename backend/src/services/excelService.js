const ExcelJS = require('exceljs');

const exportInvoicesToExcel = async (invoices) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invoices');

    // Define columns
    worksheet.columns = [
      { header: 'Invoice Number', key: 'invoiceNumber', width: 18 },
      { header: 'Client', key: 'clientName', width: 25 },
      { header: 'Client Code', key: 'clientCode', width: 12 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Invoice Date', key: 'invoiceDate', width: 15 },
      { header: 'Due Date', key: 'dueDate', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Pending Reason', key: 'pendingReason', width: 20 },
      { header: 'Created By', key: 'createdBy', width: 18 },
    ];

    // Style header
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' },
    };

    worksheet.getRow(1).font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 12,
    };

    // Add data rows
    invoices.forEach((invoice) => {
      const row = worksheet.addRow({
        invoiceNumber: invoice.invoiceNumber || 'N/A',
        clientName: invoice.clientId?.companyName || 'N/A',
        clientCode: invoice.clientId?.clientCode || 'N/A',
        amount: invoice.amount || 0,
        invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-IN') : 'N/A',
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'N/A',
        status: invoice.status || 'N/A',
        pendingReason: invoice.pendingReason || '—',
        createdBy: invoice.createdBy?.name || 'System',
      });

      // Format amount
      row.getCell('amount').numFmt = '₹#,##0.00';

      // Color status
      const statusCell = row.getCell('status');
      const statusColors = {
        'Performa Invoice Generated': 'FFC0C0C0',
        'Performa Invoice Sent': 'FF87CEEB',
        'Approved': 'FF4169E1',
        'Sent': 'FFA9A9FF',
        'Paid': 'FF90EE90',
        'Pending': 'FFFFFF00',
        'Overdue': 'FFFF6347',
      };
      
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: statusColors[invoice.status] || 'FFFFFFFF' },
      };
    });

    // Add summary
    const summaryRow = worksheet.addRow({});
    summaryRow.getCell(1).value = 'SUMMARY';
    summaryRow.getCell(1).font = { bold: true, size: 11 };

    const totalRow = worksheet.addRow({});
    totalRow.getCell(1).value = 'Total Amount:';
    totalRow.getCell(1).font = { bold: true };
    
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    totalRow.getCell(4).value = totalAmount;
    totalRow.getCell(4).numFmt = '₹#,##0.00';
    totalRow.getCell(4).font = { bold: true };

    // Freeze header
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    return workbook;
  } catch (error) {
    console.error('ExcelJS error:', error);
    throw new Error('Failed to generate Excel: ' + error.message);
  }
};

module.exports = {
  exportInvoicesToExcel,
};