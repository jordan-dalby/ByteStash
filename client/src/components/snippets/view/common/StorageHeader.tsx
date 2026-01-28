import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../../constants/routes';
import { AppHeader } from '../../../common/layout/AppHeader';
import ViewSwitch from './ViewSwitch';

interface StorageHeaderProps {
  isPublicView: boolean;
}

const StorageHeader: React.FC<StorageHeaderProps> = ({ isPublicView }) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const navigate = useNavigate();
  const { t: translate } = useTranslation('components/snippets/view/common');

  const tooltipText = isPublicView
    ? translate('storageHeader.public')
    : translate('storageHeader.private');

  const handleViewToggle = (checked: boolean) => {
    navigate(checked ? ROUTES.PUBLIC_SNIPPETS : ROUTES.HOME);
  };

  return (
    <AppHeader>
      <div
        className="relative inline-block"
        onMouseEnter={() => setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
      >
        <ViewSwitch checked={isPublicView} onChange={handleViewToggle} />

        {isTooltipVisible && (
          <div
            className="absolute left-1/2 top-full mt-3 w-64 -translate-x-1/2 rounded-lg border border-light-border
              dark:border-dark-border bg-light-surface dark:bg-dark-surface p-3 text-sm z-50 shadow-lg
              text-light-text dark:text-dark-text before:content-[''] before:absolute before:-top-2 before:left-1/2
              before:-translate-x-1/2 before:border-8 before:border-transparent before:border-b-light-surface
              dark:before:border-b-dark-surface"
            role="tooltip"
          >
            {tooltipText}
          </div>
        )}
      </div>
    </AppHeader>
  );
};

export default StorageHeader;
