import React from 'react';
import { Link } from 'react-router-dom';
import { APP_VERSION } from '../../../constants/settings';
import { getAssetPath } from '../../../utils/paths';

interface AppHeaderProps {
  subtitle?: string;
  children?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ subtitle, children }) => {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-4xl font-bold text-light-text dark:text-dark-text flex items-baseline gap-2">
        <Link to="/" className="flex items-baseline gap-2 hover:opacity-80 transition-opacity cursor-pointer">
          <img src={getAssetPath('/logo512.png')} alt="ByteStash Logo" className="w-7 h-7" />
          ByteStash
        </Link>
        <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">v{APP_VERSION}</span>
      </h1>

      {subtitle && (
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
          {subtitle}
        </p>
      )}

      {children}
    </div>
  );
};
