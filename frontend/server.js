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
const profileRoutes  = require('./routes/profile');
const reportRoutes   = require('./routes/reports');

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
app.use('/api/profile',   profileRoutes);
app.use('/api/reports',   reportRoutes);

const getSystemPrompt = () => {
  // IST = UTC + 5 hours 30 minutes
  // We manually shift UTC ms by exactly 330 minutes
  const utcNow = new Date(); // server UTC time
  const istOffsetMs = 330 * 60 * 1000; // 5h30m in milliseconds
  const istNow = new Date(utcNow.getTime() + istOffsetMs);

  // Use getUTC* on the IST-shifted date object
  const D = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const M = ['January','February','March','April','May','June',
             'July','August','September','October','November','December'];

  const dayName   = D[istNow.getUTCDay()];
  const monthName = M[istNow.getUTCMonth()];
  const dd        = istNow.getUTCDate();
  const yyyy      = istNow.getUTCFullYear();
  const hh24      = istNow.getUTCHours();
  const mm        = String(istNow.getUTCMinutes()).padStart(2, '0');
  const ampm      = hh24 >= 12 ? 'PM' : 'AM';
  const hh12      = hh24 % 12 || 12;

  const dateStr = `${dayName}, ${dd} ${monthName} ${yyyy}`;
  const timeStr = `${hh12}:${mm} ${ampm} IST`;

  return `You are a warm, caring AI companion for an Alzheimer's support platform.
Your role is to chat naturally and helpfully with users who may be patients, caregivers, or family members.

Today's date is ${dateStr} and the current time is ${timeStr}.

IMPORTANT: Always use this exact date and time when the user asks about the current time or date. Do not guess or use any other time.

Guidelines:
- Be empathetic, patient, and supportive at all times
- Answer any question the user asks - general knowledge, health info, daily life, storytelling, recipes, etc.
- Keep responses concise and easy to read (2-4 sentences for most replies, longer only when needed)
- Use simple, clear language - avoid jargon
- When users seem distressed, acknowledge their feelings first before offering information
- Gently remind users to consult healthcare professionals for medical decisions
- Be encouraging and positive without being dismissive of real concerns
- If asked to tell a story, share a short comforting one
- You know the user may have memory challenges, so be patient if they repeat themselves`;
};

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid request: messages array is required' });
    }

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
          ...messages
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

    const data = await response.json();
    const replyText = data.choices[0]?.message?.content || '';

    console.log('AI chat response sent successfully');
    res.json({ reply: replyText });

  } catch (error) {
    console.error('Chat proxy error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!', status: 'SUCCESS' });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
