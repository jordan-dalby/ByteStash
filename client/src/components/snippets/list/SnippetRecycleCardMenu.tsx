import React from 'react';
import {Trash2,ArchiveRestore } from 'lucide-react';
import { IconButton } from '../../common/buttons/IconButton';

interface SnippetRecycleCardMenuProps {
  onRestore: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

const SnippetRecycleCardMenu: React.FC<SnippetRecycleCardMenuProps> = ({
  onDelete,
  onRestore,
}) => {
  return (
    <div className="top-4 right-4 flex items-center gap-1">
        <IconButton
        icon={<ArchiveRestore size={16} className="hover:text-yellow-500" />}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onRestore(e);
        }}
        variant="custom"
        size="sm"
        className="bg-light-hover dark:bg-dark-hover hover:bg-light-hover-more dark:hover:bg-dark-hover-more"
        label="Restore snippet"
      />
      <IconButton
        icon={<Trash2 size={17} className="hover:text-red-500" />}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onDelete(e);
        }}
        variant="custom"
        size="sm"
        className="bg-light-hover dark:bg-dark-hover hover:bg-light-hover-more dark:hover:bg-dark-hover-more"
        label="Delete snippet"
      />
    </div>
  );
};

export default SnippetRecycleCardMenu;
