const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const memoryRoutes = require('./routes/memories');
const journalRoutes = require('./routes/journals');
const reminderRoutes = require('./routes/reminders');
const locationRoutes = require('./routes/locations');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/locations', locationRoutes);

// Test routes
app.get('/api/test', (req, res) => {
  res.json({ 
    message: '✅ Backend is working!', 
    timestamp: new Date().toISOString(),
    status: 'SUCCESS'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
