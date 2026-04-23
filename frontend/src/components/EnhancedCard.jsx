import React from 'react';
import './EnhancedCard.css';

const EnhancedCard = ({ children, className = '', hover = true, glow = false, onClick }) => {
    return (
        <div
            className={`enhanced-card ${hover ? 'enhanced-card-hover' : ''} ${glow ? 'enhanced-card-glow' : ''} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export default EnhancedCard;
