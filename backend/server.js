const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { pool } = require('./config/database');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({ 
      message: 'Database connected successfully!',
      currentTime: result.rows[0].current_time
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Basic route for testing
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/debug-db', async (req, res) => {
  try {
    // Test each table individually
    const tests = [];
    
    const tables = ['users', 'memories', 'journals', 'reminders', 'user_locations', 'user_sessions', 'user_activities'];
    
    for (const table of tables) {
      try {
        await pool.query(`SELECT 1 FROM ${table} LIMIT 1`);
        tests.push({ table, status: 'OK' });
      } catch (error) {
        tests.push({ table, status: 'MISSING', error: error.message });
      }
    }
    
    res.json({ tables: tests });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Test database connection on startup
  pool.query('SELECT NOW()')
    .then(() => {
      console.log('Connected to PostgreSQL database');
    })
    .catch(err => {
      console.error('Database connection failed:', err.message);
    });

});
