const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, 'Please provide line item description'],
    },
    hsnSacCode: {
      type: String,
      // HSN/SAC code for tax classification
    },
    quantity: {
      type: Number,
      required: [true, 'Please provide quantity'],
      min: 0,
    },
    ratePerUnit: {
      type: Number,
      required: [true, 'Please provide rate per unit'],
      min: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    amount: {
      type: Number,
      required: [true, 'Please provide line item amount'],
      min: 0,
    },
  },
  { _id: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, 'Please provide an invoice number'],
      unique: true,
      trim: true,
    },
    invoicePrefix: {
      type: String,
      required: [true, 'Please provide invoice prefix'],
      // e.g., "INV", "EsolG", "INVOICE"
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Invoice must belong to a client'],
      index: true,
    },
    invoiceMonth: {
      type: String,
      // Format: YYYY-MM, optional if different from invoice date
    },
    billingMonth: {
      type: String,
      // Format: YYYY-MM, the month for which service was provided
    },
    invoiceDate: {
      type: Date,
      required: [true, 'Please provide invoice date'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Please provide due date'],
    },
    poNumber: {
      type: String,
      // Purchase Order number
    },
    paymentTerms: {
      type: Number,
      // Payment terms in days (e.g., 30)
    },
    deliveryNoteNumber: {
      type: String,
      // Delivery note reference
    },
    
    // Line items (flexible - can use this OR direct amount)
    lineItems: [lineItemSchema],
    
    // Total amount (calculated from lineItems or entered directly)
    amount: {
      type: Number,
      required: [true, 'Please provide invoice amount'],
      min: [0, 'Amount cannot be negative'],
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
      type: String,
      // Path or URL to the PDF file
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

invoiceSchema.index({ clientId: 1, status: 1 });
invoiceSchema.index({ clientId: 1, invoiceDate: -1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);