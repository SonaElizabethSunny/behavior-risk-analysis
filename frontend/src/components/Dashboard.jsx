import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';
import StatsCard from './StatsCard';
import SearchFilter from './SearchFilter';
import InvestigationModal from './InvestigationModal';
import BulkActions from './BulkActions';
import ExportButton from './ExportButton';
import Pagination from './Pagination';
import { useToast } from './Toast';
import './Dashboard.css';

const ITEMS_PER_PAGE_DEFAULT = 25;

const Dashboard = ({ user }) => {
    const toast = useToast();

    // ── State ──────────────────────────────────────────────────────────────
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ riskLevel: 'all', status: 'all', dateRange: 'all' });
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_DEFAULT);
    const [investigationAlert, setInvestigationAlert] = useState(null);

    // ── Fetch alerts ───────────────────────────────────────────────────────
    const fetchAlerts = useCallback(async () => {
        try {
            const response = await api.get('/api/alerts');
            setAlerts(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching alerts:', err);
            setError('Failed to load alerts. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAlerts();
        // Fallback poll every 10s (real-time is handled by Socket.IO)
        const interval = setInterval(fetchAlerts, 10000);

        // ── Socket.IO real-time alert listener ────────────────────────────────
        const socket = io('http://localhost:4005', { transports: ['websocket'] });
        socket.on('connect', () => console.log('📡 Dashboard Socket.IO connected'));
        socket.on('alert:new', (newAlert) => {
            console.log('🚨 Real-time alert received:', newAlert);
            setAlerts(prev => [newAlert, ...prev]);
            toast.error(`🚨 ASSAULT DETECTED — ${newAlert.behavior}`);
        });
        socket.on('disconnect', () => console.log('📡 Socket.IO disconnected'));

        return () => {
            clearInterval(interval);
            socket.disconnect();
        };
    }, [fetchAlerts]);

    // ── Actions ───────────────────────────────────────────────────────────
    const updateStatus = async (id, newStatus) => {
        try {
            await api.put(`/api/alerts/${id}`, { status: newStatus });
            fetchAlerts();
            toast.success(`Status updated to ${newStatus}`);
        } catch {
            toast.error('Failed to update status');
        }
    };

    const deleteAlert = async (id) => {
        if (!window.confirm('PERMANENT DELETE: Remove this case from the database?')) return;
        try {
            await api.delete(`/api/alerts/${id}`);
            fetchAlerts();
            toast.success('Alert deleted');
        } catch {
            toast.error('Failed to delete alert');
        }
    };

    const clearHistory = async () => {
        if (!window.confirm('This will hide all current history from your view. Police will still have access to reported incidents. Continue?')) return;
        try {
            await api.delete('/api/alerts/history');
            fetchAlerts();
            toast.success('History cleared');
        } catch {
            toast.error('Failed to clear history');
        }
    };

    const clearFalseAlarms = async () => {
        if (!window.confirm("Clear all cases marked as 'False Alarm' from history?")) return;
        try {
            await api.delete('/api/alerts/false-alarms');
            fetchAlerts();
            toast.success('False alarms cleared');
        } catch {
            toast.error('Failed to clear false alarms');
        }
    };

    // ── Investigation submit ───────────────────────────────────────────────
    const handleInvestigationSubmit = async (data) => {
        try {
            await api.put(`/api/alerts/${data.alertId}`, {
                status: 'Investigating',
                investigationReport: {
                    caseDetails: data.caseDetails,
                    officerNotes: data.officerNotes,
                    officerName: data.officerName,
                    priority: data.priority,
                    submittedAt: new Date().toISOString(),
                },
            });
            fetchAlerts();
            toast.success('Investigation report submitted successfully');
        } catch {
            toast.error('Failed to submit investigation report');
        }
    };

    // ── Bulk actions ──────────────────────────────────────────────────────
    const handleBulkAction = async (action) => {
        if (selectedIds.size === 0) return;
        const ids = [...selectedIds];
        try {
            if (action === 'delete') {
                if (!window.confirm(`Delete ${ids.length} selected alerts?`)) return;
                await Promise.all(ids.map(id => api.delete(`/api/alerts/${id}`)));
                toast.success(`${ids.length} alerts deleted`);
            } else {
                const statusMap = {
                    'mark-resolved': 'Resolved',
                    'mark-investigating': 'Investigating',
                    'mark-false-alarm': 'False Alarm',
                };
                const newStatus = statusMap[action];
                if (newStatus) {
                    await Promise.all(ids.map(id => api.put(`/api/alerts/${id}`, { status: newStatus })));
                    toast.success(`${ids.length} alerts marked as ${newStatus}`);
                }
            }
            setSelectedIds(new Set());
            fetchAlerts();
        } catch {
            toast.error('Bulk action failed');
        }
    };

    // ── Selection helpers ─────────────────────────────────────────────────
    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === pagedAlerts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(pagedAlerts.map(a => a._id)));
        }
    };

    // ── Filtering & pagination ─────────────────────────────────────────────
    const filteredAlerts = useMemo(() => {
        return alerts.filter(alert => {
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const hit = [alert.behavior, alert.videoName,
                alert.location ? `${alert.location.lat},${alert.location.lon}` : '']
                    .some(v => v?.toLowerCase().includes(term));
                if (!hit) return false;
            }
            if (filters.riskLevel !== 'all' && alert.riskLevel !== filters.riskLevel) return false;
            if (filters.status !== 'all' && alert.status !== filters.status) return false;
            if (filters.dateRange !== 'all') {
                const diffDays = (Date.now() - new Date(alert.timestamp)) / 86400000;
                if (filters.dateRange === 'today' && diffDays > 1) return false;
                if (filters.dateRange === 'week' && diffDays > 7) return false;
                if (filters.dateRange === 'month' && diffDays > 30) return false;
                if (filters.dateRange === 'year' && diffDays > 365) return false;
            }
            return true;
        });
    }, [alerts, searchTerm, filters]);

    const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / itemsPerPage));
    const safePage = Math.min(currentPage, totalPages);
    const pagedAlerts = filteredAlerts.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

    // Reset to page 1 when filters change
    useEffect(() => setCurrentPage(1), [searchTerm, filters]);

    // ── Helpers ───────────────────────────────────────────────────────────
    const canManage = user?.role === 'admin' || user?.role === 'police';
    const canOperate = user?.role === 'admin' || user?.role === 'cctv_user';
    const isPolice = user?.role === 'police';

    const getRiskColor = (risk) => ({ High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' }[risk] || '#6b7280');

    const getStatusStyle = (status) => {
        const map = {
            'Pending': { color: '#60a5fa' },
            'Investigating': { color: '#f59e0b' },
            'Verified': { color: '#a78bfa' },
            'Reported': { color: '#fb923c' },
            'Resolved': { color: '#34d399' },
            'False Alarm': { color: '#94a3b8' },
        };
        return map[status] || { color: '#9ca3af' };
    };

    // ── Loading / Error states ─────────────────────────────────────────────
    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading-container">
                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem' }}>
                        ⏳ Loading alerts...
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-container">
                <div className="error-container">
                    <div className="error-icon">⚠️</div>
                    <div className="error-title">Connection Error</div>
                    <div className="error-message">{error}</div>
                    <button className="btn-refresh" onClick={fetchAlerts} style={{ marginTop: '1.5rem' }}>
                        🔄 Retry
                    </button>
                </div>
            </div>
        );
    }

    // ── Main render ───────────────────────────────────────────────────────
    return (
        <div className="dashboard-container">

            {/* ── Page Header ── */}
            <div className="dashboard-header">
                <h1 className="dashboard-title">
                    📊 {isPolice ? 'Behavior Analysis Dashboard (Audit View)' : 'Live Security Dashboard'}
                </h1>
                <p className="dashboard-subtitle">Real-time behavioral anomalies and risk assessment</p>
            </div>

            {/* ── Stats Cards ── */}
            <StatsCard alerts={alerts} />

            {/* ── Search + Filter ── */}
            <div className="search-filter-section">
                <SearchFilter
                    onSearch={setSearchTerm}
                    onFilter={setFilters}
                    totalResults={filteredAlerts.length}
                />
            </div>

            {/* ── Alerts Section ── */}
            <div className="alerts-section">

                {/* Section toolbar */}
                <div className="alerts-header">
                    <div className="alerts-title">
                        🚨 Alerts
                        <span className="alerts-count">{filteredAlerts.length}</span>
                    </div>
                    <div className="alerts-actions">
                        <button className="btn-refresh" onClick={fetchAlerts}>🔄 Refresh</button>
                        <ExportButton data={filteredAlerts} filename="sentinel-alerts" />
                        {user?.role !== 'police' && (
                            <>
                                <button className="btn-clear-filters" onClick={clearFalseAlarms}>
                                    🚫 Clear False Alarms
                                </button>
                                <button
                                    className="btn-export"
                                    onClick={clearHistory}
                                    style={{ background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)', color: '#fca5a5' }}
                                >
                                    🗑️ Clear History
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Bulk actions bar */}
                <BulkActions selectedCount={selectedIds.size} onBulkAction={handleBulkAction} />

                {filteredAlerts.length === 0 ? (
                    <div className="empty-state-container">
                        <div className="empty-state-icon">🛡️</div>
                        <div className="empty-state-title">All Clear</div>
                        <div className="empty-state-description">
                            {alerts.length === 0
                                ? 'No behavioral anomalies detected. The system is actively monitoring.'
                                : 'No alerts match your current filters.'}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ── Alerts Table ── */}
                        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                            <table className="alert-table" style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '0.9rem',
                            }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                        <th style={thStyle}>
                                            <input
                                                type="checkbox"
                                                checked={pagedAlerts.length > 0 && selectedIds.size === pagedAlerts.length}
                                                onChange={toggleSelectAll}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </th>
                                        <th style={thStyle}>VIDEO / SOURCE</th>
                                        <th style={thStyle}>DETECTED BEHAVIOR</th>
                                        <th style={thStyle}>RISK LEVEL</th>
                                        <th style={thStyle}>STATUS</th>
                                        <th style={thStyle}>TIMESTAMP</th>
                                        <th style={thStyle}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedAlerts.map((alert) => (
                                        <tr
                                            key={alert._id}
                                            style={{
                                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                                background: selectedIds.has(alert._id)
                                                    ? 'rgba(59,130,246,0.08)'
                                                    : alert.riskLevel === 'High'
                                                        ? 'rgba(239,68,68,0.05)'
                                                        : 'transparent',
                                                transition: 'background 0.2s',
                                            }}
                                        >
                                            {/* Checkbox */}
                                            <td style={tdStyle}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(alert._id)}
                                                    onChange={() => toggleSelect(alert._id)}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            </td>

                                            {/* Video / Source */}
                                            <td style={{ ...tdStyle, maxWidth: 260 }}>
                                                <div style={{ fontWeight: 500, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>
                                                    {alert.videoName || 'Live Incident'}
                                                </div>
                                                {alert.location && (
                                                    <div style={{ marginBottom: 4 }}>
                                                        <a
                                                            href={`https://www.google.com/maps?q=${alert.location.lat},${alert.location.lon}`}
                                                            target="_blank" rel="noopener noreferrer"
                                                            style={{ color: '#34d399', fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                                                        >
                                                            📍 GPS: {alert.location.lat?.toFixed(4)}, {alert.location.lon?.toFixed(4)}
                                                        </a>
                                                    </div>
                                                )}
                                                {alert.videoPath && (
                                                    <div>
                                                        <div style={{ color: '#60a5fa', fontSize: '0.8rem', marginBottom: 4 }}>
                                                            🎬 5-Second Incident Clip
                                                        </div>
                                                        <video
                                                            src={`http://localhost:4005${alert.videoPath}`}
                                                            controls
                                                            style={{
                                                                width: 160,
                                                                borderRadius: 8,
                                                                border: '1px solid rgba(255,255,255,0.1)',
                                                                background: '#000',
                                                                display: 'block',
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </td>

                                            {/* Behavior */}
                                            <td style={{ ...tdStyle, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                                                {alert.behavior}
                                            </td>

                                            {/* Risk Level */}
                                            <td style={tdStyle}>
                                                <span style={{
                                                    color: getRiskColor(alert.riskLevel),
                                                    fontWeight: 700,
                                                    fontSize: '0.85rem',
                                                }}>
                                                    {alert.riskLevel}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td style={tdStyle}>
                                                <span style={{
                                                    color: getStatusStyle(alert.status).color,
                                                    fontWeight: 600,
                                                    fontSize: '0.85rem',
                                                }}>
                                                    {alert.status}
                                                </span>
                                            </td>

                                            {/* Timestamp */}
                                            <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                                {new Date(alert.timestamp).toLocaleString()}
                                            </td>

                                            {/* Actions */}
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                    {/* Investigate — admin/police */}
                                                    {canManage && (
                                                        <button
                                                            onClick={() => setInvestigationAlert(alert)}
                                                            style={actionBtnStyle('#3b82f6')}
                                                            title="Open Investigation"
                                                        >
                                                            Investigate
                                                        </button>
                                                    )}
                                                    {/* Verify — admin/cctv */}
                                                    {canOperate && (
                                                        <button
                                                            onClick={() => updateStatus(alert._id, 'Verified')}
                                                            disabled={alert.status === 'Verified' || alert.status === 'Resolved'}
                                                            style={actionBtnStyle('#8b5cf6')}
                                                        >
                                                            Verify
                                                        </button>
                                                    )}
                                                    {/* Report — admin/cctv */}
                                                    {canOperate && (
                                                        <button
                                                            onClick={() => updateStatus(alert._id, 'Reported')}
                                                            disabled={alert.status === 'Reported'}
                                                            style={actionBtnStyle('#f59e0b')}
                                                        >
                                                            Report
                                                        </button>
                                                    )}
                                                    {/* Resolve — admin/police */}
                                                    {canManage && (
                                                        <button
                                                            onClick={() => updateStatus(alert._id, 'Resolved')}
                                                            disabled={alert.status === 'Resolved'}
                                                            style={actionBtnStyle('#10b981')}
                                                        >
                                                            Resolve
                                                        </button>
                                                    )}
                                                    {/* False alarm — admin/cctv */}
                                                    {canOperate && (
                                                        <button
                                                            onClick={() => updateStatus(alert._id, 'False Alarm')}
                                                            disabled={alert.status === 'False Alarm'}
                                                            style={actionBtnStyle('#6b7280')}
                                                        >
                                                            False
                                                        </button>
                                                    )}
                                                    {/* Delete — admin/police */}
                                                    {canManage && (
                                                        <button
                                                            onClick={() => deleteAlert(alert._id)}
                                                            style={{ ...actionBtnStyle('#ef4444'), display: 'flex', alignItems: 'center', gap: 3 }}
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Pagination ── */}
                        <div className="pagination-container">
                            <Pagination
                                currentPage={safePage}
                                totalPages={totalPages}
                                totalItems={filteredAlerts.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                                onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* ── Investigation Modal ── */}
            <InvestigationModal
                isOpen={!!investigationAlert}
                alert={investigationAlert}
                onClose={() => setInvestigationAlert(null)}
                onSubmit={handleInvestigationSubmit}
            />
        </div>
    );
};

// ── Shared style helpers ───────────────────────────────────────────────────
const thStyle = {
    padding: '12px 16px',
    color: 'rgba(255,255,255,0.5)',
    fontWeight: 600,
    fontSize: '0.75rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
};

const tdStyle = {
    padding: '14px 16px',
    color: 'rgba(255,255,255,0.8)',
    verticalAlign: 'top',
};

const actionBtnStyle = (color) => ({
    padding: '4px 10px',
    background: `${color}22`,
    border: `1px solid ${color}66`,
    borderRadius: 6,
    color: color,
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
});

export default Dashboard;
