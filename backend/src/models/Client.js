const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Please provide a company name'],
      unique: true,
      trim: true,
    },
    contactEmail: {
      type: String,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
      // No longer required
    },
    contactPhone: {
      type: String,
      // Optional
    },
    location: {
      type: String,
      required: [true, 'Please provide a location'],
      trim: true,
    },
    address: {
      type: String,
      // Optional - full address
    },
    gstin: {
      type: String,
      // GST Identification Number
      trim: true,
    },
    panNumber: {
      type: String,
      // PAN for Indian tax compliance
      trim: true,
    },
    stateCode: {
      type: String,
      // State code for GST (e.g., "09" for UP)
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

clientSchema.index({ companyName: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ gstin: 1 });

module.exports = mongoose.model('Client', clientSchema);