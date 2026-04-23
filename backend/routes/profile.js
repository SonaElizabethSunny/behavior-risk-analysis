const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Assuming you have a User model
const bcrypt = require('bcryptjs');

const { authenticate } = require('../middleware/authMiddleware');

// GET /api/profile - Get user profile
router.get('/', authenticate, async (req, res) => {
    try {
        console.log('📋 Profile request for user ID:', req.user.id);

        let user = null;

        // Try MongoDB first
        try {
            user = await User.findById(req.user.id).select('-password').timeout(2000);
            if (user) {
                console.log('✅ User found in MongoDB');
            }
        } catch (dbErr) {
            console.warn('⚠️ MongoDB query failed, checking in-memory storage');
        }

        // Fallback to in-memory users if MongoDB fails
        if (!user) {
            // Import in-memory users from authController
            const authController = require('../controllers/authController');
            const inMemoryUsers = authController.inMemoryUsers || [];
            user = inMemoryUsers.find(u => u._id === req.user.id);

            if (user) {
                console.log('✅ User found in in-memory storage');
                // Convert to object format similar to MongoDB
                user = {
                    _id: user._id,
                    username: user.username,
                    email: user.email || '',
                    phone: user.phone || '',
                    role: user.role,
                    preferences: user.preferences || {
                        emailNotifications: true,
                        smsNotifications: true,
                        alertThreshold: 'medium'
                    }
                };
            }
        }

        if (!user) {
            console.error('❌ User not found anywhere');
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            user: {
                username: user.username,
                email: user.email || '',
                phone: user.phone || '',
                role: user.role
            },
            preferences: user.preferences || {
                emailNotifications: true,
                smsNotifications: true,
                alertThreshold: 'medium'
            }
        });
    } catch (error) {
        console.error('❌ Error fetching profile:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// PUT /api/profile - Update user profile
router.put('/', authenticate, async (req, res) => {
    try {
        const { email, phone } = req.body;
        console.log('📝 Updating profile for user ID:', req.user.id);

        let user = null;

        // Try MongoDB first
        try {
            user = await User.findByIdAndUpdate(
                req.user.id,
                {
                    email,
                    phone,
                    updatedAt: new Date()
                },
                { new: true }
            ).select('-password').timeout(2000);

            if (user) {
                console.log('✅ Profile updated in MongoDB');
                return res.json({
                    message: 'Profile updated successfully',
                    user: {
                        username: user.username,
                        email: user.email,
                        phone: user.phone,
                        role: user.role
                    }
                });
            }
        } catch (dbErr) {
            console.warn('⚠️ MongoDB update failed, trying in-memory storage');
        }

        // Fallback to in-memory users
        const authController = require('../controllers/authController');
        const inMemoryUsers = authController.inMemoryUsers || [];
        const userIndex = inMemoryUsers.findIndex(u => u._id === req.user.id);

        if (userIndex !== -1) {
            inMemoryUsers[userIndex].email = email;
            inMemoryUsers[userIndex].phone = phone;
            inMemoryUsers[userIndex].updatedAt = new Date();

            console.log('✅ Profile updated in in-memory storage');

            return res.json({
                message: 'Profile updated successfully (in-memory)',
                user: {
                    username: inMemoryUsers[userIndex].username,
                    email: inMemoryUsers[userIndex].email,
                    phone: inMemoryUsers[userIndex].phone,
                    role: inMemoryUsers[userIndex].role
                }
            });
        }

        return res.status(404).json({ message: 'User not found' });
    } catch (error) {
        console.error('❌ Error updating profile:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// PUT /api/profile/password - Change password
router.put('/password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new password required' });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedPassword;
        user.updatedAt = new Date();
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/profile/preferences - Update notification preferences
router.put('/preferences', authenticate, async (req, res) => {
    try {
        const { emailNotifications, smsNotifications, alertThreshold } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                preferences: {
                    emailNotifications,
                    smsNotifications,
                    alertThreshold
                },
                updatedAt: new Date()
            },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Preferences updated successfully',
            preferences: user.preferences
        });
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
