import React, { useRef, useState } from 'react';
import { LogOut, User, Globe } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import { Link, useLocation } from 'react-router-dom';

export const UserDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const location = useLocation();

  if (user?.id === 0) {
    return (<></>)
  }

  useOutsideClick(dropdownRef, () => setIsOpen(false));

  const isPublicView = location.pathname.startsWith('/public');
  const switchViewProps = isPublicView 
    ? {
        to: "/",
        icon: <User size={16} />,
        text: "My snippets"
      }
    : {
        to: "/public/snippets",
        icon: <Globe size={16} />,
        text: "Public snippets"
      };

  if (user) {
    return (
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 
            rounded-md transition-colors text-sm"
        >
          <User size={16} />
          <span>{user?.username}</span>
        </button>
  
        {isOpen && (
          <div 
            className="absolute right-0 mt-1 w-48 bg-gray-800 rounded-md shadow-lg 
              border border-gray-700 py-1 z-50"
          >
            <Link
              to={switchViewProps.to}
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-gray-700 
                flex items-center gap-2"
            >
              {switchViewProps.icon}
              <span>{switchViewProps.text}</span>
            </Link>
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-gray-700 
                flex items-center gap-2"
            >
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      <Link
        to="/login"
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors text-sm"
      >
        <User size={16} />
        <span>Sign in</span>
      </Link>
    </div>
  )
};