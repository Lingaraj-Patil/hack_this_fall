# 🔧 Render Python Version Fix

## Problem
Render is using Python 3.13.4, but MediaPipe only supports up to Python 3.11.

## Solution Applied

I've updated multiple files to force Python 3.11:

1. **runtime.txt** - Changed format to `3.11.0`
2. **render.yaml** - Updated build command to explicitly use `python3.11`
3. **.python-version** - Added for additional compatibility

## What Changed

### render.yaml
- Build command now uses: `python3.11 -m pip install`
- Start command uses: `python3.11 -m gunicorn`
- Added PYTHON_VERSION environment variable

### runtime.txt
- Format changed from `python-3.11.0` to `3.11.0`

## Next Steps

1. **Commit and push:**
   ```bash
   git add runtime.txt render.yaml .python-version
   git commit -m "Force Python 3.11 for MediaPipe compatibility"
   git push
   ```

2. **In Render Dashboard (if still doesn't work):**
   - Go to your service → **Settings**
   - Scroll to **Environment Variables**
   - Add:
     - Key: `PYTHON_VERSION`
     - Value: `3.11.0`
   - Or go to **Build & Deploy** → **Build Command** and change to:
     ```bash
     python3.11 -m pip install --upgrade pip && python3.11 -m pip install -r aiml/requirements.txt
     ```

3. **Manual Deploy:**
   - Click **Manual Deploy** → **Deploy latest commit**

## Verify

After deployment, check build logs. You should see:
```
==> Installing Python version 3.11.0...
==> Collecting mediapipe>=0.10.0
==> Successfully installed mediapipe-0.10.14
```

If you still see Python 3.13.4, manually set it in Render Dashboard settings.

