<div align="center">

# 🧠 MindBridge - An Intelligent Alzheimer's Support Platform
**A full-stack, AI-powered Progressive Web App for Alzheimer's patients and their caregivers.**

</div>

---

## 🗒️ About the Project

MindBridge is a production-deployed, full-stack web application built as a Final Year Engineering Project. It addresses the fragmented digital care landscape for Alzheimer's patients and caregivers by bringing every essential tool — AI analysis, journaling, reminders, location safety, cognitive games, and caregiver monitoring — into a single accessible platform.

**Two user roles:**
| Role | Primary Use |
|------|-------------|
| 🧑‍⚕️ **Patient** | Journal, reminders, AI companion, memory vault, location sharing |
| 👩‍👦 **Caregiver** | Monitor patients remotely, live map, mood analytics, messaging |

---

## ✨ Features

- 🤖 **AI Scan Report Analysis** — paste any medical report; get a plain-language summary (`claude-sonnet-4-20250514`)
- 📓 **Daily Journal** — mood tracking (1–10), 30-day trend chart, keyword search, AI weekly insights
- ⏰ **Smart Reminders** — medications, appointments, 30-day compliance heatmap
- 📍 **GPS Location Tracker** — real-time map, geofence safe zones, Haversine breach detection, instant caregiver alerts
- 🤝 **AI Companion** — chat, text-to-speech, voice input, 3 cognitive games
- 🗂️ **Memory Vault** — preserve personal memories with categories, search, and gallery view
- 👩‍💻 **Caregiver Dashboard** — live patient map, mood chart, activity feed, compliance view, in-app messaging
- 📱 **PWA** — installable on any device, offline-capable, home screen shortcuts
- ♿ **Accessibility Toolbar** — font size, high contrast, dyslexia-friendly font on every page

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+), Leaflet.js, Chart.js |
| **Backend** | Node.js, Express.js, JWT, bcrypt, Nodemailer |
| **Database** | Neon PostgreSQL (serverless) — 9 relational tables |
| **AI Model** | `claude-sonnet-4-20250514` by Anthropic |
| **Auth** | JWT in httpOnly cookies + bcrypt (10 rounds) |
| **Hosting** | Vercel (frontend) · Render (backend) · GitHub (CI/CD) |

---
## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│          HTML5 · CSS3 · Vanilla JS · Leaflet · Chart.js         │
│                 Service Worker (PWA / Offline)                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │  HTTPS + credentials: 'include'
                           │  (JWT in httpOnly cookie)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL EDGE CDN (Frontend)                   │
│          Static files served globally · Auto-HTTPS              │
│          Auto-deploy on GitHub push to main branch              │
└──────────────────────────┬──────────────────────────────────────┘
                           │  REST API calls
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   RENDER BACKEND (Express API)                  │
│   Auth · Journals · Reminders · Locations · Caregiver Routes    │
│              JWT Middleware · bcrypt · Nodemailer               │
└────────────┬────────────────────────────┬───────────────────────┘
             │                            │
             ▼                            ▼
┌────────────────────────┐   ┌────────────────────────────────────┐
│   NEON POSTGRESQL DB   │   │    CLAUDE API (Anthropic)          │
│  9 relational tables   │   │  Model: claude-sonnet-4-20250514   │
│  Serverless · Pooled   │   │  Endpoint: /v1/messages            │
│  Auto-scales to zero   │   │  3 features: scan · chat · insight │
└────────────────────────┘   └────────────────────────────────────┘
```

**CI/CD Pipeline:**
```
GitHub push → Vercel auto-deploy (frontend, <30s) 
           → Render auto-build  (backend,  ~2min)
```
## 💻 Local Setup

### Prerequisites
- Node.js v18+
- A [Neon](https://neon.tech) PostgreSQL database (free tier)
- An [Anthropic API key](https://console.anthropic.com)
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords)

### 1. Clone the repository
```bash
git clone https://github.com/Passionatelytoooadorable/alzheimer.git
cd alzheimer
```

### 2. Set up the backend
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory.

### 3. Set up the database
Run the schema SQL against your Neon database:
```bash
psql $DATABASE_URL -f schema.sql
```

### 4. Start the backend
```bash
npm start
# Backend runs on http://localhost:3001
```

### 5. Set up the frontend
In every frontend JS file, update `API_BASE` if running locally:
```javascript
const API_BASE = 'http://localhost:3001/api'; // for local dev
```

### 6. Serve the frontend
Use any static server — for example:
```bash
npx serve .
# or
python3 -m http.server 8080
```

Open `http://localhost:8080` in your browser.

---


## 🚀 Deployment

### Frontend → Vercel
1. Push to the `main` branch on GitHub
2. Vercel auto-deploys in under 30 seconds
3. No configuration needed — all files are static

### Backend → Render
1. Connect your GitHub repo to Render
2. Set build command: `npm install`
3. Set start command: `node server.js`
4. Add all environment variables in the Render dashboard
5. Render auto-rebuilds on every push to main

### Database → Neon
1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the connection string to `DATABASE_URL` in Render
3. Run `schema.sql` once to create all tables

---

<div align="center">

**Built with ❤️ for Alzheimer's patients and their caregivers**

</div>
