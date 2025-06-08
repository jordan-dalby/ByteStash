import React, { useEffect, useRef, useState } from 'react';
import { X, Maximize2, Minimize2, Trash2, Pencil } from 'lucide-react';
import { IconButton } from '../buttons/IconButton';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
  expandable?: boolean;
  defaultExpanded?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = 'max-w-3xl',
  expandable = false,
  defaultExpanded = false,
  onEdit,
  onDelete
}) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    // Only use saved state if the modal is expandable
    if (expandable) {
      const savedState = localStorage.getItem('modalExpandedState');
      return savedState !== null ? savedState === 'true' : defaultExpanded;
    }
    return defaultExpanded;
  });

  // Only save expanded state for expandable modals
  useEffect(() => {
    if (expandable) {
      localStorage.setItem('modalExpandedState', isExpanded.toString());
    }
  }, [isExpanded, expandable]);

  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click target is a modal backdrop (the semi-transparent overlay)
      const isBackdropClick = (event.target as HTMLElement).classList.contains('modal-backdrop');

      // Only close if clicking directly on the backdrop of this modal
      if (isBackdropClick && modalRef.current?.parentElement === event.target) {
        onClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const modalWidth = isExpanded ? 'max-w-[90vw]' : width;

  return (
    <div
      className={`modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50 transition-opacity duration-300
        ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div
        ref={modalRef}
        className={`bg-light-surface dark:bg-dark-surface rounded-lg w-full ${modalWidth} max-h-[80vh] flex flex-col
          transition-all duration-300 ease-in-out transform
          ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        style={{
          willChange: 'transform, opacity, width',
        }}
      >
        <div className="px-4 pt-4 pb-4 flex items-center justify-between border-b border-light-border dark:border-dark-border">
          <div className="text-lg font-semibold text-light-text dark:text-dark-text flex-1">
            {title}
          </div>
          <div className="flex items-center gap-2">
            {expandable && (
              <IconButton
                icon={isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                onClick={() => setIsExpanded(!isExpanded)}
                variant="secondary"
                size="sm"
                label={isExpanded ? "Minimize" : "Maximize"}
              />
            )}
            {onEdit && (
              <IconButton
                icon={<Pencil size={18} />}
                onClick={onEdit}
                variant="secondary"
                size="sm"
                label="Edit"
              />
            )}
            {onDelete && (
              <IconButton
                icon={<Trash2 size={18} />}
                onClick={onDelete}
                variant="secondary"
                size="sm"
                label="Delete"
              />
            )}
            <button
              onClick={onClose}
              className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text
                flex-shrink-0 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        <div ref={contentRef} className="px-4 pb-4 overflow-y-auto flex-1 mt-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
