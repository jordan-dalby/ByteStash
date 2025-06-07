import React, { useState, useEffect } from 'react';
import { AlertTriangle, Lock, Trash2 } from 'lucide-react';
import Modal from './Modal';

export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isLocked?: boolean;
  lockReason?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  isLocked = false,
  lockReason
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isValid, setIsValid] = useState(false);

  // Reset confirmation state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      // Only reset isValid to false for locked snippets
      setIsValid(!isLocked);
    }
  }, [isOpen, isLocked]);

  // Validate confirmation text
  useEffect(() => {
    if (isLocked) {
      // For locked snippets, user must type "delete" exactly
      setIsValid(confirmText.toLowerCase().trim() === 'delete');
    } else {
      // For unlocked snippets, no typing required
      setIsValid(true);
    }
  }, [confirmText, isLocked]);

  const handleConfirm = () => {
    if (isValid) {
      onConfirm();
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="p-6">
        {/* Header with icon */}
        <div className="flex items-center mb-4">
          {isLocked ? (
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <Lock className="w-6 h-6 text-red-600" />
            </div>
          ) : (
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          )}
        </div>

        {/* Title and Warning */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isLocked ? (
              <>🔒 Delete Protected Snippet</>
            ) : (
              <>🗑️ Delete Snippet</>
            )}
          </h3>
          
          <p className="text-sm text-gray-600 mb-2">
            Are you sure you want to delete <strong>"{title}"</strong>?
          </p>

          {isLocked && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <div className="flex items-center">
                <Lock className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm text-red-800 font-medium">
                    This snippet is locked for protection
                  </p>
                  {lockReason && (
                    <p className="text-xs text-red-700 mt-1">
                      Reason: {lockReason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <p className="text-sm text-gray-500">
            {isLocked ? (
              'This action cannot be undone. Type "delete" below to confirm.'
            ) : (
              'This action cannot be undone.'
            )}
          </p>
        </div>

        {/* Type-to-confirm input for locked snippets */}
        {isLocked && (
          <div className="mb-6">
            <label htmlFor="confirm-input" className="block text-sm font-medium text-gray-700 mb-2">
              Type "delete" to confirm:
            </label>
            <input
              id="confirm-input"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="delete"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              autoFocus
            />
            {confirmText && !isValid && (
              <p className="text-xs text-red-600 mt-1">
                Please type "delete" exactly to confirm
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isValid
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Snippet
            </div>
          </button>
        </div>
      </div>
    </Modal>
  );
}; 