import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ activeTab, setActiveTab, user, onLogout }) => {
    return (
        <nav className="navbar fade-in">
            <div className="logo-section">
                <span className="logo-icon">🛡️</span>
                <span className="logo-text">Sentinel <span className="logo-highlight">AI</span></span>
            </div>
            
            <div className="nav-links">
                <button
                    className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    Dashboard
                </button>

                {(user?.role === 'admin' || user?.role === 'police' || user?.role === 'cctv_user') && (
                    <button
                        className={`nav-btn ${activeTab === 'upload' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upload')}
                    >
                        Upload
                    </button>
                )}

                {(user?.role === 'admin' || user?.role === 'cctv_user') && (
                    <button
                        className={`nav-btn ${activeTab === 'webcam' ? 'active' : ''}`}
                        onClick={() => setActiveTab('webcam')}
                    >
                        Live Monitor
                    </button>
                )}
            </div>

            <div className="user-section">
                {user && (
                    <div className="user-profile">
                        <div className="user-details">
                            <span className="username">{user.username}</span>
                            <span className="user-role">{user.role}</span>
                        </div>
                        <div className="user-avatar">
                            {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                    </div>
                )}
                <button
                    className="logout-btn"
                    onClick={onLogout}
                >
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
