const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const rateLimit = require('express-rate-limit');
const alertController = require('../controllers/alertController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
    validateRegistration,
    validateLogin,
    validateAlertUpdate,
    validateAddNote,
} = require('../middleware/validation');

// ── Rate Limiters ─────────────────────────────────────────────────────────────
// Tight limit for auth endpoints — prevents brute-force & credential stuffing.
// skipSuccessfulRequests means only failed attempts count, so a legitimate user
// who logs in successfully never burns through the window.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,    // 15-minute sliding window
    max: 10,                      // max 10 failed attempts per IP per window
    skipSuccessfulRequests: true,
    standardHeaders: true,        // send RateLimit-* response headers
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many attempts from this IP. Please try again in 15 minutes.'
    }
});

// Broader limit for all other routes — basic DoS protection.
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP. Please slow down.'
    }
});

// Apply general limiter to every route in this router.
router.use(generalLimiter);

// ── Multer Storage ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// ── Auth Routes (public — no token required) ──────────────────────────────────
// authLimiter sits before validation so even malformed requests count toward
// the cap — prevents attackers from probing the validator cheaply.
const authController = require('../controllers/authController');
router.post('/register', authLimiter, validateRegistration, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);

// ── Webcam Proxy (authenticate only — all logged-in roles allowed) ────────────
// High-frequency route; only requires a valid session.
router.post('/webcam-proxy', authenticate, alertController.proxyWebcam);

// ── Alert Read Routes ─────────────────────────────────────────────────────────
// All authenticated users can view alerts.
router.get('/alerts', authenticate, alertController.getAlerts);
router.get('/alerts/:id', authenticate, alertController.getAlertById);

// ── Alert Write Routes ────────────────────────────────────────────────────────
// Any authenticated user can update status (e.g. CCTV operator marks resolved).
router.put('/alerts/:id', authenticate, validateAlertUpdate, alertController.updateAlertStatus);
router.post('/alerts/:id/notes', authenticate, validateAddNote, alertController.addNote);

// ── Alert Delete / Admin Bulk Actions ─────────────────────────────────────────
// Only admin can permanently delete or bulk-clear all records.
// Police + admin can delete individual alerts or clear history.
router.delete('/alerts/all', authenticate, authorize('admin'), alertController.deleteAllRecords);
router.delete('/alerts/history', authenticate, authorize('admin', 'police'), alertController.deleteAllHistory);
router.delete('/alerts/false-alarms', authenticate, authorize('admin', 'police'), alertController.deleteFalseAlarms);
router.delete('/alerts/:id', authenticate, authorize('admin', 'police'), alertController.deleteAlert);

// ── Video Analysis (authenticated — CCTV operators and above) ─────────────────
router.post('/analyze-video', authenticate, upload.single('video'), alertController.analyzeVideo);

// ── Incident Reporting ────────────────────────────────────────────────────────
// Any authenticated user can report an incident.
router.post('/report-case', authenticate, alertController.createAlert);
router.post('/report-incident', authenticate, upload.single('video'), alertController.reportIncident);

module.exports = router;
