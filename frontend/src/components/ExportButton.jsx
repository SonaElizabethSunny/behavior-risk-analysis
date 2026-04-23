import React, { useState } from 'react';
import './ExportButton.css';

const ExportButton = ({ data, filename = 'alerts' }) => {
    const [isExporting, setIsExporting] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const exportToCSV = () => {
        setIsExporting(true);
        try {
            if (!data || data.length === 0) {
                alert('No data to export');
                return;
            }

            // Define headers
            const headers = ['ID', 'Timestamp', 'Behavior', 'Risk Level', 'Status', 'Location', 'Video Name'];

            // Convert data to CSV format
            const csvContent = [
                headers.join(','),
                ...data.map(alert => [
                    alert._id || '',
                    new Date(alert.timestamp).toLocaleString(),
                    `"${(alert.behavior || '').replace(/"/g, '""')}"`,
                    alert.riskLevel || '',
                    alert.status || '',
                    alert.location ? `"${alert.location.lat}, ${alert.location.lon}"` : '',
                    `"${(alert.videoName || '').replace(/"/g, '""')}"`
                ].join(','))
            ].join('\n');

            // Create blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setShowMenu(false);
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export data');
        } finally {
            setIsExporting(false);
        }
    };

    const exportToJSON = () => {
        setIsExporting(true);
        try {
            if (!data || data.length === 0) {
                alert('No data to export');
                return;
            }

            const jsonContent = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setShowMenu(false);
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export data');
        } finally {
            setIsExporting(false);
        }
    };

    const printReport = () => {
        window.print();
        setShowMenu(false);
    };

    return (
        <div className="export-button-container">
            <button
                className="export-btn"
                onClick={() => setShowMenu(!showMenu)}
                disabled={isExporting || !data || data.length === 0}
            >
                {isExporting ? (
                    <>
                        <span className="spinner-small"></span> Exporting...
                    </>
                ) : (
                    <>
                        📥 Export
                    </>
                )}
            </button>

            {showMenu && (
                <div className="export-menu">
                    <button onClick={exportToCSV} className="export-menu-item">
                        <span className="export-icon">📊</span>
                        <div>
                            <div className="export-menu-title">Export as CSV</div>
                            <div className="export-menu-desc">Excel compatible</div>
                        </div>
                    </button>
                    <button onClick={exportToJSON} className="export-menu-item">
                        <span className="export-icon">📄</span>
                        <div>
                            <div className="export-menu-title">Export as JSON</div>
                            <div className="export-menu-desc">Developer friendly</div>
                        </div>
                    </button>
                    <button onClick={printReport} className="export-menu-item">
                        <span className="export-icon">🖨️</span>
                        <div>
                            <div className="export-menu-title">Print Report</div>
                            <div className="export-menu-desc">PDF via browser</div>
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
};

export default ExportButton;
