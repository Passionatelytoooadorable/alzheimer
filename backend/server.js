const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes     = require('./routes/auth');
const memoryRoutes   = require('./routes/memories');
const journalRoutes  = require('./routes/journals');
const reminderRoutes = require('./routes/reminders');
const locationRoutes = require('./routes/locations');
const profileRoutes  = require('./routes/profile');   // NEW
const reportRoutes   = require('./routes/reports');   // NEW

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',      authRoutes);
app.use('/api/memories',  memoryRoutes);
app.use('/api/journals',  journalRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/profile',   profileRoutes);  // NEW
app.use('/api/reports',   reportRoutes);   // NEW

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/test', (req, res) => {
  res.json({ message: '✅ Backend is working!', status: 'SUCCESS' });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
