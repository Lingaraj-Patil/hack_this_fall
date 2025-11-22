# 🔧 Render Deployment Fix

## Issue
Render is using Python 3.13.4 by default, but MediaPipe doesn't support Python 3.13 yet (only supports up to 3.11).

## Solution

### Option 1: Use runtime.txt (Recommended)

I've created a `runtime.txt` file in the root directory with:
```
python-3.11.0
```

This tells Render to use Python 3.11.0 instead of 3.13.4.

### Option 2: Specify in Render Dashboard

If `runtime.txt` doesn't work, manually set Python version in Render Dashboard:

1. Go to your service in Render Dashboard
2. Go to **Settings** → **Environment**
3. Find **Python Version** or **Build Command**
4. Add this to build command:
   ```bash
   python --version 3.11.0 && pip install -r aiml/requirements.txt
   ```

### Option 3: Update render.yaml

The `render.yaml` has been updated. Make sure it's committed to your repo.

## Steps to Fix

1. **Commit the new files:**
   ```bash
   git add runtime.txt render.yaml
   git commit -m "Fix Python version for MediaPipe compatibility"
   git push
   ```

2. **Redeploy on Render:**
   - Go to Render Dashboard
   - Click **Manual Deploy** → **Deploy latest commit**
   - Or wait for automatic deploy

3. **Verify Python version:**
   - Check build logs - should show "Installing Python version 3.11.0"
   - MediaPipe should install successfully

## Alternative: Pin MediaPipe Version

If Python 3.11 still doesn't work, try pinning MediaPipe to a specific version:

Update `aiml/requirements.txt`:
```
opencv-python>=4.8.0
mediapipe==0.10.14
numpy>=1.24.0
flask>=3.0.0
flask-cors>=4.0.0
gunicorn>=21.2.0
```

## Verify

After deployment, check the build logs. You should see:
```
==> Installing Python version 3.11.0...
==> Collecting mediapipe>=0.10.0
==> Successfully installed mediapipe-0.10.14
```

---

**The main issue was Python 3.13.4 - MediaPipe only supports up to Python 3.11!**

