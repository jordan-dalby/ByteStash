import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('mousedown', handleClickOutside);
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div 
        ref={modalRef} 
        className={`bg-light-surface dark:bg-dark-surface rounded-lg max-w-3xl w-full max-h-[80vh] flex flex-col transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <div className="px-4 pt-4 pb-4 flex items-center justify-between border-b border-light-border dark:border-dark-border">
          <div className="text-lg font-semibold text-light-text dark:text-dark-text">
            {title}
          </div>
          <button 
            onClick={onClose}
            className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text"
          >
            <X size={24} />
          </button>
        </div>
        <div ref={contentRef} className="px-4 pb-4 overflow-y-auto flex-1 mt-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
