const express = require('express');
const cors = require('cors');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/pdfs', require('./routes/pdfRoutes'));
// NEW - Dashboard routes (will create next)
// app.use('/api/dashboard', require('./routes/dashboardRoutes'));
// NEW - User management routes (will create next)
// app.use('/api/users', require('./routes/userRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;