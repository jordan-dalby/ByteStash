import React, { useRef, useState } from 'react';
import { LogOut, User, Key, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import { Link } from 'react-router-dom';
import { ApiKeysModal } from './ApiKeysModal';
import { ChangePasswordModal } from './ChangePasswordModal';

export const UserDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout, authConfig } = useAuth();

  if (user?.id === 0) {
    return (<></>)
  }

  useOutsideClick(dropdownRef, () => setIsOpen(false));

  const handlePasswordChanged = () => {
    // Log out the user after password change to force re-login
    logout();
  };

  if (user) {
    return (
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-light-surface dark:bg-dark-surface hover:bg-light-hover 
            dark:hover:bg-dark-hover rounded-md transition-colors text-sm text-light-text dark:text-dark-text"
        >
          <User size={16} />
          <span>{user?.username}</span>
        </button>
  
        {isOpen && (
          <div 
            className="absolute right-0 mt-1 w-48 bg-light-surface dark:bg-dark-surface rounded-md shadow-lg 
              border border-light-border dark:border-dark-border py-1 z-50"
          >
            <button
              onClick={() => {
                setIsOpen(false);
                setIsApiKeysModalOpen(true);
              }}
              className="w-full px-4 py-2 text-sm text-left text-light-text dark:text-dark-text hover:bg-light-hover 
                dark:hover:bg-dark-hover flex items-center gap-2"
            >
              <Key size={16} />
              <span>API Keys</span>
            </button>
            {!user.oidc_id && authConfig?.allowPasswordChanges && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsChangePasswordModalOpen(true);
                }}
                className="w-full px-4 py-2 text-sm text-left text-light-text dark:text-dark-text hover:bg-light-hover 
                  dark:hover:bg-dark-hover flex items-center gap-2"
              >
                <Lock size={16} />
                <span>Change Password</span>
              </button>
            )}
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full px-4 py-2 text-sm text-left text-light-text dark:text-dark-text hover:bg-light-hover 
                dark:hover:bg-dark-hover flex items-center gap-2"
            >
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        )}

        <ApiKeysModal 
          isOpen={isApiKeysModalOpen}
          onClose={() => setIsApiKeysModalOpen(false)}
        />

        <ChangePasswordModal 
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
          onPasswordChanged={handlePasswordChanged}
        />
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      <Link
        to="/login"
        className="flex items-center gap-2 px-3 py-1.5 bg-light-surface dark:bg-dark-surface hover:bg-light-hover 
          dark:hover:bg-dark-hover rounded-md transition-colors text-sm text-light-text dark:text-dark-text"
      >
        <User size={16} />
        <span>Sign in</span>
      </Link>
    </div>
  );
};
