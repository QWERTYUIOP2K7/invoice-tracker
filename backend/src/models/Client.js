const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    clientCode: {
      type: String,
      unique: true,
      required: [true, 'Client code is required'],
      trim: true,
      // Format: CL001, CL002, etc.
    },
    companyName: {
      type: String,
      required: [true, 'Please provide a company name'],
      trim: true,
      // No longer unique - multiple clients can have same company name
    },
    contactEmail: {
      type: String,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    contactPhone: {
      type: String,
    },
    location: {
      type: String,
      required: [true, 'Please provide a location'],
      trim: true,
    },
    address: {
      type: String,
    },
    gstin: {
      type: String,
      trim: true,
    },
    panNumber: {
      type: String,
      trim: true,
    },
    stateCode: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    invoiceCount: {
      type: Number,
      default: 0,
    },
    outstandingAmount: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

clientSchema.index({ clientCode: 1 });
clientSchema.index({ companyName: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ gstin: 1 });

module.exports = mongoose.model('Client', clientSchema);