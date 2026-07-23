const VALID_TRANSITIONS = {
  'Performa Invoice Generated': ['Performa Invoice Sent'],
  'Performa Invoice Sent': ['Approved'],
  'Approved': ['Sent'],
  'Sent': ['Paid', 'Pending', 'Overdue'],
  'Paid': [],
  'Pending': ['Sent', 'Paid'],
  'Overdue': ['Paid', 'Pending'],
};

const PENDING_REASONS = [
  'Client approval pending',
  'PO not received',
  'Payment processing',
  'Document verification pending',
  'Budget issue',
  'Other',
];

const validateStatusTransition = (currentStatus, newStatus) => {
  if (currentStatus === newStatus) {
    return { valid: false, message: 'New status must be different from current status' };
  }

  const allowedTransitions = VALID_TRANSITIONS[currentStatus];
  if (!allowedTransitions) {
    return { valid: false, message: `Invalid current status: ${currentStatus}` };
  }

  if (!allowedTransitions.includes(newStatus)) {
    return { 
      valid: false, 
      message: `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowedTransitions.join(', ')}` 
    };
  }

  return { valid: true };
};

const validatePendingReason = (reason) => {
  if (!PENDING_REASONS.includes(reason)) {
    return { valid: false, message: `Invalid pending reason. Allowed: ${PENDING_REASONS.join(', ')}` };
  }
  return { valid: true };
};

module.exports = {
  validateStatusTransition,
  validatePendingReason,
  PENDING_REASONS,
  VALID_TRANSITIONS,
};