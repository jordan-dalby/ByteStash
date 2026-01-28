import React from 'react';
import { useTranslation } from 'react-i18next';
import { capitalizeFirstLetter } from '../../../utils/helpers/changeCaseUtils';

export interface ResultsCountProps {
  offset: number;
  limit: number;
  total: number;
  entityName: string;
}

export const ResultsCount: React.FC<ResultsCountProps> = ({
  offset,
  limit,
  total,
  entityName,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 px-1">
      <span className="text-sm font-medium text-light-text dark:text-dark-text">
        {total === 0 ? capitalizeFirstLetter(t('no')) : total} {entityName}
      </span>
      {total > 0 && (
        <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
          • {t('showing')} {offset + 1}-{Math.min(offset + limit, total)}
        </span>
      )}
    </div>
  );
};
