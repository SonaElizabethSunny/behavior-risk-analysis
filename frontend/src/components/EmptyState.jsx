import React from 'react';
import './EmptyState.css';

const EmptyState = ({
    icon = '🔍',
    title = 'No Data Found',
    message = 'Try adjusting your search or filters to find what you are looking for.',
    action
}) => {
    return (
        <div className="empty-state-container">
            <div className="empty-state-icon-wrapper">
                <div className="empty-state-icon">{icon}</div>
                <div className="empty-state-pulse"></div>
            </div>
            <h3 className="empty-state-title">{title}</h3>
            <p className="empty-state-message">{message}</p>
            {action && <div className="empty-state-action">{action}</div>}
        </div>
    );
};

export default EmptyState;
