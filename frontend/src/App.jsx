import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import { ToastProvider } from './components/Toast';
import PublicHeader from './components/PublicHeader';
import LandingPage from './components/LandingPage';
import AboutPage from './components/AboutPage';
import ServicesPage from './components/ServicesPage';
import ContactPage from './components/ContactPage';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AlertDetail from './components/AlertDetail';
import VideoUpload from './components/VideoUpload';
import WebcamStream from './components/WebcamStream';
import Profile from './components/Profile';
import ScrollToTop from './components/ScrollToTop';
import './index.css';

// ── Inner app with router context ─────────────────────────────────────────
function AppInner() {
    const navigate = useNavigate();

    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
    });
    const [token, setToken] = useState(() => localStorage.getItem('token'));

    const handleLogin = (userData, authToken) => {
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(authToken);
        setUser(userData);
        navigate('/dashboard');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        navigate('/');
    };

    // Route guards
    const PrivateRoute = ({ children, roles }) => {
        if (!token) return <Navigate to="/login" replace />;
        if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
        return children;
    };

    const PublicOnlyRoute = ({ children }) => {
        if (token) return <Navigate to="/dashboard" replace />;
        return children;
    };

    return (
        <>
            <ScrollToTop />
            <PublicHeader user={user} onLogout={handleLogout} />

            <Routes>
                {/* ── Public pages ── */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/contact" element={<ContactPage />} />

                {/* ── Auth ── */}
                <Route path="/login" element={
                    <PublicOnlyRoute>
                        <Login onLogin={handleLogin} />
                    </PublicOnlyRoute>
                } />

                {/* ── Protected pages ── */}
                <Route path="/dashboard" element={
                    <PrivateRoute>
                        <Dashboard user={user} />
                    </PrivateRoute>
                } />

                <Route path="/alerts/:id" element={
                    <PrivateRoute>
                        <AlertDetail user={user} />
                    </PrivateRoute>
                } />

                <Route path="/webcam" element={
                    <PrivateRoute roles={['admin', 'cctv_user']}>
                        <WebcamStream />
                    </PrivateRoute>
                } />

                <Route path="/upload" element={
                    <PrivateRoute roles={['admin', 'police', 'cctv_user']}>
                        <VideoUpload />
                    </PrivateRoute>
                } />

                <Route path="/profile" element={
                    <PrivateRoute>
                        <Profile user={user} token={token} />
                    </PrivateRoute>
                } />

                {/* ── Fallback ── */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

// ── Root: BrowserRouter + ToastProvider ───────────────────────────────────
function App() {
    return (
        <BrowserRouter>
            <ToastProvider>
                <AppInner />
            </ToastProvider>
        </BrowserRouter>
    );
}

export default App;
