import React, { useState } from 'react';
import api from '../utils/api';
import './VideoUpload.css';

const VideoUpload = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setResult(null);
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setResult(null);
        const formData = new FormData();
        formData.append('video', file);

        try {
            const response = await api.post('/api/analyze-video', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            console.log("API Response:", response.data);
            setResult(response.data);
            setUploading(false);
        } catch (error) {
            console.error("Upload failed", error);
            console.error("Error response:", error.response?.data);
            setUploading(false);
            alert(`Upload failed: ${error.response?.data?.error || error.message}`);
        }
    };

    const handleSaveToDashboard = async (incident) => {
        try {
            const reportData = {
                videoName: file ? file.name : "Uploaded Video",
                behavior: `${incident.behavior} (${incident.start_time} - ${incident.end_time})`,
                riskLevel: incident.risk_level,
                confidence: incident.peak_confidence,
                timestamp: new Date().toISOString()
            };

            await api.post('/api/report-case', reportData);
            alert("Incident saved to Dashboard successfully!");
        } catch (error) {
            console.error("Save failed", error);
            alert("Failed to save incident to dashboard.");
        }
    };

    return (
        <div className="upload-page-wrapper">
            <div className="upload-container">
                <div className="upload-header">
                    <h2 className="upload-title">📁 Upload Video File</h2>
                    <p className="upload-subtitle">Upload footage for AI-powered behavior analysis</p>
                </div>

                <div className="upload-area" onClick={() => document.getElementById('video-input').click()}>
                    <div className="upload-icon-wrapper">📤</div>
                    <p className="upload-text-main">Drop video here, or click to browse</p>
                    <p className="upload-text-sub">MP4, AVI, MKV, MOV supported</p>
                    <input type="file" accept="video/*" onChange={handleFileChange} id="video-input" className="file-input" />
                    {file && <span className="file-label">📎 {file.name}</span>}
                </div>

                <button className="action-btn" onClick={handleUpload} disabled={!file || uploading} style={{ width: '100%' }}>
                    {uploading ? '⏳ Analyzing...' : '🔍 Analyze Video'}
                </button>

                {uploading && (
                    <div className="analyzing-message" style={{ marginTop: '1.5rem' }}>
                        <div className="progress-bar-bg">
                            <div className="progress-bar-fill" />
                        </div>
                        <p className="progress-status">Scanning for behavioral incidents…</p>
                    </div>
                )}

                {result && (
                    <div className="result-section" style={{ marginTop: '30px' }}>
                        <div className="result-header">
                            <h3>Detection Results</h3>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    ⏱️ Duration: {result.video_duration}
                                </span>
                                {result.overall_risk === 'Low' && result.total_incidents === 0 ? (
                                    <div className="safety-badge safety-green">✓ Video is Safe</div>
                                ) : (
                                    <div className={`risk-badge risk-${result.overall_risk?.toLowerCase()}`}>
                                        {result.overall_risk} Risk
                                    </div>
                                )}
                            </div>
                        </div>

                        {result.total_incidents === 0 ? (
                            <div className="no-incidents-message">
                                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>✅</div>
                                <p>No violent incidents detected. The video is safe.</p>
                            </div>
                        ) : (
                            <>
                                <div className="incidents-summary">
                                    🚨 {result.total_incidents} incident{result.total_incidents !== 1 ? 's' : ''} detected
                                </div>
                                <div className="incidents-grid">
                                    {result.incidents.map((incident, idx) => (
                                        <div key={idx} className={`incident-card risk-level-${incident.risk_level?.toLowerCase()}`}>
                                            <div className="incident-header">
                                                <div className="incident-title">
                                                    <span className="behavior-label">{incident.behavior}</span>
                                                    <span className="incident-time">
                                                        {incident.start_time} → {incident.end_time}
                                                    </span>
                                                </div>
                                                <div className={`incident-risk-badge ${incident.risk_level?.toLowerCase()}`}>
                                                    {incident.risk_level}
                                                </div>
                                            </div>

                                            <div className="confidence-section">
                                                <div className="confidence-label">
                                                    <span>Confidence</span>
                                                    <span className="confidence-value">
                                                        {Math.round(incident.peak_confidence * 100)}%
                                                    </span>
                                                </div>
                                                <div className="confidence-bar-container">
                                                    <div
                                                        className="confidence-bar-fill"
                                                        style={{
                                                            width: `${incident.peak_confidence * 100}%`,
                                                            background: incident.peak_confidence > 0.7
                                                                ? 'var(--color-danger)'
                                                                : 'var(--color-warning)'
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="incident-details">
                                                <div className="detail-item">
                                                    <span className="detail-label">Peak</span>
                                                    <span>{(incident.peak_confidence * 100).toFixed(1)}%</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="detail-label">Avg</span>
                                                    <span>{(incident.avg_confidence * 100).toFixed(1)}%</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="detail-label">Frames</span>
                                                    <span>{incident.duration_frames}</span>
                                                </div>
                                            </div>

                                            <button
                                                className="save-to-dashboard-btn"
                                                onClick={() => handleSaveToDashboard(incident)}
                                            >
                                                💾 Save to Dashboard
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoUpload;
