import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'danger',
  ...props
}) => {
  const { t } = useTranslation();

  const confirmLabel = props.confirmLabel || t('action.confirm');
  const cancelLabel = props.cancelLabel || t('action.cancel');

  const variantClasses = {
    danger: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800',
    warning: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800',
    info: 'bg-light-primary hover:opacity-90 dark:bg-dark-primary dark:hover:opacity-90'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="px-0.5 pt-1 pb-3">
        <p className="text-light-text dark:text-dark-text mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text rounded-md hover:bg-light-hover dark:hover:bg-dark-hover transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-3 py-1.5 text-white rounded-md transition-colors ${variantClasses[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
