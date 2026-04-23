import React, { useState } from 'react';
import './BulkActions.css';

const BulkActions = ({ selectedCount, onBulkAction }) => {
    const [showMenu, setShowMenu] = useState(false);

    if (selectedCount === 0) return null;

    const handleAction = (action) => {
        onBulkAction(action);
        setShowMenu(false);
    };

    return (
        <div className="bulk-actions-container">
            <div className="bulk-actions-bar">
                <div className="bulk-actions-info">
                    <span className="bulk-count">{selectedCount}</span>
                    <span className="bulk-text">
                        {selectedCount === 1 ? 'item selected' : 'items selected'}
                    </span>
                </div>

                <div className="bulk-actions-buttons">
                    <button
                        className="bulk-action-btn"
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        Actions ▼
                    </button>

                    {showMenu && (
                        <div className="bulk-actions-menu">
                            <button
                                onClick={() => handleAction('mark-resolved')}
                                className="bulk-menu-item"
                            >
                                <span className="bulk-icon">✅</span>
                                Mark as Resolved
                            </button>
                            <button
                                onClick={() => handleAction('mark-investigating')}
                                className="bulk-menu-item"
                            >
                                <span className="bulk-icon">🔍</span>
                                Mark as Investigating
                            </button>
                            <button
                                onClick={() => handleAction('mark-false-alarm')}
                                className="bulk-menu-item"
                            >
                                <span className="bulk-icon">🚫</span>
                                Mark as False Alarm
                            </button>
                            <div className="bulk-menu-divider"></div>
                            <button
                                onClick={() => handleAction('delete')}
                                className="bulk-menu-item danger"
                            >
                                <span className="bulk-icon">🗑️</span>
                                Delete Selected
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkActions;
