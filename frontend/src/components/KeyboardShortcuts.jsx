import React, { useEffect, useState } from 'react';
import './KeyboardShortcuts.css';

const KeyboardShortcuts = ({ onRefresh, onSearch, onExport }) => {
    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        const handleKeyPress = (e) => {
            // Ctrl/Cmd + K - Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (onSearch) onSearch();
            }

            // Ctrl/Cmd + R - Refresh
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                if (onRefresh) onRefresh();
            }

            // Ctrl/Cmd + E - Export
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                if (onExport) onExport();
            }

            // ? - Show help
            if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                setShowHelp(true);
            }

            // Escape - Close help
            if (e.key === 'Escape') {
                setShowHelp(false);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [onRefresh, onSearch, onExport]);

    if (!showHelp) {
        return (
            <button
                className="keyboard-help-trigger"
                onClick={() => setShowHelp(true)}
                title="Keyboard Shortcuts (Press ?)"
            >
                ⌨️
            </button>
        );
    }

    return (
        <div className="keyboard-shortcuts-overlay" onClick={() => setShowHelp(false)}>
            <div className="keyboard-shortcuts-modal" onClick={(e) => e.stopPropagation()}>
                <div className="keyboard-shortcuts-header">
                    <h3>⌨️ Keyboard Shortcuts</h3>
                    <button
                        className="keyboard-close-btn"
                        onClick={() => setShowHelp(false)}
                    >
                        ✕
                    </button>
                </div>

                <div className="keyboard-shortcuts-content">
                    <div className="shortcut-section">
                        <h4>Navigation</h4>
                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd>Ctrl</kbd> + <kbd>K</kbd>
                            </div>
                            <div className="shortcut-desc">Focus search</div>
                        </div>
                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd>Ctrl</kbd> + <kbd>R</kbd>
                            </div>
                            <div className="shortcut-desc">Refresh data</div>
                        </div>
                    </div>

                    <div className="shortcut-section">
                        <h4>Actions</h4>
                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd>Ctrl</kbd> + <kbd>E</kbd>
                            </div>
                            <div className="shortcut-desc">Export data</div>
                        </div>
                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd>?</kbd>
                            </div>
                            <div className="shortcut-desc">Show this help</div>
                        </div>
                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd>Esc</kbd>
                            </div>
                            <div className="shortcut-desc">Close modals</div>
                        </div>
                    </div>
                </div>

                <div className="keyboard-shortcuts-footer">
                    <p>Press <kbd>Esc</kbd> to close</p>
                </div>
            </div>
        </div>
    );
};

export default KeyboardShortcuts;
