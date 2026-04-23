import React, { useMemo } from 'react';
import './StatsCard.css';

const StatItem = ({ icon, value, label, type }) => (
    <div className={`stat-card glass-card stat-${type}`}>
        <div className="stat-content">
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
        </div>
        <div className="stat-icon-wrapper">
            <span className="stat-icon">{icon}</span>
        </div>
        <div className="stat-glow"></div>
    </div>
);

const StatsCard = ({ alerts = [] }) => {
    const stats = useMemo(() => {
        const total = alerts.length;
        const highRisk = alerts.filter(a => a.riskLevel === 'High').length;
        const pending = alerts.filter(a => a.status === 'Pending').length;
        const resolved = alerts.filter(a => a.status === 'Resolved' || a.status === 'False Alarm').length;

        return { total, highRisk, pending, resolved };
    }, [alerts]);

    return (
        <div className="stats-grid">
            <StatItem
                icon="📊"
                value={stats.total}
                label="Total Alerts"
                type="primary"
            />
            <StatItem
                icon="🚨"
                value={stats.highRisk}
                label="High Risk"
                type="danger"
            />
            <StatItem
                icon="⏳"
                value={stats.pending}
                label="Pending Review"
                type="warning"
            />
            <StatItem
                icon="✅"
                value={stats.resolved}
                label="Resolved"
                type="success"
            />
        </div>
    );
};

export default StatsCard;
