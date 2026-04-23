import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import './Profile.css';

const Profile = ({ user, onUserUpdate }) => {
    const navigate = useNavigate();
    const toast = useToast();

    const [profile, setProfile] = useState({
        username: user?.username || '',
        email: user?.email || '',
        phone: user?.phone || '',
        role: user?.role || ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        smsNotifications: true,
        alertThreshold: 'medium'
    });

    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [profileLoading, setProfileLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setProfileLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                toast.error('Please login to view profile');
                navigate('/login');
                return;
            }

            const response = await api.get('/api/profile');

            if (response.data && response.data.user) {
                setProfile(response.data.user);
                setPreferences(response.data.preferences || preferences);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);

            // If unauthorized, redirect to login (handled by api interceptor too)
            if (error.response?.status === 401) {
                toast.error('Session expired. Please login again.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
                return;
            }

            // Use existing user data if API fails but we have local data
            if (user) {
                setProfile({
                    username: user.username,
                    email: user.email || '',
                    phone: user.phone || '',
                    role: user.role
                });
                // Silently use cached data without notification
            } else {
                toast.error('Failed to load profile');
            }
        } finally {
            setProfileLoading(false);
        }
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validatePhone = (phone) => {
        // Basic phone validation (allows digits, spaces, dashes, parentheses, +)
        return /^[\d\s\-+()]{10,}$/.test(phone);
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setValidationErrors({});

        // Validation
        const errors = {};
        if (profile.email && !validateEmail(profile.email)) {
            errors.email = 'Please enter a valid email address';
        }
        if (profile.phone && profile.phone.trim() !== '' && !validatePhone(profile.phone)) {
            errors.phone = 'Please enter a valid phone number (min 10 digits)';
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            toast.warning('Please correct the errors in the form');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.put('/api/profile', profile);

            // Update local storage
            const updatedUser = { ...user, ...profile };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            if (onUserUpdate) onUserUpdate(updatedUser);

            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await api.put('/api/profile/password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            toast.success('Password changed successfully');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handlePreferencesUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.put('/api/profile/preferences', preferences);
            toast.success('Preferences updated successfully');
        } catch (error) {
            toast.error('Failed to update preferences');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h2>⚙️ Profile Settings</h2>
                <p>Manage your account information and preferences</p>
            </div>

            {/* ── Identity Card ── */}
            <div className="profile-identity-card">
                <div className="profile-avatar-large">
                    {profile.username ? profile.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="profile-identity-info">
                    <div className="profile-identity-name">{profile.username}</div>
                    <span className="profile-role-badge">{profile.role || 'operator'}</span>
                </div>
            </div>

            <div className="profile-grid">
                {/* Personal Information */}
                <div className="profile-section glass-panel">
                    <h3>👤 Personal Information</h3>
                    <form onSubmit={handleProfileUpdate}>
                        <div className="form-group">
                            <label>Username</label>
                            <input
                                type="text"
                                value={profile.username}
                                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                disabled
                                className="form-input"
                            />
                            <small>Username cannot be changed</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                className={`form-input ${validationErrors.email ? 'input-error' : ''}`}
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                placeholder="your.email@example.com"
                            />
                            {validationErrors.email && <span className="error-text">{validationErrors.email}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">Phone Number</label>
                            <input
                                type="tel"
                                id="phone"
                                className={`form-input ${validationErrors.phone ? 'input-error' : ''}`}
                                value={profile.phone}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                placeholder="+1 234 567 8900"
                            />
                            {validationErrors.phone && <span className="error-text">{validationErrors.phone}</span>}
                        </div>

                        <div className="form-group">
                            <label>Role</label>
                            <input
                                type="text"
                                value={profile.role}
                                disabled
                                className="form-input"
                            />
                            <small>Role is assigned by administrator</small>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Profile'}
                        </button>
                    </form>
                </div>

                {/* Change Password */}
                <div className="profile-section glass-panel">
                    <h3>🔐 Change Password</h3>
                    <form onSubmit={handlePasswordChange}>
                        <div className="form-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className="form-input"
                                required
                                minLength="6"
                            />
                            <small>Minimum 6 characters</small>
                        </div>

                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="form-input"
                                required
                            />
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Changing...' : 'Change Password'}
                        </button>
                    </form>
                </div>

                {/* Notification Preferences */}
                <div className="profile-section glass-panel">
                    <h3>🔔 Notification Preferences</h3>
                    <form onSubmit={handlePreferencesUpdate}>
                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={preferences.emailNotifications}
                                    onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                                />
                                <span>Email Notifications</span>
                            </label>
                            <small>Receive alerts via email</small>
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={preferences.smsNotifications}
                                    onChange={(e) => setPreferences({ ...preferences, smsNotifications: e.target.checked })}
                                />
                                <span>SMS Notifications</span>
                            </label>
                            <small>Receive alerts via SMS</small>
                        </div>

                        <div className="form-group">
                            <label>Alert Threshold</label>
                            <select
                                value={preferences.alertThreshold}
                                onChange={(e) => setPreferences({ ...preferences, alertThreshold: e.target.value })}
                                className="form-input"
                            >
                                <option value="low">Low - All Alerts</option>
                                <option value="medium">Medium - Medium & High Risk</option>
                                <option value="high">High - High Risk Only</option>
                            </select>
                            <small>Minimum risk level for notifications</small>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Preferences'}
                        </button>
                    </form>
                </div>

                {/* Account Actions */}
                <div className="profile-section glass-panel">
                    <h3>⚡ Quick Actions</h3>
                    <div className="action-buttons">
                        <button
                            className="btn-secondary"
                            onClick={() => navigate('/dashboard')}
                        >
                            ← Back to Dashboard
                        </button>
                        <button
                            className="btn-danger"
                            onClick={() => {
                                if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                                    toast.warning('Account deletion is not yet implemented');
                                }
                            }}
                        >
                            🗑️ Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
