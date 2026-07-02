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
// More routes will be mounted here in future phases:
// app.use('/api/users', require('./routes/userRoutes'));
// app.use('/api/remarks', require('./routes/remarkRoutes'));
// app.use('/api/dashboard', require('./routes/dashboardRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;