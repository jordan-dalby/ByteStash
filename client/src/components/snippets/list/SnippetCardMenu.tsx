import React, { useState, useRef } from 'react';
import { Share, Pencil, Trash2, ExternalLink, MoreVertical, Copy } from 'lucide-react';
import { IconButton } from '../../common/buttons/IconButton';
import { useOutsideClick } from '../../../hooks/useOutsideClick';

interface SnippetCardMenuProps {
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onShare: (e: React.MouseEvent) => void;
  onOpenInNewTab: () => void;
  onDuplicate: (e: React.MouseEvent) => void;
  isPublicView: boolean;
  isAuthenticated: boolean;
}

const SnippetCardMenu: React.FC<SnippetCardMenuProps> = ({
  onEdit,
  onDelete,
  onShare,
  onOpenInNewTab,
  onDuplicate,
  isPublicView,
  isAuthenticated,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useOutsideClick(dropdownRef, () => setIsDropdownOpen(false), [buttonRef]);

  if (isPublicView) {
    return (
      <div className="top-4 right-4 flex items-center gap-1">
        {isAuthenticated && (
          <IconButton
            icon={<Copy size={16} />}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onDuplicate(e);
            }}
            variant="custom"
            size="sm"
            className="bg-light-hover dark:bg-dark-hover hover:bg-light-surface dark:hover:bg-dark-surface"
            label="Duplicate snippet"
          />
        )}
        <IconButton
          icon={<ExternalLink size={16} />}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onOpenInNewTab();
          }}
          variant="custom"
          size="sm"
          className="bg-light-hover dark:bg-dark-hover hover:bg-light-surface dark:hover:bg-dark-surface"
          label="Open in new tab"
        />
      </div>
    );
  }

  return (
    <div className="top-4 right-4 flex items-center gap-1">
      <IconButton
        icon={<Pencil size={16} />}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onEdit(e);
        }}
        variant="custom"
        size="sm"
        className="bg-light-hover dark:bg-dark-hover hover:bg-light-hover-more dark:hover:bg-dark-hover-more"
        label="Edit snippet"
      />
      <IconButton
        icon={<Trash2 size={16} className="hover:text-red-500" />}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onDelete(e);
        }}
        variant="custom"
        size="sm"
        className="bg-light-hover dark:bg-dark-hover hover:bg-light-hover-more dark:hover:bg-dark-hover-more"
        label="Delete snippet"
      />

      <div className="relative">
        <IconButton
          ref={buttonRef}
          icon={<MoreVertical size={16} />}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            setIsDropdownOpen(!isDropdownOpen);
          }}
          variant="custom"
          size="sm"
          className="bg-light-hover dark:bg-dark-hover hover:bg-light-hover-more dark:hover:bg-dark-hover-more"
          label="More options"
        />
        
        {isDropdownOpen && (
          <div 
            ref={dropdownRef}
            onMouseLeave={() => setIsDropdownOpen(false)}
            className="absolute right-0 top-full mt-1 w-48 bg-light-surface dark:bg-dark-surface rounded-md shadow-lg 
              border border-light-border dark:border-dark-border py-1 z-[100]"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenInNewTab();
                setIsDropdownOpen(false);
              }}
              className="w-full px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-hover dark:hover:bg-dark-hover flex items-center gap-2"
            >
              <ExternalLink size={16} />
              Open in new tab
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(e);
                setIsDropdownOpen(false);
              }}
              className="w-full px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-hover dark:hover:bg-dark-hover flex items-center gap-2"
            >
              <Share size={16} />
              Share snippet
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(e);
                setIsDropdownOpen(false);
              }}
              className="w-full px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-hover dark:hover:bg-dark-hover flex items-center gap-2"
            >
              <Copy size={16} />
              Duplicate snippet
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SnippetCardMenu;
