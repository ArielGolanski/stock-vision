const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const customEnv = require('custom-env');

const app = express();

// Load environment (put creds in .env, not code)
const environment = process.env.NODE_ENV || 'default';
customEnv.env(environment, './config');

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Mongo
const connectionString = process.env.ATLAS_CONNECTION_STRING || process.env.CONNECTION_STRING;
// const connectionString = process.env.ATLAS_CONNECTION_STRING;
console.log(connectionString);
// const connectionString = process.env.CONNECTION_STRING;
mongoose.connect(connectionString)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
const userRoutes = require('./routes/user');
app.use('/api/users', userRoutes);

const commentRoutes = require('./routes/comment');
app.use('/api/comments', commentRoutes);

const stocksRoutes = require('./routes/stocks');
app.use('/api/stocks', stocksRoutes);

const stockHistoryRoutes = require('./routes/stockHistory');
app.use('/api/stock-history', stockHistoryRoutes);

const hypeRoutes = require('./routes/hype');
app.use('/api', hypeRoutes);

const accuracyRoutes = require('./routes/accuracy');
app.use('/api/accuracy', accuracyRoutes);

const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);

const competitorPredictionsRoutes = require('./routes/competitorPredictions');
app.use('/api/competitor-predictions', competitorPredictionsRoutes);

// Root check
app.get('/', (_, res) => res.send('Server is running 🚀'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
