import React from 'react';
import { Globe, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ViewSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ViewSwitch: React.FC<ViewSwitchProps> = ({ checked, onChange }) => {
  const { t: translate } = useTranslation('components/snippets/view/common');

  return (
    <div className="flex items-center gap-3 text-sm text-light-text dark:text-dark-text w-full">
      <div
        className="flex gap-0.5 rounded-lg bg-light-surface dark:bg-dark-surface px-0.5 py-0.5 w-full"
        role="group"
      >
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`
            flex items-center justify-center gap-1 px-2 py-0.5 rounded-md transition-all duration-200 flex-1
            ${!checked 
              ? 'bg-light-hover dark:bg-dark-hover' 
              : 'hover:bg-light-hover/50 dark:hover:bg-dark-hover/50'
            }
          `}
        >
          <Lock 
            className={`
              stroke-[2] transition-colors duration-200
              ${!checked ? 'text-emerald-500' : 'text-light-text/50 dark:text-dark-text/50'}
            `} 
            size={14} 
          />
          <span className="text-xs font-medium">{translate('viewSwitch.private')}</span>
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`
            flex items-center justify-center gap-1 px-2 py-0.5 rounded-md transition-all duration-200 flex-1
            ${checked 
              ? 'bg-light-hover dark:bg-dark-hover' 
              : 'hover:bg-light-hover/50 dark:hover:bg-dark-hover/50'
            }
          `}
        >
          <Globe 
            className={`
              stroke-[2] transition-colors duration-200
              ${checked ? 'text-light-primary dark:text-dark-primary' : 'text-light-text/50 dark:text-dark-text/50'}
            `} 
            size={14} 
          />
          <span className="text-xs font-medium">{translate('viewSwitch.public')}</span>
        </button>
      </div>
    </div>
  );
};

export default ViewSwitch;
