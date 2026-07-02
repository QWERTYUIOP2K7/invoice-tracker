const mongoose = require('mongoose');

const invoiceHistorySchema = new mongoose.Schema(
  {
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'status_changed', 'pdf_uploaded', 'pdf_replaced', 'remarks_updated'],
      required: true,
    },
    oldValue: {
      // Store previous value for updates
      type: mongoose.Schema.Types.Mixed,
    },
    newValue: {
      // Store new value after update
      type: mongoose.Schema.Types.Mixed,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fieldChanged: {
      // Which field was changed: status, amount, dueDate, etc.
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false } // We manage timestamp manually
);

invoiceHistorySchema.index({ invoiceId: 1, timestamp: -1 });

module.exports = mongoose.model('InvoiceHistory', invoiceHistorySchema);