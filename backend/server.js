const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Middleware
app.use(cors());
app.use(express.json());

// TEST ROUTE
app.get('/api/test', (req, res) => {
  res.json({ 
    message: '✅ Backend is working!', 
    timestamp: new Date().toISOString()
  });
});

// DATABASE TEST
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time');
    res.json({ 
      database: 'Connected ✅',
      time: result.rows[0].time 
    });
  } catch (error) {
    res.json({ 
      database: 'Failed ❌',
      error: error.message 
    });
  }
});

// HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    environment: process.env.NODE_ENV || 'development'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
