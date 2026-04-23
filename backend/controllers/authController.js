const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT_SECRET is guaranteed to be set — server.js exits at startup if it is missing.
const JWT_SECRET = process.env.JWT_SECRET;

// Register a new user
exports.register = async (req, res) => {
    try {
        // Note: role is intentionally NOT read from req.body.
        // All self-registered accounts start as 'cctv_user'.
        // Only an admin can elevate a user's role after creation.
        const { username, password } = req.body;
        console.log(`📝 Registration attempt: ${username}`);

        // Check if username is already taken
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already taken. Please choose another.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Always create as cctv_user regardless of what the client sends
        const newUser = new User({
            username,
            password: hashedPassword,
            role: 'cctv_user'
        });

        await newUser.save();
        console.log(`✅ New user registered: ${username} (cctv_user)`);

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { id: user._id, role: user.role, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Middleware to verify token (optional export for now)
exports.verifyToken = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(400).json({ message: 'Token is not valid' });
    }
};
