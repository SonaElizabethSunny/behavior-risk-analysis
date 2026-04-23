import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = ({ onLogin }) => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const endpoint = isLogin ? '/api/login' : '/api/register';
        const url = import.meta.env.VITE_API_URL || 'http://localhost:4005';

        try {
            const res = await fetch(`${url}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Authentication failed');
            }

            if (isLogin) {
                onLogin(data.user, data.token);
                navigate('/dashboard');
            } else {
                alert('Account created! Placed in operator pending state.');
                setIsLogin(true);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-bg"></div>
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">
                        🛡️ Sentinel <span className="login-logo-highlight">AI</span>
                    </div>
                    <p className="login-subtitle">
                        {isLogin ? 'Sign in to access your security intelligence' : 'Create an operator account'}
                    </p>
                </div>

                {error && <div className="error-message">⚠️ {error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            autoComplete="off"
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        {!isLogin && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '8px', lineHeight: 1.4 }}>
                                Min. 8 characters • 1 Uppercase • 1 Number • 1 Symbol
                            </p>
                        )}
                    </div>

                    <button type="submit" className="auth-btn" disabled={isLoading}>
                        {isLoading ? 'Processing...' : (isLogin ? 'Authenticate securely' : 'Register Operator')}
                    </button>
                </form>

                <p className="switch-auth">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <span onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? 'Register' : 'Sign in'}
                    </span>
                </p>
            </div>
        </div>
    );
};

export default Login;
