# Sentinel AI: Project Improvements & Fixes

Based on a comprehensive review of the `frontend`, `backend`, and `ml_service` codebases, here is a categorized list of suggested improvements and fixes. These range from critical security patches to structural architectural upgrades.

---

## 🚨 Critical Security Fixes

### 1. Insecure Role Assignment on Registration (`frontend/src/components/Login.jsx`)
**Issue:** During registration, users can select their own role (`cctv_user`, `police`, `admin`) from a public dropdown menu. This means anyone could register as an admin and bypass all security protections.
**Fix:** Remove the role selection from public registration. Default all new users to a low-privilege role (like `cctv_user` or `pending`). Only an existing `admin` should be able to elevate a user's role to `police` or `admin` via a dedicated admin dashboard panel.

### 2. Insecure JWT Storage (`frontend/src/App.jsx`)
**Issue:** The authentication token is currently stored in `localStorage.setItem('token', authToken)`. This makes the application highly vulnerable to Cross-Site Scripting (XSS) attacks, where a malicious script could easily extract the token.
**Fix:** Change the backend login route to return the JWT inside an `httpOnly`, `secure` cookie. This prevents client-side JavaScript from accessing it while still passing it automatically in API requests.

### 3. Leaky Error Handling in ML Service (`ml_service/app.py`)
**Issue:** Your ML API returns raw exception strings (`{"error": str(e)}`) and stack traces on 500 errors. This is dangerous as it leaks internal logic or filesystem structures to potentially malicious actors.
**Fix:** Log the full exception internally (using your logger), but return generic, sanitized error messages to the client (e.g., `{"error": "Failed to process video frame"}`).

---

## 🚀 Architecture & Performance Upgrades

### 1. High Latency Live Streaming via HTTP POST (`ml_service/app.py`)
**Issue:** The frontend sends live webcam frames to `/predict/webcam` as Base64 encoded strings within HTTP POST requests. This causes severe overhead due to TCP/HTTP teardowns, header bloat, and base64 string expansion for every single frame, resulting in noticeable lag.
**Fix:** You already have `socket.io-client` installed! Refactor the webcam streaming to use WebSockets. A persistent socket connection allows for low-latency, binary transmission of frames without HTTP overhead.

### 2. Manual Routing overhead (`frontend/src/App.jsx`)
**Issue:** The application uses React state (`activeTab`) to switch between the Dashboard, VideoUpload, and WebcamStream components. This breaks browser functionality (like physical back/forward buttons) and prevents you from sharing direct links (e.g., `yourapp.com/webcam`).
**Fix:** You have `react-router-dom` in your `package.json`. Implement a `BrowserRouter` and use `<Route>` components. This will clean up `App.jsx` and enable a standard, robust URL-based navigation system.

### 3. Unpredictable Session Cleanup in Predictor (`ml_service/prediction/predictor.py`)
**Issue:** Old memory sessions are cleaned up using a randomized check: `if np.random.random() < 0.01: predictor.cleanup_old_sessions()`. This adds unexpected latency drops to random users' requests and is generally not a reliable way to manage memory.
**Fix:** Remove the probability check. Instead, run a periodic background thread using Python's `threading` or a scheduler like `APScheduler` that sweeps the `self.sessions` dictionary every 5 minutes asynchronously.

---

## 🛠 Code Quality & Maintainability

### 1. Magic Numbers in Model Logic (`ml_service/prediction/predictor.py`)
**Issue:** Deep within the human detection logic, there are hardcoded thresholds like `max_displacement > 45`, `ratio < 0.15`, and threshold blocks `threshold_to_build = 0.35`. 
**Fix:** Move these values into a JSON configuration file or environment variables, or at least define them as clearly named constants at the top of the file. This makes tweaking the model's sensitivity much easier without hunting through the massive `predict_frame` function.

### 2. Backend Request Logging (`backend/server.js`)
**Issue:** You're using an inline `console.log` middleware for routing. While okay for basic dev, it lacks severity levels, log rotation, and formatted outputs needed for a production server.
**Fix:** Implement a robust logging middleware like `morgan` for HTTP request logging, and `winston` for general application logging (so you can eventually write logs to a file securely).

### 3. File Cleanup Ghosting (`ml_service/app.py`)
**Issue:** In the video upload alert, you save a file `temp_incident.webm` and then have a comment: `# Give SMAL but of time for email thread to finish reading` followed by `pass`. This means the temporary video file is rarely effectively deleted, leading to hard drive bloat over time.
**Fix:** Use Python's `tempfile` module, or use a proper background task worker (like `Celery` or standard `threading`) to handle the email sending asynchronously, passing the file contents in memory or ensuring file deletion in a `finally` block after the thread terminates.

---

## 🪄 UI/UX 

### 1. Global State Management
**Issue:** The user state and token are manually passed from `App.jsx` to subcomponents (`<Navbar>`, `<Dashboard>`) through props.
**Fix:** Implement React's native `Context API` or a lightweight library like `Zustand`. This allows any deeply nested component to access `user` data without having to pass it through every parent layer.
