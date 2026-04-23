import React from 'react';
import './Modal.css';

const Modal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning' }) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-container">
                <div className="modal-header">
                    <div className={`modal-icon modal-icon-${type}`}>
                        {type === 'warning' && '⚠️'}
                        {type === 'danger' && '🗑️'}
                        {type === 'info' && 'ℹ️'}
                        {type === 'success' && '✓'}
                    </div>
                    <h3 className="modal-title">{title}</h3>
                </div>

                <div className="modal-body">
                    <p className="modal-message">{message}</p>
                </div>

                <div className="modal-footer">
                    <button
                        className="modal-btn modal-btn-cancel"
                        onClick={onClose}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`modal-btn modal-btn-confirm modal-btn-${type}`}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
