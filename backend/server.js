const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
require('dotenv').config();

const authRoutes     = require('./routes/auth');
const memoryRoutes   = require('./routes/memories');
const journalRoutes  = require('./routes/journals');
const reminderRoutes = require('./routes/reminders');
const locationRoutes = require('./routes/locations');
const profileRoutes  = require('./routes/profile');
const reportRoutes   = require('./routes/reports');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ── CORS — restrict to your Vercel domain (and localhost for dev) ─────────────
const ALLOWED_ORIGINS = [
  'https://alzheimer-support.vercel.app',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (curl, mobile apps)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Simple in-memory rate limiter (no extra dependency) ───────────────────────
const rateLimitStore = new Map();

function rateLimit(maxRequests, windowMs) {
  return function (req, res, next) {
    const key  = req.ip + ':' + req.path;
    const now  = Date.now();
    const data = rateLimitStore.get(key) || { count: 0, start: now };

    if (now - data.start > windowMs) {
      data.count = 0;
      data.start = now;
    }

    data.count++;
    rateLimitStore.set(key, data);

    if (data.count > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please wait a moment and try again.',
        retryAfter: Math.ceil((data.start + windowMs - now) / 1000)
      });
    }
    next();
  };
}

// Clean up rate limit store every 10 minutes to prevent memory bloat
setInterval(function () {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.start > 15 * 60 * 1000) rateLimitStore.delete(key);
  }
}, 10 * 60 * 1000);

// Apply rate limits
app.use('/api/auth/signin',          rateLimit(10,  15 * 60 * 1000)); // 10/15min
app.use('/api/auth/signup',          rateLimit(5,   60 * 60 * 1000)); // 5/hour
app.use('/api/auth/forgot-password', rateLimit(3,   60 * 60 * 1000)); // 3/hour
app.use('/api/chat',                 rateLimit(30,  60 * 1000));       // 30/min

// ── Input validation middleware ───────────────────────────────────────────────
app.use(function (req, res, next) {
  // Sanitise string fields — strip null bytes
  if (req.body && typeof req.body === 'object') {
    JSON.stringify(req.body, function (key, value) {
      if (typeof value === 'string') req.body[key] = value.replace(/\0/g, '');
      return value;
    });
  }
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/memories',  memoryRoutes);
app.use('/api/journals',  journalRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/profile',   profileRoutes);
app.use('/api/reports',   reportRoutes);

// ── AI Chat endpoint ──────────────────────────────────────────────────────────
const getSystemPrompt = () => {
  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
  return `You are a warm, caring AI companion for an Alzheimer's support platform.
Your role is to chat naturally and helpfully with users who may be patients, caregivers, or family members.

Today's date is ${dateStr} and the current time is ${timeStr}.

Guidelines:
- Be empathetic, patient, and supportive at all times
- Answer any question the user asks — general knowledge, health info, daily life, storytelling, recipes, etc.
- Keep responses concise and easy to read (2–4 sentences for most replies, longer only when needed)
- Use simple, clear language — avoid jargon
- When users seem distressed, acknowledge their feelings first before offering information
- Gently remind users to consult healthcare professionals for medical decisions
- Be encouraging and positive without being dismissive of real concerns
- If asked to tell a story, share a short comforting one
- You know the user may have memory challenges, so be patient if they repeat themselves
- Never claim to be a doctor or give specific medical diagnoses`;
};

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid request: messages array is required' });
    }

    // Limit message history to last 20 to avoid huge payloads
    const trimmedMessages = messages.slice(-20);

    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY not set');
      return res.status(500).json({ error: 'AI service is not configured' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: getSystemPrompt() },
          ...trimmedMessages
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API error:', JSON.stringify(errorData));
      return res.status(response.status).json({
        error: errorData.error?.message || 'AI service error'
      });
    }

    const data      = await response.json();
    const replyText = data.choices[0]?.message?.content || '';
    res.json({ reply: replyText });

  } catch (error) {
    console.error('Chat proxy error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Health endpoint — includes DB check ──────────────────────────────────────
app.get('/api/health', async (req, res) => {
  let dbStatus = 'unknown';
  try {
    const { query } = require('./config/database');
    await query('SELECT 1');
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = 'error: ' + e.message;
  }
  res.json({
    status:    'OK',
    db:        dbStatus,
    timestamp: new Date().toISOString(),
    uptime:    Math.floor(process.uptime()) + 's'
  });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!', status: 'SUCCESS' });
});

// ── Error suppression in production ─────────────────────────────────────────
app.use(function (err, req, res, next) {
  console.error('Unhandled error:', err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(500).json({
    error: isProd ? 'Internal server error' : err.message
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
