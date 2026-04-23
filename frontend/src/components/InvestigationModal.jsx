import React, { useState, useEffect } from 'react';
import './InvestigationModal.css';

const InvestigationModal = ({ isOpen, alert, onClose, onSubmit }) => {
    const [caseDetails, setCaseDetails] = useState('');
    const [officerNotes, setOfficerNotes] = useState('');
    const [officerName, setOfficerName] = useState('');
    const [priority, setPriority] = useState('High');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen && alert) {
            setCaseDetails('');
            setOfficerNotes('');
            setOfficerName('');
            const defaultPriority = alert.riskLevel === 'High' ? 'Critical' : 'High';
            setPriority(defaultPriority);
            setErrors({});
            setSubmitting(false);
        }
    }, [isOpen, alert?._id]);

    if (!isOpen || !alert) return null;

    const validate = () => {
        const errs = {};
        if (!caseDetails.trim()) errs.caseDetails = 'Case details are required';
        if (!officerName.trim()) errs.officerName = 'Officer name is required';
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
                caseDetails: caseDetails.trim(),
                officerNotes: officerNotes.trim(),
                officerName: officerName.trim(),
                priority,
            });
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    const getPriorityColor = (p) => {
        const colors = {
            Critical: '#ef4444',
            High: '#f97316',
            Medium: '#f59e0b',
            Low: '#22c55e',
        };
        return colors[p] || '#3b82f6';
    };

    return (
        <div className="inv-backdrop" onClick={handleBackdropClick}>
            <div
                className="inv-container"
                role="dialog"
                aria-modal="true"
                aria-labelledby="inv-report-title"
            >
                {/* ── HEADER ── */}
                <div className="inv-header">
                    <div className="inv-header-icon">📋</div>
                    <div>
                        <h2 id="inv-report-title" className="inv-title">
                            Investigation Report — Alert #{alert._id?.slice(-6) || ''}
                        </h2>
                        <p className="inv-subtitle">
                            {alert.behavior} • {alert.riskLevel} Risk
                        </p>
                    </div>
                    <button
                        className="inv-close-btn"
                        onClick={onClose}
                        aria-label="Close dialog"
                        type="button"
                    >
                        ✕
                    </button>
                </div>

                {/* ── FORM ── */}
                <form className="inv-form" onSubmit={handleSubmit} noValidate>
                    <div className="inv-body">

                        {/* ── Case Details ── */}
                        <div className="inv-field">
                            <label className="inv-label inv-required" htmlFor="case-details">
                                Case Details
                            </label>
                            <textarea
                                id="case-details"
                                className={`inv-textarea ${errors.caseDetails ? 'inv-input-error' : ''}`}
                                value={caseDetails}
                                onChange={(e) => {
                                    setCaseDetails(e.target.value);
                                    setErrors(p => ({ ...p, caseDetails: '' }));
                                }}
                                placeholder="What happened? Describe observations, actions taken, and any relevant context..."
                                rows={5}
                                aria-invalid={!!errors.caseDetails}
                                aria-describedby={errors.caseDetails ? 'case-details-error' : undefined}
                            />
                            {errors.caseDetails && (
                                <span id="case-details-error" className="inv-error-msg">
                                    {errors.caseDetails}
                                </span>
                            )}
                        </div>

                        {/* ── Officer Notes ── */}
                        <div className="inv-field">
                            <label className="inv-label" htmlFor="officer-notes">
                                Officer Notes
                                <span className="inv-optional">(optional)</span>
                            </label>
                            <textarea
                                id="officer-notes"
                                className="inv-textarea"
                                value={officerNotes}
                                onChange={(e) => setOfficerNotes(e.target.value)}
                                placeholder="Actions taken, people involved, follow-up required..."
                                rows={4}
                            />
                        </div>

                        {/* ── Officer Name + Priority ── */}
                        <div className="inv-row inv-row-2">
                            <div className="inv-field">
                                <label className="inv-label inv-required" htmlFor="officer-name">
                                    Officer Name
                                </label>
                                <input
                                    id="officer-name"
                                    className={`inv-input ${errors.officerName ? 'inv-input-error' : ''}`}
                                    type="text"
                                    value={officerName}
                                    onChange={(e) => {
                                        setOfficerName(e.target.value);
                                        setErrors(p => ({ ...p, officerName: '' }));
                                    }}
                                    placeholder="Full name"
                                    aria-invalid={!!errors.officerName}
                                    aria-describedby={errors.officerName ? 'officer-name-error' : undefined}
                                />
                                {errors.officerName && (
                                    <span id="officer-name-error" className="inv-error-msg">
                                        {errors.officerName}
                                    </span>
                                )}
                            </div>

                            <div className="inv-field">
                                <label className="inv-label" htmlFor="case-priority">
                                    Case Priority
                                </label>
                                <div className="inv-priority-wrapper">
                                    <span
                                        className="inv-priority-dot"
                                        style={{ background: getPriorityColor(priority) }}
                                    />
                                    <select
                                        id="case-priority"
                                        className="inv-select inv-select-priority"
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        style={{ color: getPriorityColor(priority) }}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* ── Info Strip ── */}
                        <div className="inv-info-strip">
                            <div className="inv-info-item">
                                <span className="inv-info-label">Detected Behavior</span>
                                <span className="inv-info-value">{alert.behavior}</span>
                            </div>
                            <div className="inv-info-divider" />
                            <div className="inv-info-item">
                                <span className="inv-info-label">Risk Level</span>
                                <span
                                    className="inv-risk-badge"
                                    style={{
                                        color: alert.riskLevel === 'High' ? '#ef4444' :
                                            alert.riskLevel === 'Medium' ? '#f59e0b' : '#22c55e'
                                    }}
                                >
                                    {alert.riskLevel}
                                </span>
                            </div>
                            <div className="inv-info-divider" />
                            <div className="inv-info-item">
                                <span className="inv-info-label">Timestamp</span>
                                <span className="inv-info-value">
                                    {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'N/A'}
                                </span>
                            </div>
                        </div>

                    </div>{/* closes inv-body */}

                    {/* ── FOOTER ── */}
                    <div className="inv-footer">
                        <button
                            type="button"
                            className="inv-btn inv-btn-cancel"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="inv-btn inv-btn-submit"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="inv-spinner" /> Submitting...
                                </>
                            ) : (
                                '✓ Submit Investigation'
                            )}
                        </button>
                    </div>{/* closes inv-footer */}

                </form>{/* closes inv-form */}

            </div>{/* closes inv-container */}
        </div> /* closes inv-backdrop */
    );
};

export default InvestigationModal;