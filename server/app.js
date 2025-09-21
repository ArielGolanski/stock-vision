const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const customEnv = require('custom-env');

const app = express();

// Load environment
const environment = process.env.NODE_ENV || 'default';
customEnv.env(environment, './config');

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.CONNECTION_STRING)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
const userRoutes = require('./routes/user');
app.use('/api/users', userRoutes);

const stocksRoutes = require('./routes/stocks');
app.use('/api/stocks', stocksRoutes);

// server/app.js (snippet to add)
const stockHistoryRoutes = require('./routes/stockHistory');
app.use('/api/stock-history', stockHistoryRoutes);


// Optional: root route to check server
app.get('/', (req, res) => {
  res.send('Server is running 🚀');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
