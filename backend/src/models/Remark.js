const mongoose = require('mongoose');
const { ROLES } = require('../config/permissions');

const remarkSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: [true, 'Please provide a remark message'],
      trim: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userRole: {
      type: String,
      enum: [ROLES.ADMIN, ROLES.FINANCE, ROLES.CLIENT],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false } // Only createdAt, no updatedAt for append-only
);

remarkSchema.index({ invoiceId: 1, createdAt: -1 });
remarkSchema.index({ clientId: 1 });

module.exports = mongoose.model('Remark', remarkSchema);