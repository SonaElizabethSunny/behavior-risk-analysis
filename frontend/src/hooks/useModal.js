import { useState } from 'react';

export const useModal = () => {
    const [modalState, setModalState] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'warning',
        confirmText: 'Confirm',
        cancelText: 'Cancel'
    });

    const openModal = ({ title, message, onConfirm, type = 'warning', confirmText = 'Confirm', cancelText = 'Cancel' }) => {
        setModalState({
            isOpen: true,
            title,
            message,
            onConfirm,
            type,
            confirmText,
            cancelText
        });
    };

    const closeModal = () => {
        setModalState(prev => ({ ...prev, isOpen: false }));
    };

    return { modalState, openModal, closeModal };
};
