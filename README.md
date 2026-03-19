<div align="center">

<img src="icons/icon-192x192.png" alt="MindBridge Logo" width="96" height="96"/>

# 🧠 MindBridge
### An Intelligent Alzheimer's Support Platform

**A full-stack, AI-powered Progressive Web App for Alzheimer's patients and their caregivers.**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-alzheimer--support.vercel.app-4F46E5?style=for-the-badge)](https://alzheimer-support.vercel.app)
[![Backend](https://img.shields.io/badge/⚙️_API-Render-7C3AED?style=for-the-badge)](https://alzheimer-backend-new.onrender.com/api/health)
[![GitHub](https://img.shields.io/badge/📁_Repo-GitHub-1F2937?style=for-the-badge)](https://github.com/Passionatelytoooadorable/alzheimer)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-v18-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-v4-000000?style=flat&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat&logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat&logo=vercel&logoColor=white)

---

> *"Technology cannot cure Alzheimer's — but it can make living with it more dignified, safe, and supported."*

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Live Demo & Test Credentials](#-live-demo--test-credentials)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Database Schema](#-database-schema)
- [Pages & Modules](#-pages--modules)
- [Security](#-security)
- [PWA Support](#-pwa-support)
- [Accessibility](#-accessibility)
- [API Endpoints](#-api-endpoints)
- [Local Setup](#-local-setup)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Testing](#-testing)
- [Future Scope](#-future-scope)
- [Final Year Project Info](#-final-year-project-info)

---

## 🧠 About the Project

MindBridge is a production-deployed, full-stack web application built as a Final Year Engineering Project. It addresses the fragmented digital care landscape for Alzheimer's patients and their caregivers by bringing every essential tool — AI analysis, journaling, reminders, location safety, cognitive games, and caregiver monitoring — into a single accessible platform.

**The problem it solves:**
- 55 million+ people globally live with Alzheimer's disease
- Patients and caregivers typically juggle 4–6 disconnected apps
- No single platform combines AI intelligence, safety monitoring, and caregiver coordination
- Most health apps are not designed for elderly or cognitively impaired users

**Two user roles:**
| Role | Primary Use |
|------|-------------|
| 🧑‍⚕️ **Patient** | Journal, reminders, AI companion, memory vault, location sharing |
| 👩‍👦 **Caregiver** | Monitor patients remotely, live map, mood analytics, messaging |

---

## 🌐 Live Demo & Test Credentials

| Link | URL |
|------|-----|
| 🌐 Frontend | https://alzheimer-support.vercel.app |
| ⚙️ Backend API | https://alzheimer-backend-new.onrender.com/api |
| 📁 Repository | https://github.com/Passionatelytoooadorable/alzheimer |

> **Note:** The backend is hosted on Render's free tier. The first request may take ~25 seconds due to cold start. All subsequent requests are fast.

**Demo Accounts (set up before testing):**

| Account | Email | Password | Pre-loaded Data |
|---------|-------|----------|-----------------|
| Patient Demo | demo.patient@mindbridge.app | Demo@1234 | 14 days of journal entries, 5 reminders, memories |
| Caregiver Demo | demo.caregiver@mindbridge.app | Demo@1234 | Linked to patient, 7-day activity log |

---

## ✨ Features

### 🤖 AI-Powered Features
| Feature | Description | AI Model |
|---------|-------------|----------|
| **Scan Report Analysis** | Upload/paste any medical report (MRI, CT, blood test, cognitive test) — AI returns a plain-language summary with key findings and suggested follow-ups | `claude-sonnet-4-20250514` |
| **Weekly Journal Insights** | AI analyses the last 7 journal entries, surfaces emotional patterns, recurring themes, and coping suggestions | `claude-sonnet-4-20250514` |
| **AI Companion Chat** | Warm, patient-appropriate conversational AI for daily emotional support and connection | `claude-sonnet-4-20250514` |

### 📍 Location & Safety
- **Real-time GPS Tracking** — Browser-native via `navigator.geolocation.watchPosition()`, no hardware required
- **Geofence Safe Zones** — Define circular safe zones with adjustable radius (50m–5km)
- **Haversine Distance Algorithm** — Great-circle distance calculation for precise boundary detection
- **Breach Alerts** — Instant browser push notification on the patient's device + caregiver in-app alert
- **Location History** — Last 20 GPS coordinates logged with timestamps

### 📓 Journal & Mood Tracking
- Daily entries with mood slider (1–10) and emoji indicators
- Keyword search with offline fallback (cached entry array)
- 30-day mood trend chart (Chart.js)
- Writing streak tracking
- AI Weekly Insights panel

### ⏰ Smart Reminders
- Categories: Medication, Appointment, Exercise, Meal
- Repeat types: Daily, Weekly, One-time
- 30-day compliance history heatmap (green/amber/red)
- Per-reminder and overall compliance percentage
- Caregiver visibility of compliance data

### 🧩 AI Companion
- Conversational chat with context-aware responses
- **Text-to-Speech (TTS)** — every AI message read aloud via Web Speech API
- **Voice Input** — speak instead of type via SpeechRecognition
- **3 Cognitive Games:**
  - Word Memory Game — recall a word sequence
  - Number Sequence Game — reproduce displayed numbers
  - Object Association Game — match objects to descriptions
- Personal high-score board

### 🗂️ Memory Vault
- Create memory entries with title, narrative, date, mood, and category
- Categories: Family, Childhood, Achievement, Travel, Friendship
- Responsive card gallery with search and category filter
- Full-screen detail modal with native `<dialog>` element

### 👩‍💻 Caregiver Dashboard
- Link multiple patients by email (many-to-many relationship)
- Live location map (Leaflet.js + OpenStreetMap)
- 30-day mood trend chart per patient
- Chronological activity feed
- Reminder compliance heatmap view
- In-app messaging with 10-second polling
- Geofence breach alert feed

### 🔐 Auth & Security
- JWT authentication with httpOnly cookies (XSS-proof)
- bcrypt password hashing (10 salt rounds)
- Email-based password reset via Nodemailer (Gmail SMTP)
- One-time, time-limited (1hr) reset tokens

### 📱 Progressive Web App
- Installable on Android, iOS, Windows, macOS
- Stale-while-revalidate service worker caching
- Custom app icons (192px + 512px)
- Home screen shortcuts for Journal, Reminders, AI Companion
- Offline fallback page

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| HTML5 | WHATWG Living Standard | Page structure, semantic markup |
| CSS3 | Level 3 | Responsive design, animations, theming |
| Vanilla JavaScript | ES6+ (ECMAScript 2022) | All client-side logic, API calls, DOM |
| Leaflet.js | v1.9.x | Interactive maps |
| Chart.js | v4.x | Mood trend charts |
| Web Geolocation API | W3C Standard | Real-time GPS coordinates |
| Web Speech API | W3C Draft | TTS and voice input |
| Service Worker API | W3C Standard | Offline caching (stale-while-revalidate) |
| Web App Manifest | W3C Standard | PWA installability and shortcuts |
| Fetch API | WHATWG Standard | All HTTP requests |
| **Hosting** | Vercel Edge CDN | Global deployment, automatic HTTPS |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | v18+ LTS | Server runtime |
| Express.js | v4.x | HTTP server, REST API routing |
| jsonwebtoken | v9.x | JWT signing and verification |
| bcrypt | v5.x | Password hashing (10 rounds) |
| cookie-parser | v1.x | httpOnly cookie parsing |
| cors | v2.x | Cross-origin policy (Vercel allowlist) |
| pg (node-postgres) | v8.x | PostgreSQL connection pool |
| Nodemailer | v6.x | Transactional email (password reset) |
| dotenv | v16.x | Environment variable management |
| **Hosting** | Render Cloud PaaS | Managed Node.js, auto-scaling, HTTPS |

### Database & AI
| Service | Purpose |
|---------|---------|
| **Neon PostgreSQL** | Serverless, cloud-native relational database with connection pooling |
| **Claude API (Anthropic)** | `claude-sonnet-4-20250514` — scan analysis, journal insights, companion chat |

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

---

## 🗄️ Database Schema

```sql
-- Core user table (both patients and caregivers)
users (id, name, email, password_hash, role, created_at, profile_photo)

-- Patient journal entries
journals (id, user_id, content, mood_score, tags, created_at)

-- Reminder definitions
reminders (id, user_id, title, description, scheduled_time, 
           category, repeat_type, is_active)

-- 30-day compliance history (separate table for audit trail)
reminder_completions (id, reminder_id, user_id, completed_at)

-- Memory vault entries
memories (id, user_id, title, narrative, memory_date, 
          mood, category, created_at)

-- Caregiver-patient messaging
messages (id, sender_id, receiver_id, content, sent_at, is_read)

-- GPS location history
locations (id, user_id, latitude, longitude, accuracy, recorded_at)

-- Many-to-many caregiver-patient linking
caregiver_patients (id, caregiver_id, patient_id, linked_at, status)

-- Activity audit log for caregiver dashboard
activity_feed (id, patient_id, activity_type, description, 
               metadata_json, created_at)
```

**Key design decisions:**
- `reminder_completions` is a **separate table** (not a boolean on reminders) — enables full 30-day compliance history
- `caregiver_patients` is a **many-to-many join table** — one caregiver can monitor multiple patients
- `activity_feed` is an **append-only audit log** — never updated, only inserted

---

## 📄 Pages & Modules

| # | Page / File | Route | Role | Description |
|---|-------------|-------|------|-------------|
| 1 | `landing.html` | `/landing.html` | Public | Hero, feature showcase, role-based CTA routing |
| 2 | `login.html` | `/login.html` | Public | JWT auth, role-based redirect |
| 3 | `signup.html` | `/signup.html` | Public | Registration + 3-step onboarding wizard |
| 4 | `index.html` | `/` | Public | Smart auth dispatcher (no visible UI) |
| 5 | `dashboard.html` | `/dashboard.html` | Patient | Stats, reminders, quick nav, onboarding tour |
| 6 | `memory.html` | `/memory.html` | Patient | Memory vault — create, browse, search |
| 7 | `journal.html` | `/journal.html` | Patient | Mood journal, AI insights, trend chart |
| 8 | `location-tracker.html` | `/location-tracker.html` | Patient | GPS map, geofence zones, breach alerts |
| 9 | `ai-companion.html` | `/ai-companion.html` | Patient | AI chat, TTS, voice input, 3 games |
| 10 | `reminders.html` | `/reminders.html` | Patient | Smart reminders + 30-day compliance |
| 11 | `resources.html` | `/resources.html` | Both | Curated Alzheimer's care resources |
| 12 | `profile.html` | `/profile.html` | Both | Account settings, photo, preferences |
| 13 | `caregiver.html` | `/caregiver.html` | Caregiver | Full monitoring dashboard |
| 14 | `caregiver-guide.html` | `/caregiver-guide.html` | Public | Platform guide + best practices |
| 15 | `reset-password.html` | `/reset-password.html` | Public | Password reset via email token |
| 16 | `service-worker.js` | Sitewide | — | PWA caching + push notification handler |
| 17 | `nav-shared.js` | Sitewide | — | Shared nav injection, PWA registration, logout |

---

## 🔒 Security

| Mechanism | Implementation |
|-----------|---------------|
| **JWT Storage** | httpOnly cookies — never accessible to JavaScript (XSS-proof) |
| **Password Hashing** | bcrypt with 10 salt rounds — plain text never stored |
| **CORS** | Strict allowlist — only the Vercel frontend origin permitted |
| **SQL Injection** | All queries use node-postgres parameterised syntax |
| **Secrets** | All API keys and credentials in Render environment variables — never in code |
| **Password Reset** | Tokens hashed with bcrypt, time-limited to 1 hour, single-use |
| **Input Validation** | Client-side (instant feedback) + server-side (source of truth) |

---

## 📱 PWA Support

MindBridge is a fully installable Progressive Web App:

```
✅ Web App Manifest (manifest.json)
✅ Service Worker with stale-while-revalidate caching
✅ Custom icons: icon-192x192.png + icon-512x512.png  
✅ App shortcuts: Journal, Reminders, AI Companion
✅ Offline fallback page
✅ Install prompt CTA in the navigation bar
✅ start_url set to dashboard.html (skips redirect layer)
```

**Supported platforms for installation:**
- Android (Chrome, Samsung Internet)
- iOS (Safari — Add to Home Screen)
- Windows (Edge, Chrome)
- macOS (Chrome, Edge)


---

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

Create a `.env` file in the backend directory (see [Environment Variables](#-environment-variables) below).

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

## 🔑 Environment Variables

Add these to your Render backend dashboard (or local `.env` file):

```env
# Database
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here

# Anthropic AI
ANTHROPIC_API_KEY=sk-ant-...

# Email (for password reset)
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx   # 16-char Gmail App Password

# Frontend URL (for CORS + reset email links)
FRONTEND_URL=https://alzheimer-support.vercel.app

# Node environment
NODE_ENV=production
```

> **Gmail App Password:** Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) → Select "Mail" → Generate. If your account uses passkeys only, use Brevo SMTP as an alternative.

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

```

---

<div align="center">

**Built with ❤️ for Alzheimer's patients and their caregivers**


</div>
