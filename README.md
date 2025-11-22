# 👁️ User Concentration Monitor API

Flask REST API that monitors user concentration by tracking eye position and posture. Returns JSON responses for frontend integration.

## 🚀 Quick Start

### Local Setup

```bash
cd aiml
python -m venv venv
venv\Scripts\activate    # Windows
# source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
python app.py
```

API will be available at `http://localhost:5000`

## 📡 API Endpoints

### `GET /`
Health check and API information.

**Response:**
```json
{
  "status": "ok",
  "message": "User Concentration Monitor API",
  "endpoints": {
    "/api/analyze": "POST - Analyze image (base64 or webcam)",
    "/api/health": "GET - Health check"
  }
}
```

### `GET /api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "concentration-monitor"
}
```

### `GET /api/analyze`
Returns API usage information.

### `POST /api/analyze`
Analyze frame for eye tracking and posture.

**Request:**
```json
{
  "image": "base64_encoded_image_string"
}
```

Or empty body `{}` to use webcam (local testing only).

**Response:**
```json
{
  "timestamp": 1731652010000,
  "eye_tracking": {
    "looking_away": false,
    "duration": 0.0,
    "confidence": 0.15,
    "head_yaw": 2.5,
    "head_pitch": -1.2,
    "eye_aspect_ratio": 1.45
  },
  "posture": {
    "interest_score": 0.65,
    "interest_level": "high",
    "spine_angle": 12.5,
    "slouch": false,
    "visibility_score": 0.99
  },
  "alert": null
}
```

**Alert Response (when looking away >10s):**
```json
{
  "alert": {
    "triggered": true,
    "message": "⚠️ ALERT: Looking away for 12.5 seconds!",
    "duration": 12.5,
    "threshold": 10.0
  }
}
```

## 🌐 Frontend Integration

### JavaScript Example

```javascript
async function analyzeFrame(videoElement) {
  // Convert video frame to base64
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0);
  const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
  
  // Send to API
  const response = await fetch('https://your-api-url/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image })
  });
  
  const data = await response.json();
  
  // Handle alert
  if (data.alert?.triggered) {
    showNotification(data.alert.message);
  }
  
  return data;
}

// Continuous monitoring (~10 FPS)
setInterval(() => analyzeFrame(videoElement), 100);
```

### Python Example

```python
import requests
import base64
import cv2

# Capture frame
cap = cv2.VideoCapture(0)
ret, frame = cap.read()
cap.release()

# Encode to base64
_, buffer = cv2.imencode('.jpg', frame)
image_base64 = base64.b64encode(buffer).decode('utf-8')

# Send to API
response = requests.post(
    'http://localhost:5000/api/analyze',
    json={'image': image_base64}
)

data = response.json()
print(data)
```

## 🚀 Deploy on Render

### Method 1: Using render.yaml (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Deploy to Render"
   git push
   ```

2. **Deploy on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **"New +"** → **"Blueprint"**
   - Select your repository
   - Render will auto-detect `render.yaml` and configure the service

### Method 2: Manual Configuration

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `concentration-monitor`
   - **Environment**: `Python 3`
   - **Python Version**: Set to `3.11.0` in Environment Variables (MediaPipe requires Python ≤3.11)
   - **Build Command**: `python3.11 -m pip install --upgrade pip && python3.11 -m pip install -r aiml/requirements.txt`
   - **Start Command**: `cd aiml && python3.11 -m gunicorn --bind 0.0.0.0:$PORT --workers 2 --threads 2 --timeout 120 app:app`
5. Click **"Create Web Service"**

### Important: Python Version

**MediaPipe only supports Python ≤3.11.** Make sure to set Python 3.11.0 in Render Dashboard:
- Go to **Settings** → **Environment Variables**
- Add: `PYTHON_VERSION` = `3.11.0`

Or use the `runtime.txt` file (already included in repo).

## 📦 Requirements

- Python 3.11 (MediaPipe compatibility)
- Flask 3.0+
- Flask-CORS 4.0+
- MediaPipe 0.10+
- OpenCV 4.8+
- NumPy 1.24+
- Gunicorn 21.2+ (production)

## 🔧 How It Works

1. **Eye Tracking**: Uses MediaPipe Face Mesh with head pose estimation
2. **Looking Away Detection**: Analyzes head yaw/pitch and eye position
3. **Duration Tracking**: Maintains state for "looking away" duration
4. **Alert System**: Triggers alert when duration exceeds 10 seconds
5. **Posture Analysis**: Uses MediaPipe Pose to calculate spine/neck angle
6. **Interest Calculation**: Determines interest level based on posture quality

## 🎯 Features

- ✅ RESTful API with JSON responses
- ✅ CORS enabled for frontend integration
- ✅ Base64 image support
- ✅ Webcam fallback (local testing)
- ✅ Real-time eye tracking with head pose
- ✅ Posture analysis (upper body)
- ✅ Alert system (>10s looking away)
- ✅ Production-ready (Gunicorn)
- ✅ Dynamic confidence calculation

## 📝 Notes

- **Production**: Always send base64 images (webcam not available on Render)
- **State**: API maintains state for "looking away" duration tracking
- **CORS**: Enabled for cross-origin requests
- **Python Version**: Must be 3.11 or lower for MediaPipe compatibility

## 🐛 Troubleshooting

### MediaPipe Installation Fails
- Ensure Python version is 3.11 or lower
- Set `PYTHON_VERSION=3.11.0` in Render environment variables

### Webcam Not Available
- Use base64 image encoding instead
- Webcam only works locally, not on Render

### Build Fails on Render
- Check Python version is set to 3.11.0
- Verify `runtime.txt` contains `3.11.0`
- Check build logs for specific errors

---

**Simple, Clean, API-Ready** - Send images and get concentration metrics!
