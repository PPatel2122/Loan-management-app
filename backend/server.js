const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const dns = require('dns');

// Prefer IPv4 resolution to prevent ENETUNREACH errors on environments like Render that lack IPv6 outbound routing
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

require('./config/env');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Load Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/loans', require('./routes/loanRoutes'));
app.use('/api/installments', require('./routes/installmentRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));


// Start cron jobs
require('./services/cronJobs');

app.get('/', (req, res) => {
  res.send('Loan Management API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
