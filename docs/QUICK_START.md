# 🚀 QUICK START CHECKLIST

## ✅ Pre-Flight Check

Before running the system, verify:

- [ ] Python 3.8+ installed
- [ ] Node.js 16+ installed  
- [ ] All dependencies installed (`pip install -r requirements.txt`)
- [ ] MongoDB running (or using in-memory mode)
- [ ] `.env` files configured (see below)

---

## 📧 Alert Configuration Status

### Current Status (Check your `.env` files)

```bash
# Check if alerts are configured
cd ml_service
type .env
```

### ⚠️ If you see "your_email@gmail.com" or "your_twilio_sid":
**Alerts are NOT configured!** Run: `configure-alerts.bat`

### ✅ If you see real credentials:
**Alerts are configured!** Proceed to testing.

---

## 🏃‍♂️ Quick Start (3 Commands)

```bash
# 1. Configure alerts (FIRST TIME ONLY)
configure-alerts.bat

# 2. Start all services
start_all.bat

# 3. Open browser
http://localhost:5173
```

---

## 🧪 Testing Checklist

### Test 1: Services Running ✓
```bash
# All should return 200 OK
curl http://localhost:5000/test        # ML Service
curl http://localhost:4005/api/alerts  # Backend
# Browser: http://localhost:5173        # Frontend
```

### Test 2: Webcam Detection ✓
- [ ] Start camera
- [ ] Camera shows live feed
- [ ] Detection happens within 2 seconds
- [ ] Risk level shows in overlay

### Test 3: Voice Alert ✓
- [ ] Trigger assault detection
- [ ] Voice alert plays at ~2 seconds
- [ ] Message: "Fight or assault detected"

### Test 4: Video Recording ✓
- [ ] Recording starts when high risk detected
- [ ] Recording continues for 5 seconds total
- [ ] Console shows: "Uploading 5s incident clip"

### Test 5: Dashboard Alert ✓
- [ ] Alert appears in dashboard
- [ ] Shows correct behavior (Fighting/Assault)
- [ ] Timestamp is accurate
- [ ] Status is "Pending"

### Test 6: Email Alert ✓ (If configured)
- [ ] Email received at police inbox
- [ ] Subject: "🚨 URGENT: [Behavior] Detected!"
- [ ] 5-second video attached
- [ ] GPS location link included (if enabled)

### Test 7: SMS Alert ✓ (If configured)
- [ ] SMS received on admin phone
- [ ] Contains behavior and timestamp
- [ ] Includes GPS location link
- [ ] Readable and actionable

---

## 🛠️ Common Issues & Quick Fixes

### Issue: "Backend unreachable"
**Fix:**
```bash
cd backend
npm install
node server.js
```

### Issue: "ML Service unreachable"
**Fix:**
```bash
cd ml_service
pip install -r requirements.txt
python app.py
```

### Issue: "No detection happening"
**Fix:**
- Check ML model exists: `ml_service/model/cnn_model.h5`
- If missing: Train model first
- Check console for errors

### Issue: "Detection too slow"
**Fix:** Already optimized! Should detect in 1-2 seconds.
If still slow, check CPU usage.

### Issue: "Voice alert not playing"
**Fix:**
- Check browser sound permissions
- Try Chrome (best Web Speech API support)
- Check console for errors

### Issue: "No email received"
**Fix:**
1. Check `.env` has real credentials
2. Check spam folder
3. Test SendGrid dashboard for delivery status
4. Check `ml_service/ml_service.log` for errors

### Issue: "No SMS received"
**Fix:**
1. Verify Twilio credentials
2. Check phone numbers include country code
3. Check Twilio console for message status
4. Verify trial account is active

### Issue: "Video not uploading"
**Fix:**
- Check `backend/uploads` folder exists
- Verify backend is running
- Check browser console for upload errors
- Check `backend/debug.log`

---

## 📊 Performance Expectations

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Detection Time | 1-2 seconds | Watch webcam overlay |
| Voice Alert | At 2 seconds | Listen for audio |
| Recording Duration | 5 seconds | Check console logs |
| Video Upload | Within 1 second | Check dashboard |
| Email Delivery | Within 5 seconds | Check inbox |
| SMS Delivery | Within 10 seconds | Check phone |

---

## 🚨 Emergency Troubleshooting

### If NOTHING works:
```bash
# 1. Kill all processes
taskkill /F /IM python.exe
taskkill /F /IM node.exe

# 2. Clean restart
start_all.bat

# 3. Wait 30 seconds for all services to start
```

### If detection works but alerts don't:
```bash
# Test ML alert endpoint directly
curl http://localhost:5000/test-alert

# Check if email/SMS works
# If not, run: configure-alerts.bat
```

### If video won't upload:
```bash
# Check backend is receiving requests
cd backend
node server.js

# Watch for upload POST requests
# Should see: POST /api/report-incident
```

---

## 📞 Support Quick Reference

**Logs to check:**
- `ml_service/ml_service.log` - ML detection logs
- `backend/debug.log` - Backend operation logs
- Browser console - Frontend errors

**Test endpoints:**
- `http://localhost:5000/test` - ML service health
- `http://localhost:4005/api/alerts` - Backend health
- `http://localhost:5173` - Frontend

**Config files:**
- `ml_service/.env` - Email/SMS credentials
- `backend/.env` - Backend config
- `PERFORMANCE_FIXES.md` - Detailed guide

---

## ✅ Success Indicators

You know it's working perfectly when:
- ✅ Webcam shows live feed with bounding boxes
- ✅ Detection happens in 1-2 seconds
- ✅ Voice alert plays at 2 seconds
- ✅ Alerts appear in dashboard immediately
- ✅ Emails arrive within 5 seconds
- ✅ SMS arrives within 10 seconds
- ✅ 5-second video clips are attached

---

## 🎯 Final Checklist

Before considering the system "production ready":

- [ ] All services start without errors
- [ ] Webcam detection works reliably
- [ ] Voice alerts play consistently
- [ ] Videos record for full 5 seconds
- [ ] Dashboard updates in real-time
- [ ] Email credentials configured
- [ ] Test email received successfully
- [ ] SMS credentials configured (optional)
- [ ] Test SMS received successfully (optional)
- [ ] GPS location tracking enabled
- [ ] All logs show no errors

**If all checkboxes are ticked: 🎉 SYSTEM READY!**

If not, see PERFORMANCE_FIXES.md for detailed troubleshooting.
