# 🎯 DeepDive - AI-Powered Study Session Monitor


**Transform your study habits with AI-powered focus tracking, gamification, and real-time accountability.**


---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Configuration](#-configuration)


---

## 🌟 Overview

**DeepDive** is a comprehensive productivity platform that combines AI-powered webcam monitoring, gamification mechanics, and social features to help students stay focused during study sessions. Built with the MERN stack and powered by computer vision, it provides real-time feedback on concentration levels while making studying engaging through points, leaderboards, and clan competitions.

### 🎥 Demo

> **Live Demo:** [Coming Soon]  
> **Video Tutorial:** [Coming Soon]

### 🎯 Problem It Solves

- **Distraction Management:** AI monitors your focus and alerts you when distracted
- **Procrastination:** Gamification and social pressure keep you motivated
- **Habit Building:** Streak tracking and daily goals build consistent study habits
- **Accountability:** Real-time monitoring and clan competitions provide social accountability

---

## ✨ Features

### 🤖 AI-Powered Monitoring
- **Real-time Eye Tracking:** Detects when you look away from the screen
- **Posture Analysis:** Monitors slouching and sitting position
- **Concentration Scoring:** Calculates focus percentage based on multiple factors
- **Automatic Pausing:** Pauses session when you leave the desk

### 🎮 Gamification System
- **Points & Levels:** Earn points for focused study time
- **Hearts System:** Regenerating hearts lost for poor concentration
- **Streak Tracking:** Daily streaks encourage consistent study habits
- **Achievements:** Unlock badges for milestones
- **Leaderboards:** Daily, weekly, monthly, and all-time rankings

### 👥 Social Features
- **Clans:** Create or join study groups
- **Clan Leaderboards:** Compete with other groups
- **Invite System:** Share invite codes with friends
- **Member Roles:** Leader, Admin, and Member permissions

### 🛡️ Productivity Tools
- **Session Timer:** Accurate time tracking with pause/resume
- **Todo List:** Task management with priorities
- **Blocked Sites:** Browser extension blocks distracting websites
- **Focus Heatmap:** Visualize your study patterns
- **Session History:** Track all past sessions with analytics

### 📊 Analytics & Insights
- **Dashboard:** Overview of your productivity metrics
- **Weekly Stats:** Total time, sessions, efficiency, concentration
- **Session Analytics:** Detailed breakdown of each study session
- **Progress Tracking:** Visualize improvement over time

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS + Custom Glassmorphism
- **State Management:** Zustand
- **API Client:** Axios with interceptors
- **Real-time:** Socket.IO Client
- **Routing:** React Router v6
- **UI Components:** Lucide React Icons
- **Notifications:** React Hot Toast
- **Webcam:** React Webcam

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose ODM
- **Caching:** Redis
- **Authentication:** JWT (Access + Refresh Tokens)
- **Real-time:** Socket.IO
- **Logging:** Winston
- **Validation:** Joi
- **Security:** Helmet, CORS, Rate Limiting

### AI/ML
- **Computer Vision:** MediaPipe + TensorFlow
- **Eye Tracking:** Face mesh detection
- **Posture Analysis:** Pose estimation
- **API:** Flask REST API (deployed separately)

### DevOps
- **Hosting:** Render.com / Railway / Fly.io
- **Database:** MongoDB Atlas (M0 Free)
- **Cache:** Redis Cloud (Free 30MB)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  React Frontend (Port 3000)                                  │
│  ├── Session Page (Timer, Webcam, Widgets)                  │
│  ├── Dashboard (Stats, History)                             │
│  ├── Leaderboard (Rankings)                                 │
│  ├── Clans (Social Features)                                │
│  └── Settings (Preferences)                                 │
└────────────┬────────────────────────────────────────────────┘
             │
             │ HTTP/REST + WebSocket
             │
┌────────────▼────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  Express.js Backend (Port 5001)                             │
│  ├── Auth (JWT)                                             │
│  ├── Session Management                                     │
│  ├── Gamification Engine                                    │
│  ├── Clan System                                            │
│  └── Socket.IO Server                                       │
└────────────┬────────────────────────────────────────────────┘
             │
             │ REST API
             │
┌────────────▼────────────────────────────────────────────────┐
│                         DATA LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  MongoDB (Database)          Redis (Cache)                  │
│  ├── Users                   ├── Sessions                   │
│  ├── Sessions                ├── Leaderboards               │
│  ├── Clans                   └── Hearts                     │
│  ├── Todos                                                   │
│  └── Notifications                                           │
└─────────────────────────────────────────────────────────────┘
             │
             │ HTTP
             │
┌────────────▼────────────────────────────────────────────────┐
│                         ML LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  Flask Vision API (Deployed)                                │
│  ├── Eye Tracking (MediaPipe)                               │
│  ├── Posture Analysis (Pose Estimation)                     │
│  └── Concentration Scoring                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MongoDB** ([Local](https://www.mongodb.com/try/download/community) or [Atlas](https://www.mongodb.com/cloud/atlas))
- **Redis** ([Local](https://redis.io/download) or [Cloud](https://redis.com/cloud))
- **Git** ([Download](https://git-scm.com/))

### Installation

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Lingaraj-Patil/hack_this_fall.git
cd hack_this_fall
```

#### 2️⃣ Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start backend server
npm run dev
```

**Expected output:**
```
✅ MongoDB connected successfully
✅ Redis connected
🚀 Server running in development mode
📡 Listening on http://0.0.0.0:5001
🔌 Socket.IO initialized
```

#### 3️⃣ Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start frontend dev server
npm run dev
```

**Expected output:**
```
VITE v5.0.0 ready in 500ms
➜  Local:   http://localhost:3000/
```

#### 4️⃣ Browser Extension 

```bash
# Load unpacked extension in Chrome
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select browser-extension folder
```

---

## 📁 Project Structure

```
hack_this_fall/
├── backend/                    # Node.js Express Backend
│   ├── src/
│   │   ├── config/            # Database, Redis config
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── models/           # MongoDB schemas
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── sockets/          # Socket.IO handlers
│   │   └── utils/            # Helper functions
│   ├── scripts/              # Seed scripts
│   ├── tests/                # Jest tests
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/                   # React Frontend
│   ├── public/
│   │   └── backgrounds/       # Background images
│   ├── src/
│   │   ├── api/              # API client + endpoints
│   │   ├── components/       # React components
│   │   │   ├── Common/       # Reusable components
│   │   │   └── Widgets/      # Session widgets
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Page components
│   │   ├── store/            # Zustand stores
│   │   ├── utils/            # Utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── browser-extension/          # Chrome Extension
│   ├── manifest.json
│   ├── background.js
│   ├── popup.html
│   └── popup.js
│
├── docker-compose.yml
├── .gitignore
├── LICENSE
└── README.md
```

---

## 📚 API Documentation

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "username": "johndoe", ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Sessions

#### Start Session
```http
POST /api/sessions
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "tags": ["focused", "productive"],
  "notes": "Deep work session"
}
```

#### Get Session History
```http
GET /api/sessions/history?page=1&limit=20
Authorization: Bearer {accessToken}
```

### Full API Reference

For complete API documentation with all 47 endpoints, see [API_DOCS.md](./docs/API_DOCS.md).

---

## 🌐 Deployment

### Backend Deployment (Render.com)

1. **Push to GitHub**
```bash
git push origin main
```

2. **Create Web Service on Render**
   - Go to [render.com](https://render.com)
   - New → Web Service
   - Connect GitHub repository
   - Configure:
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Environment:** Node

3. **Add Environment Variables**
   - All variables from `.env`
   - Generate strong `JWT_SECRET` and `JWT_REFRESH_SECRET`

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete

### Frontend Deployment (Vercel)

1. **Push to GitHub**
```bash
cd frontend
git push origin main
```

2. **Import on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import Project
   - Select your repository
   - Framework: Vite
   - Root Directory: `frontend`

3. **Environment Variables**
   - `VITE_API_URL`: Your backend URL (e.g., https://your-api.onrender.com/api)
   - `VITE_WS_URL`: Your backend URL without /api

4. **Deploy**
   - Click Deploy
   - Visit your live app!

### Database Setup

#### MongoDB Atlas (Free)
1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create M0 Free cluster
3. Create database user
4. Whitelist IP addresses (0.0.0.0/0 for development)
5. Get connection string
6. Update `MONGODB_URI` in environment variables

#### Redis Cloud (Free)
1. Create account at [redis.com/cloud](https://redis.com/cloud)
2. Create 30MB free database
3. Get connection string
4. Update `REDIS_URL` in environment variables

---

## ⚙️ Configuration

### Backend Environment Variables

```env
# Server
NODE_ENV=production
PORT=5001

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
REDIS_URL=redis://user:pass@host:port

# JWT
JWT_SECRET=your-super-secret-key-min-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-characters
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# ML Vision API
VISION_API_URL=https://posture-analyzer.onrender.com
VISION_API_TIMEOUT=5000

# CORS
ALLOWED_ORIGINS=https://your-frontend.vercel.app

# Gamification
HEARTS_REGEN_HOURS=3
MAX_HEARTS=5
POINTS_PER_SECOND=0.1
```

### Frontend Environment Variables

```env
VITE_API_URL=https://your-backend.onrender.com/api
VITE_WS_URL=https://your-backend.onrender.com
VITE_VISION_INTERVAL=3000
```

---

### Manual Testing Checklist

- [ ] User registration works
- [ ] Login with correct credentials
- [ ] Start session - timer counts
- [ ] Webcam activates and shows live feed
- [ ] Pause/Resume session works
- [ ] Stop session - points calculated
- [ ] Todo list CRUD operations
- [ ] Leaderboard loads and updates
- [ ] Join/Create clan works
- [ ] Settings save correctly
- [ ] Blocked sites work with extension
- [ ] WebSocket real-time updates
- [ ] Logout and login again

---

## 🐛 Known Issues

- WebSocket may disconnect after long idle periods (auto-reconnects)
- ML Vision API has cold start latency (~5s first request)
- Browser extension requires manual reload after backend changes


---

## 👏 Acknowledgments

- **ML Vision API:** [Posture Analyzer](https://posture-analyzer.onrender.com)
- **Icons:** [Lucide React](https://lucide.dev/)
- **UI Inspiration:** Various productivity apps
- **Community:** All our contributors and users

---

## 📧 Contact & Support

- **Website:** [Coming Soon] 
- **Email:** [Coming Soon]
- **Twitter:** [Coming Soon]
- **Discord:** [Coming Soon]

### Support the Project

If you find this project helpful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting features
- 🤝 Contributing code
- 📢 Sharing with friends
