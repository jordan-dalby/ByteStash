import React, { useState } from 'react';
import { Trash2, ChevronUp, ChevronDown, ChevronRight, ChevronDown as CollapseIcon } from 'lucide-react';
import { IconButton } from '../../common/buttons/IconButton';
import { CodeFragment } from '../../../types/snippets';
import BaseDropdown from '../../common/dropdowns/BaseDropdown';
import { getSupportedLanguages } from '../../../utils/language/languageUtils';
import { CodeEditor } from '../../editor/CodeEditor';

interface FragmentEditorProps {
  fragment: CodeFragment;
  onUpdate: (fragment: CodeFragment) => void;
  onDelete: () => void;
  showLineNumbers: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export const FragmentEditor: React.FC<FragmentEditorProps> = ({
    fragment,
    onUpdate,
    onDelete,
    showLineNumbers,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown
  }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
  
    const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate({
        ...fragment,
        file_name: e.target.value
      });
    };
  
    const handleCodeChange = (newCode: string | undefined) => {
      onUpdate({
        ...fragment,
        code: newCode || ''
      });
    };
  
    const handleLanguageChange = (newLanguage: string) => {
      onUpdate({
        ...fragment,
        language: newLanguage
      });
    };
  
    return (
      <div className="border rounded-lg shadow-lg bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border">
        <div className="flex items-center gap-2 p-3 bg-light-hover dark:bg-dark-hover">
          <div className="flex items-center gap-0.5">
            <IconButton
              icon={<ChevronUp size={16} />}
              onClick={onMoveUp}
              disabled={!canMoveUp}
              variant="custom"
              size="sm"
              className="disabled:opacity-50 w-9 h-9 bg-light-hover dark:bg-dark-hover hover:bg-light-surface dark:hover:bg-dark-surface"
              label="Move fragment up"
            />
            <IconButton
              icon={<ChevronDown size={16} />}
              onClick={onMoveDown}
              disabled={!canMoveDown}
              variant="custom"
              size="sm"
              className="disabled:opacity-50 w-9 h-9 bg-light-hover dark:bg-dark-hover hover:bg-light-surface dark:hover:bg-dark-surface"
              label="Move fragment down"
            />
          </div>
  
          <div className="flex items-center flex-1 gap-3">
            <div className="w-1/3">
              <input
                type="text"
                value={fragment.file_name}
                onChange={handleFileNameChange}
                className="w-full px-3 py-2 text-sm transition-colors border rounded bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text border-light-border dark:border-dark-border focus:border-light-primary dark:focus:border-dark-primary focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary"
                placeholder="File name"
                required
              />
            </div>
  
            <div className="w-2/3">
              <BaseDropdown
                value={fragment.language}
                onChange={handleLanguageChange}
                onSelect={handleLanguageChange}
                getSections={(searchTerm) => [{
                  title: 'Languages',
                  items: getSupportedLanguages()
                    .filter(lang => 
                      lang.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      lang.label.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(lang => lang.language)
                }]}
                maxLength={50}
                placeholder="Select language"
              />
            </div>
          </div>
  
          <div className="flex items-center gap-1">
            <IconButton
              icon={isCollapsed ? <ChevronRight size={16} /> : <CollapseIcon size={16} />}
              onClick={() => setIsCollapsed(!isCollapsed)}
              variant="custom"
              size="sm"
              className="w-9 h-9 bg-light-hover dark:bg-dark-hover hover:bg-light-surface dark:hover:bg-dark-surface"
              label={isCollapsed ? "Expand fragment" : "Collapse fragment"}
            />
            <IconButton
              icon={<Trash2 size={16} className="hover:text-red-500" />}
              onClick={onDelete}
              variant="custom"
              size="sm"
              className="w-9 h-9 bg-light-hover dark:bg-dark-hover hover:bg-light-surface dark:hover:bg-dark-surface"
              label="Delete fragment"
            />
          </div>
        </div>
  
        <div 
          style={{
            maxHeight: isCollapsed ? '0px' : '9999px',
            opacity: isCollapsed ? 0 : 1,
            overflow: 'hidden',
            transition: 'all 0.2s ease-in-out'
          }}
        >
          <div className="p-3">
            <CodeEditor
              code={fragment.code}
              language={fragment.language}
              onValueChange={handleCodeChange}
              showLineNumbers={showLineNumbers}
            />
          </div>
        </div>
      </div>
    );
  };
