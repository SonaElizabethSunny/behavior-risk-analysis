import React, { useState, useEffect } from 'react';
import './IncidentReportModal.css';

// Auto-generate a case number: SEN-YYYYMMDD-XXXX
const generateCaseNumber = () => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `SEN-${date}-${rand}`;
};

const ACTION_OPTIONS = [
    'Arrest Made',
    'Warning Issued',
    'No Action Required',
    'Referred to Detective',
    'Other',
];

const IncidentReportModal = ({ isOpen, alert, onClose, onSubmit }) => {
    const [caseNumber] = useState(generateCaseNumber);
    const [officerName, setOfficerName] = useState('');
    const [badgeNumber, setBadgeNumber] = useState('');
    const [summary, setSummary] = useState('');
    const [actionTaken, setActionTaken] = useState(ACTION_OPTIONS[0]);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Reset form when modal opens with a new alert
    useEffect(() => {
        if (isOpen) {
            setOfficerName('');
            setBadgeNumber('');
            setSummary('');
            setActionTaken(ACTION_OPTIONS[0]);
            setErrors({});
            setSubmitting(false);
        }
    }, [isOpen, alert?._id]);

    if (!isOpen || !alert) return null;

    const locationText = alert.location
        ? `${alert.location.lat?.toFixed(5)}, ${alert.location.lon?.toFixed(5)}`
        : 'N/A';

    const timestampText = alert.timestamp
        ? new Date(alert.timestamp).toLocaleString()
        : 'N/A';

    const validate = () => {
        const errs = {};
        if (!officerName.trim()) errs.officerName = 'Officer name is required';
        if (!badgeNumber.trim()) errs.badgeNumber = 'Badge number is required';
        if (!summary.trim()) errs.summary = 'Incident summary is required';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        setSubmitting(true);
        try {
            await onSubmit({
                alertId: alert._id,
                caseNumber,
                incidentType: alert.behavior,
                location: locationText,
                officerName: officerName.trim(),
                badgeNumber: badgeNumber.trim(),
                summary: summary.trim(),
                actionTaken,
                dateTime: timestampText,
            });
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="irm-backdrop" onClick={handleBackdropClick}>
            <div className="irm-container" role="dialog" aria-modal="true" aria-labelledby="irm-title">
                {/* Header */}
                <div className="irm-header">
                    <div className="irm-header-icon">📋</div>
                    <div>
                        <h2 id="irm-title" className="irm-title">File Incident Report</h2>
                        <p className="irm-subtitle">Complete the report to resolve this incident</p>
                    </div>
                    <button className="irm-close-btn" onClick={onClose} aria-label="Close">✕</button>
                </div>

                <form className="irm-form" onSubmit={handleSubmit} noValidate>
                    <div className="irm-body">
                        {/* Row 1: Case Number + Incident Type */}
                        <div className="irm-row irm-row-2">
                            <div className="irm-field">
                                <label className="irm-label">Case Number</label>
                                <input
                                    className="irm-input irm-input-readonly"
                                    type="text"
                                    value={caseNumber}
                                    readOnly
                                    aria-label="Case Number (auto-generated)"
                                />
                            </div>
                            <div className="irm-field">
                                <label className="irm-label">Incident Type</label>
                                <input
                                    className="irm-input irm-input-readonly"
                                    type="text"
                                    value={alert.behavior || 'Unknown'}
                                    readOnly
                                    aria-label="Incident Type"
                                />
                            </div>
                        </div>

                        {/* Row 2: Location + Date & Time */}
                        <div className="irm-row irm-row-2">
                            <div className="irm-field">
                                <label className="irm-label">📍 Location</label>
                                <input
                                    className="irm-input irm-input-readonly"
                                    type="text"
                                    value={locationText}
                                    readOnly
                                    aria-label="Location"
                                />
                            </div>
                            <div className="irm-field">
                                <label className="irm-label">🕐 Date &amp; Time</label>
                                <input
                                    className="irm-input irm-input-readonly"
                                    type="text"
                                    value={timestampText}
                                    readOnly
                                    aria-label="Date and Time"
                                />
                            </div>
                        </div>

                        {/* Row 3: Officer Name + Badge Number */}
                        <div className="irm-row irm-row-2">
                            <div className="irm-field">
                                <label className="irm-label irm-required" htmlFor="irm-officer">
                                    Reporting Officer Name
                                </label>
                                <input
                                    id="irm-officer"
                                    className={`irm-input ${errors.officerName ? 'irm-input-error' : ''}`}
                                    type="text"
                                    value={officerName}
                                    onChange={(e) => { setOfficerName(e.target.value); setErrors(p => ({ ...p, officerName: '' })); }}
                                    placeholder="Full name"
                                    autoComplete="off"
                                />
                                {errors.officerName && <span className="irm-error-msg">{errors.officerName}</span>}
                            </div>
                            <div className="irm-field">
                                <label className="irm-label irm-required" htmlFor="irm-badge">
                                    Badge Number
                                </label>
                                <input
                                    id="irm-badge"
                                    className={`irm-input ${errors.badgeNumber ? 'irm-input-error' : ''}`}
                                    type="text"
                                    value={badgeNumber}
                                    onChange={(e) => { setBadgeNumber(e.target.value); setErrors(p => ({ ...p, badgeNumber: '' })); }}
                                    placeholder="e.g. PD-4521"
                                    autoComplete="off"
                                />
                                {errors.badgeNumber && <span className="irm-error-msg">{errors.badgeNumber}</span>}
                            </div>
                        </div>

                        {/* Action Taken */}
                        <div className="irm-field">
                            <label className="irm-label" htmlFor="irm-action">Action Taken</label>
                            <select
                                id="irm-action"
                                className="irm-select"
                                value={actionTaken}
                                onChange={(e) => setActionTaken(e.target.value)}
                            >
                                {ACTION_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        {/* Incident Summary */}
                        <div className="irm-field">
                            <label className="irm-label irm-required" htmlFor="irm-summary">
                                Incident Summary
                            </label>
                            <textarea
                                id="irm-summary"
                                className={`irm-textarea ${errors.summary ? 'irm-input-error' : ''}`}
                                value={summary}
                                onChange={(e) => { setSummary(e.target.value); setErrors(p => ({ ...p, summary: '' })); }}
                                placeholder="Describe the incident, observations, and any relevant details..."
                                rows={4}
                            />
                            {errors.summary && <span className="irm-error-msg">{errors.summary}</span>}
                        </div>

                        {/* Risk level badge display */}
                        <div className="irm-alert-info">
                            <span className="irm-info-label">Risk Level:</span>
                            <span className={`irm-risk-badge irm-risk-${alert.riskLevel?.toLowerCase()}`}>
                                {alert.riskLevel}
                            </span>
                            <span className="irm-info-label" style={{ marginLeft: '1rem' }}>Source:</span>
                            <span className="irm-info-value">{alert.videoName || 'Live Feed'}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="irm-footer">
                        <button
                            type="button"
                            className="irm-btn irm-btn-cancel"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="irm-btn irm-btn-submit"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <span className="irm-spinner">⟳ Submitting...</span>
                            ) : (
                                '✅ Submit Report & Resolve'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default IncidentReportModal;
