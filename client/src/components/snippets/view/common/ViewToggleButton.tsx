import React from 'react';
import { Globe, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../../constants/routes';

interface ViewToggleButtonProps {
  isPublicView: boolean;
}

const ViewToggleButton: React.FC<ViewToggleButtonProps> = ({ isPublicView }) => {
  const toggleProps = isPublicView
    ? {
        to: ROUTES.HOME,
        icon: <Lock className="w-4 h-4" />,
        text: "Switch to private",
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
      }
    : {
        to: ROUTES.PUBLIC_SNIPPETS,
        icon: <Globe className="w-4 h-4" />,
        text: "Switch to public",
        className: "bg-light-primary/10 text-light-primary dark:text-dark-primary hover:bg-light-primary/20"
      };

  return (
    <Link
      to={toggleProps.to}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${toggleProps.className}`}
    >
      {toggleProps.icon}
      <span>{toggleProps.text}</span>
    </Link>
  );
};

export default ViewToggleButton;