const Client = require('../models/Client');

const generateClientCode = async () => {
  /**
   * Generates client code in format: CL001, CL002, CL003, etc.
   */
  
  try {
    // Find the highest sequence number
    const lastClient = await Client.findOne({})
      .sort({ clientCode: -1 })
      .select('clientCode');

    let sequence = 1;
    if (lastClient && lastClient.clientCode) {
      // Extract number from clientCode (e.g., "CL001" → 1)
      const match = lastClient.clientCode.match(/CL(\d+)/);
      if (match) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }

    // Format: CL + zero-padded number (CL001, CL002, etc.)
    const clientCode = `CL${sequence.toString().padStart(3, '0')}`;

    return clientCode;
  } catch (err) {
    console.error('Error generating client code:', err);
    throw new Error(`Failed to generate client code: ${err.message}`);
  }
};

module.exports = { generateClientCode };