import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './PublicHeader.css';

const PublicHeader = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const publicLinks = [
        { path: '/', label: 'Home' },
        { path: '/about', label: 'About' },
        { path: '/services', label: 'Services' },
        { path: '/contact', label: 'Contact' }
    ];

    const authenticatedLinks = [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/webcam', label: 'Live Monitor', roles: ['admin', 'cctv_user'] },
        { path: '/upload', label: 'Upload', roles: ['admin', 'police', 'cctv_user'] },
        { path: '/profile', label: 'Profile' }
    ];

    const isActive = (path) => {
        return location.pathname === path;
    };

    const canAccessLink = (link) => {
        if (!link.roles) return true;
        return link.roles.includes(user?.role);
    };

    return (
        <header className="public-header">
            <div className="header-container">
                {/* Logo */}
                <div className="header-logo" onClick={() => navigate(user ? '/dashboard' : '/')}>
                    <div className="logo-icon">🛡️</div>
                    <div className="logo-text">
                        <span className="logo-name">Sentinel AI</span>
                        <span className="logo-tagline">Security Intelligence</span>
                    </div>
                </div>

                {/* Desktop Navigation */}
                <nav className="header-nav desktop-nav">
                    {!user ? (
                        // Public navigation
                        <>
                            {publicLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </>
                    ) : (
                        // Authenticated navigation
                        <>
                            {authenticatedLinks.map((link) => (
                                canAccessLink(link) && (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
                                    >
                                        {link.label}
                                    </Link>
                                )
                            ))}
                        </>
                    )}
                </nav>

                {/* Auth Buttons */}
                <div className="header-actions">
                    {!user ? (
                        <button className="btn-login" onClick={() => navigate('/login')}>
                            Login
                        </button>
                    ) : (
                        <div className="user-menu">
                            <div className="user-info">
                                <div className="user-avatar">
                                    {user.username?.charAt(0).toUpperCase()}
                                </div>
                                <div className="user-details">
                                    <span className="user-name">{user.username}</span>
                                    <span className="user-role">{user.role}</span>
                                </div>
                            </div>
                            <button className="btn-logout" onClick={onLogout}>
                                Logout
                            </button>
                        </div>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button
                        className="mobile-menu-toggle"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? '✕' : '☰'}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
                <nav className="mobile-nav">
                    {!user ? (
                        <>
                            {publicLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`mobile-nav-link ${isActive(link.path) ? 'active' : ''}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </>
                    ) : (
                        <>
                            {authenticatedLinks.map((link) => (
                                canAccessLink(link) && (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={`mobile-nav-link ${isActive(link.path) ? 'active' : ''}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                )
                            ))}
                        </>
                    )}
                </nav>
            )}
        </header>
    );
};

export default PublicHeader;
