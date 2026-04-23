/**
 * socket.js — Socket.IO singleton
 * ================================
 * Initialised once in server.js, then imported anywhere that needs to emit.
 * This pattern avoids circular requires between server.js and controllers.
 *
 * Usage:
 *   // In server.js (setup):
 *   const { init } = require('./socket');
 *   init(httpServer);
 *
 *   // In any controller (emit):
 *   const { getIO } = require('../socket');
 *   getIO().emit('alert:new', alertPayload);
 */

let _io = null;

/**
 * Attach socket.io to an existing HTTP server.
 * Must be called once before any controller tries to emit.
 */
const init = (httpServer) => {
    const { Server } = require('socket.io');
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

    _io = new Server(httpServer, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    _io.on('connection', (socket) => {
        console.log(`🔌 Dashboard client connected: ${socket.id}`);
        socket.on('disconnect', () => {
            console.log(`🔌 Dashboard client disconnected: ${socket.id}`);
        });
    });

    return _io;
};

/**
 * Return the initialised io instance.
 * Throws a helpful error if called before init().
 */
const getIO = () => {
    if (!_io) {
        throw new Error('Socket.IO has not been initialised. Call init(httpServer) in server.js first.');
    }
    return _io;
};

module.exports = { init, getIO };
