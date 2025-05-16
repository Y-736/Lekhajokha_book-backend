const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const apicache = require('apicache');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./Routes/authRoutes');
const retailerRoutes = require('./Routes/retailerRoutes');
const customerRoutes = require('./Routes/customerRoutes');
const transactionRoutes = require('./Routes/transactionRoutes');

const app = express();

// Initialize cache
const cache = apicache.middleware;

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  }
});

// Middleware
app.use(cors({
  origin: ["https://main.dysyb2943zsw4.amplifyapp.com/"]
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/retailer', retailerRoutes);
app.use('/api', customerRoutes);
app.use('/api', transactionRoutes);

// Health check (no caching or rate limiting)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});