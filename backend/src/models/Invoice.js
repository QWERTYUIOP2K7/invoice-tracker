const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, 'Please provide an invoice number'],
      unique: true,
      trim: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Invoice must belong to a client'],
      index: true,
    },
    invoiceMonth: {
      type: String,
      required: [true, 'Please specify invoice month'],
      // Format: YYYY-MM
    },
    amount: {
      type: Number,
      required: [true, 'Please provide invoice amount'],
      min: [0, 'Amount cannot be negative'],
    },
    invoiceDate: {
      type: Date,
      required: [true, 'Please provide invoice date'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Please provide due date'],
    },
    status: {
      type: String,
      enum: ['Draft', 'Generated', 'Approved', 'Sent', 'Paid', 'Pending', 'Overdue'],
      default: 'Draft',
    },
    pendingReason: {
      type: String,
      enum: [
        'Client approval pending',
        'PO not received',
        'Payment processing',
        'Document verification pending',
        'Budget issue',
        'Other',
      ],
      // Only required if status is Pending
    },
    pdfUrl: {
      type: String, // Path or URL to the PDF file
    },
    remarks: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Validate that pending invoices have a reason
invoiceSchema.pre('save', function (next) {
  if (this.status === 'Pending' && !this.pendingReason) {
    return next(new Error('Pending reason is required when status is Pending'));
  }
  next();
});

invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ clientId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);