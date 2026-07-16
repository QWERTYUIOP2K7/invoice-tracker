const express = require('express');
const cors = require('cors');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/pdfs', require('./routes/pdfRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes')); // NEW
app.use('/api/remarks', require('./routes/remarkRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;