const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/permissions');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: [ROLES.ADMIN, ROLES.FINANCE, ROLES.CLIENT],
      required: [true, 'Please specify a role'],
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      // Required for FINANCE and CLIENT roles
      validate: {
        validator: function (value) {
          // Admin doesn't need clientId, others do
          if (this.role === ROLES.ADMIN) return true;
          return value !== undefined && value !== null;
        },
        message: 'clientId is required for non-admin users',
      },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending_approval'],
      default: 'active',
    },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Index for faster lookups
userSchema.index({ email: 1 });
userSchema.index({ clientId: 1 });

module.exports = mongoose.model('User', userSchema);