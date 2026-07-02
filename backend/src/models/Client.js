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
      required: [true, 'Please provide a contact email'],
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    location: {
      type: String,
      required: [true, 'Please provide a location'],
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

module.exports = mongoose.model('Client', clientSchema);