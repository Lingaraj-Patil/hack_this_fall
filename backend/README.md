# Study Monitor Backend

AI-powered study session monitoring with gamification, clans, and leaderboards.

## 🚀 Quick Start

### Local Development

\`\`\`bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start MongoDB and Redis locally (Docker)
docker-compose up -d

# Run development server
npm run dev
\`\`\`

Server will run on \`http://localhost:5000\`

### Environment Setup

Required environment variables (see .env.example):
- MONGODB_URI
- REDIS_URL
- JWT_SECRET & JWT_REFRESH_SECRET
- VISION_API_URL
- ALLOWED_ORIGINS

## 📡 API Documentation

### Authentication
- \`POST /api/auth/register\` - Register new user
- \`POST /api/auth/login\` - Login
- \`POST /api/auth/refresh\` - Refresh access token
- \`GET /api/auth/profile\` - Get user profile
- \`PUT /api/auth/profile\` - Update profile

### Sessions
- \`POST /api/sessions\` - Start new session
- \`POST /api/sessions/:id/pause\` - Pause session
- \`POST /api/sessions/:id/resume\` - Resume session
- \`POST /api/sessions/:id/end\` - End session
- \`GET /api/sessions/active\` - Get active session
- \`GET /api/sessions/history\` - Get session history
- \`GET /api/sessions/stats\` - Get session statistics

### Vision Analysis
- \`POST /api/vision/analyze\` - Analyze webcam frame

### Gamification
- \`GET /api/gamification/leaderboard\` - Get leaderboard
- \`GET /api/gamification/rank\` - Get user rank
- \`GET /api/gamification/hearts\` - Get heart status

### Clans
- \`POST /api/clans\` - Create clan
- \`POST /api/clans/join\` - Join clan by invite code
- \`POST /api/clans/leave\` - Leave current clan
- \`GET /api/clans/my-clan\` - Get current clan details
- \`GET /api/clans/search\` - Search public clans

## 🚢 Deployment

### Option 1: Render.com (Recommended)

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect your repo
4. Set environment variables
5. Deploy!

**Build Command**: \`npm install\`
**Start Command**: \`npm start\`

### Option 2: Railway.app

\`\`\`bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set KEY=value

# Deploy
railway up
\`\`\`

### Option 3: Fly.io

\`\`\`bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch app
fly launch

# Set secrets
fly secrets set JWT_SECRET=xxx

# Deploy
fly deploy
\`\`\`

### Database Setup

**MongoDB Atlas (Free M0)**:
1. Create account at mongodb.com/cloud/atlas
2. Create cluster (M0 Free)
3. Get connection string
4. Add to MONGODB_URI env var

**Redis Cloud (Free 30MB)**:
1. Create account at redis.com/cloud
2. Create database
3. Get connection string
4. Add to REDIS_URL env var

## 📊 Monitoring

Production logs available via hosting platform dashboard.

Winston logs stored in \`logs/\` directory:
- \`error.log\` - Error logs only
- \`combined.log\` - All logs

## 🔒 Security

- JWT tokens (15min access, 7day refresh)
- Bcrypt password hashing (10 rounds)
- Helmet.js security headers
- Rate limiting per route
- CORS whitelist
- Input validation with Joi

## 🧪 Testing

\`\`\`bash
# Run tests
npm test

# With coverage
npm run test:coverage
\`\`\`

## 📦 Project Structure

\`\`\`
src/
├── config/         # Configuration files
├── models/         # Mongoose models
├── controllers/    # Route controllers
├── services/       # Business logic
├── middleware/     # Express middleware
├── routes/         # API routes
├── sockets/        # Socket.IO handlers
└── utils/          # Utility functions
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License