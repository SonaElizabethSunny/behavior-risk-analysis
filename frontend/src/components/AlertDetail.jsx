import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './AlertDetail.css';
import { useToast } from './Toast';

const AlertDetail = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState('');

    useEffect(() => {
        fetchAlertDetail();
    }, [id]);

    const fetchAlertDetail = async () => {
        try {
            const response = await api.get(`/api/alerts/${id}`);
            setAlert(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching alert:', error);
            toast.error('Failed to load alert details');
            setLoading(false);
        }
    };

    const updateStatus = async (newStatus) => {
        try {
            await api.put(`/api/alerts/${id}`, { status: newStatus });
            setAlert({ ...alert, status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const addNote = async () => {
        if (!note.trim()) return;

        try {
            await api.post(`/api/alerts/${id}/notes`, { note, user: user?.username });
            toast.success('Note added successfully');
            setNote('');
            fetchAlertDetail(); // Refresh to get updated notes
        } catch (error) {
            toast.error('Failed to add note');
        }
    };

    if (loading) {
        return (
            <div className="alert-detail-container">
                <div className="loading">Loading alert details...</div>
            </div>
        );
    }

    if (!alert) {
        return (
            <div className="alert-detail-container">
                <div className="error-state">Alert not found</div>
                <button className="back-btn" onClick={() => navigate('/dashboard')}>
                    ← Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="alert-detail-container">
            {/* Header */}
            <div className="detail-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    ← Back
                </button>
                <h2 className="detail-title">
                    Alert Details
                    <span className={`risk-badge risk-${alert.riskLevel?.toLowerCase()}`}>
                        {alert.riskLevel} Risk
                    </span>
                </h2>
            </div>

            <div className="detail-grid">
                {/* Main Content */}
                <div className="detail-main">
                    {/* Video Player */}
                    {alert.videoClip && (
                        <div className="video-section glass-panel">
                            <h3>📹 Incident Video</h3>
                            <video
                                controls
                                className="incident-video"
                                src={`${api.defaults.baseURL}${alert.videoClip}`}
                            >
                                Your browser does not support video playback.
                            </video>
                        </div>
                    )}

                    {/* Alert Information */}
                    <div className="info-section glass-panel">
                        <h3>📋 Alert Information</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">Behavior Detected:</span>
                                <span className="info-value">{alert.behavior}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Risk Level:</span>
                                <span className={`badge risk-${alert.riskLevel?.toLowerCase()}`}>
                                    {alert.riskLevel}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Status:</span>
                                <span className={`badge status-${alert.status?.toLowerCase().replace(' ', '-')}`}>
                                    {alert.status}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Timestamp:</span>
                                <span className="info-value">
                                    {new Date(alert.timestamp).toLocaleString()}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Video Source:</span>
                                <span className="info-value">{alert.videoName || 'Live Feed'}</span>
                            </div>
                            {alert.location && (
                                <div className="info-item full-width">
                                    <span className="info-label">Location:</span>
                                    <span className="info-value">
                                        📍 Lat: {alert.location.lat}, Lon: {alert.location.lon}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Event Details */}
                    {alert.events && alert.events.length > 0 && (
                        <div className="events-section glass-panel">
                            <h3>⏱️ Event Timeline</h3>
                            <div className="timeline">
                                {alert.events.map((event, index) => (
                                    <div key={index} className="timeline-item">
                                        <div className="timeline-marker"></div>
                                        <div className="timeline-content">
                                            <div className="timeline-time">{event.time}s</div>
                                            <div className="timeline-behavior">{event.behavior}</div>
                                            <div className="timeline-risk">
                                                Risk: <span className={`risk-${event.risk?.toLowerCase()}`}>
                                                    {event.risk}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes Section */}
                    <div className="notes-section glass-panel">
                        <h3>📝 Notes & Comments</h3>

                        {/* Add Note */}
                        <div className="add-note">
                            <textarea
                                className="note-input"
                                placeholder="Add a note or comment..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows="3"
                            />
                            <button
                                className="add-note-btn"
                                onClick={addNote}
                                disabled={!note.trim()}
                            >
                                Add Note
                            </button>
                        </div>

                        {/* Notes List */}
                        {alert.notes && alert.notes.length > 0 ? (
                            <div className="notes-list">
                                {alert.notes.map((n, index) => (
                                    <div key={index} className="note-item">
                                        <div className="note-header">
                                            <span className="note-author">{n.user || 'Unknown'}</span>
                                            <span className="note-time">
                                                {new Date(n.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="note-content">{n.note}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-notes">No notes yet</div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="detail-sidebar">
                    {/* Quick Actions */}
                    <div className="actions-panel glass-panel">
                        <h3>⚡ Quick Actions</h3>
                        <div className="action-buttons">
                            <button
                                className="action-btn status-pending"
                                onClick={() => updateStatus('Pending')}
                                disabled={alert.status === 'Pending'}
                            >
                                ⏳ Mark Pending
                            </button>
                            <button
                                className="action-btn status-investigating"
                                onClick={() => updateStatus('Investigating')}
                                disabled={alert.status === 'Investigating'}
                            >
                                🔍 Investigating
                            </button>
                            <button
                                className="action-btn status-verified"
                                onClick={() => updateStatus('Verified')}
                                disabled={alert.status === 'Verified'}
                            >
                                ✓ Verified
                            </button>
                            {user?.role !== 'police' && (
                                <button
                                    className="action-btn status-reported"
                                    onClick={() => updateStatus('Reported')}
                                    disabled={alert.status === 'Reported'}
                                >
                                    🚔 Report to Police
                                </button>
                            )}
                            <button
                                className="action-btn status-resolved"
                                onClick={() => updateStatus('Resolved')}
                                disabled={alert.status === 'Resolved'}
                            >
                                ✅ Resolved
                            </button>
                            <button
                                className="action-btn status-false"
                                onClick={() => updateStatus('False Alarm')}
                                disabled={alert.status === 'False Alarm'}
                            >
                                ❌ False Alarm
                            </button>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="summary-panel glass-panel">
                        <h3>📊 Summary</h3>
                        <div className="summary-items">
                            <div className="summary-item">
                                <span className="summary-label">Alert ID:</span>
                                <span className="summary-value">#{alert._id?.slice(-6)}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Created:</span>
                                <span className="summary-value">
                                    {new Date(alert.timestamp).toLocaleDateString()}
                                </span>
                            </div>
                            {alert.events && (
                                <div className="summary-item">
                                    <span className="summary-label">Events:</span>
                                    <span className="summary-value">{alert.events.length}</span>
                                </div>
                            )}
                            {alert.notes && (
                                <div className="summary-item">
                                    <span className="summary-label">Notes:</span>
                                    <span className="summary-value">{alert.notes.length}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlertDetail;
