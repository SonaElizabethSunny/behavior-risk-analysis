/**
 * Authentication & Authorization Middleware
 * ==========================================
 * authenticate  — verifies the JWT in the Authorization header.
 *                 On success it attaches req.user = { id, username, role }.
 *                 On failure it returns 401.
 *
 * authorize     — factory that returns a middleware checking req.user.role
 *                 against an allowed roles list.  Must come AFTER authenticate.
 *
 * Usage in routes:
 *   const { authenticate, authorize } = require('../middleware/authMiddleware');
 *
 *   router.get('/alerts',         authenticate,                      ctrl.getAlerts);
 *   router.delete('/alerts/all',  authenticate, authorize('admin'),  ctrl.deleteAllRecords);
 */

const jwt = require('jsonwebtoken');

// JWT_SECRET is guaranteed to be set — server.js exits at startup if it is missing.
const JWT_SECRET = process.env.JWT_SECRET;

// ── authenticate ─────────────────────────────────────────────────────────────
// Reads "Authorization: Bearer <token>" from the request header.
// Populates req.user on success; returns 401 on any failure.
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Normalise both spellings (id / userId) that may exist in old tokens
        req.user = {
            id: decoded.id || decoded.userId,
            username: decoded.username,
            role: decoded.role
        };
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired. Please log in again.'
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};

// ── authorize ─────────────────────────────────────────────────────────────────
// Factory: authorize('admin')  or  authorize('admin', 'police')
// Must be used AFTER authenticate so that req.user is populated.
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated.'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Requires role: ${roles.join(' or ')}.`
            });
        }

        next();
    };
};

module.exports = { authenticate, authorize };
