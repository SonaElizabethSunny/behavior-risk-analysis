const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const socketManager = require('./socket');

// ── Startup environment guard ─────────────────────────────────────────────────
// Check required secrets before anything else is initialised.
// Failing loudly here is far safer than running with a known fallback key.
if (!process.env.JWT_SECRET) {
    console.error('\n❌ FATAL: JWT_SECRET is not set in your environment.');
    console.error('   Generate one with:');
    console.error('   node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    console.error('   Then add it to backend/.env as: JWT_SECRET=<value>\n');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 4005;

// Middleware
app.use(cors());
// Request logger (console only — never write to disk log files)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const apiRoutes = require('./routes/api');
app.get('/', (req, res) => res.send('✓ Sentinel AI Backend is Alive and Logging!'));
app.use('/api', apiRoutes);

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/behavior_risk_db';

console.log('🔗 Attempting MongoDB connection...');
console.log('📍 URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')); // Hide password in logs

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 15000, // Give Atlas enough time to connect
    socketTimeoutMS: 45000,
})
    .then(() => {
        console.log('✅ MongoDB Connected Successfully!');
        console.log('📊 Database:', mongoose.connection.name);
        console.log('🌐 Host:', mongoose.connection.host + ':' + mongoose.connection.port);
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Failed!');
        console.error('📋 Error:', err.message);

        if (err.message.includes('ECONNREFUSED')) {
            console.error('💡 MongoDB is not running. Please:');
            console.error('   1. Install MongoDB (see MONGODB_SETUP.md)');
            console.error('   2. Or use MongoDB Atlas cloud service');
            console.error('   3. System will use in-memory storage as fallback');
        } else if (err.message.includes('authentication failed')) {
            console.error('💡 Check your MongoDB username/password in .env');
        } else if (err.message.includes('timed out')) {
            console.error('💡 Check your network connection and firewall settings');
        }

        console.warn('⚠️ Running with IN-MEMORY storage (data will be lost on restart)');
    });

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected. Using in-memory storage.');
});

mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected successfully!');
});

// Start Server — must use http.createServer so Socket.IO
// can share the same port as the REST API.
const server = http.createServer(app);
socketManager.init(server);

server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🔌 Socket.IO ready for dashboard connections`);
});

