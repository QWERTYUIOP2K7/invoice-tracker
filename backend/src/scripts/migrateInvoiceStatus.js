const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
require('dotenv').config();

const migrateInvoiceStatus = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Migrate Draft -> Performa Invoice Generated
    const draftResult = await Invoice.updateMany(
      { status: 'Draft' },
      { $set: { status: 'Performa Invoice Generated' } }
    );
    console.log(`Migrated ${draftResult.modifiedCount} invoices from Draft to Performa Invoice Generated`);

    // Migrate Generated -> Performa Invoice Sent
    const generatedResult = await Invoice.updateMany(
      { status: 'Generated' },
      { $set: { status: 'Performa Invoice Sent' } }
    );
    console.log(`Migrated ${generatedResult.modifiedCount} invoices from Generated to Performa Invoice Sent`);

    // Migrate PI Generated -> Performa Invoice Generated (if any)
    const piGenResult = await Invoice.updateMany(
      { status: 'PI Generated' },
      { $set: { status: 'Performa Invoice Generated' } }
    );
    console.log(`Migrated ${piGenResult.modifiedCount} invoices from PI Generated to Performa Invoice Generated`);

    // Migrate PI Sent -> Performa Invoice Sent (if any)
    const piSentResult = await Invoice.updateMany(
      { status: 'PI Sent' },
      { $set: { status: 'Performa Invoice Sent' } }
    );
    console.log(`Migrated ${piSentResult.modifiedCount} invoices from PI Sent to Performa Invoice Sent`);

    console.log('Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
};

migrateInvoiceStatus();