import React, { useState, useEffect } from "react";
import {
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ChevronDown as CollapseIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { CodeFragment } from "../../../types/snippets";
import { getLanguageDropdownSections } from "../../../utils/language/languageUtils";
import { IconButton } from "../../common/buttons/IconButton";
import BaseDropdown from "../../common/dropdowns/BaseDropdown";
import { CodeEditor } from "../../editor/CodeEditor";

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
  canMoveDown,
}) => {
  const { t: translate } = useTranslation('components/snippets/edit');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getMostUsedLanguage = () => {
    const sections = getLanguageDropdownSections();
    return sections.used[0] || "";
  };

  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return fragment.language || getMostUsedLanguage();
  });

  useEffect(() => {
    if (selectedLanguage && selectedLanguage !== fragment.language) {
      onUpdate({
        ...fragment,
        language: selectedLanguage,
      });
    }
  }, [selectedLanguage, fragment, onUpdate]);

  // Ensure the fragment language is set on mount if it's empty
  useEffect(() => {
    if (!fragment.language && selectedLanguage) {
      onUpdate({
        ...fragment,
        language: selectedLanguage,
      });
    }
  }, []); // Empty dependency array to run only on mount

  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({
      ...fragment,
      file_name: e.target.value,
    });
  };

  const handleCodeChange = (newCode: string | undefined) => {
    onUpdate({
      ...fragment,
      code: newCode || "",
    });
  };

  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    onUpdate({
      ...fragment,
      language: newLanguage,
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
            label={translate('fragmentEditor.moveUp')}
          />
          <IconButton
            icon={<ChevronDown size={16} />}
            onClick={onMoveDown}
            disabled={!canMoveDown}
            variant="custom"
            size="sm"
            className="disabled:opacity-50 w-9 h-9 bg-light-hover dark:bg-dark-hover hover:bg-light-surface dark:hover:bg-dark-surface"
            label={translate('fragmentEditor.moveDown')}
          />
        </div>

        <div className="flex items-center flex-1 gap-3">
          <div className="w-1/3">
            <input
              type="text"
              value={fragment.file_name}
              onChange={handleFileNameChange}
              className="w-full px-3 py-2 text-sm transition-colors border rounded bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text border-light-border dark:border-dark-border focus:border-light-primary dark:focus:border-dark-primary focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary"
              placeholder={translate('fragmentEditor.form.fileName.placeholder')}
              required
            />
          </div>

          <div className="w-2/3">
            <BaseDropdown
              value={fragment.language || selectedLanguage}
              onChange={handleLanguageChange}
              onSelect={handleLanguageChange}
              getSections={(searchTerm) => {
                const { used, other } = getLanguageDropdownSections();

                // Helper: filter only by search term
                const filterBySearch = (items: string[]) =>
                  items.filter((lang) =>
                    lang.toLowerCase().includes(searchTerm.toLowerCase())
                  );

                return [
                  {
                    title: translate('fragmentEditor.form.language.sections.used'),
                    items: filterBySearch(used),
                  },
                  {
                    title: translate('fragmentEditor.form.language.sections.other'),
                    items: filterBySearch(other),
                  },
                ];
              }}
              maxLength={50}
              placeholder={translate('fragmentEditor.form.language.placeholder')}
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <IconButton
            icon={
              isCollapsed ? (
                <ChevronRight size={16} />
              ) : (
                <CollapseIcon size={16} />
              )
            }
            onClick={() => setIsCollapsed(!isCollapsed)}
            variant="custom"
            size="sm"
            className="w-9 h-9 bg-light-hover dark:bg-dark-hover hover:bg-light-surface dark:hover:bg-dark-surface"
            label={
              isCollapsed
                ? translate('fragmentEditor.action.expand')
                : translate('fragmentEditor.action.collapse')
              }
          />
          <IconButton
            icon={<Trash2 size={16} className="hover:text-red-500" />}
            onClick={onDelete}
            variant="custom"
            size="sm"
            className="w-9 h-9 bg-light-hover dark:bg-dark-hover hover:bg-light-surface dark:hover:bg-dark-surface"
            label={translate('fragmentEditor.action.delete')}
          />
        </div>
      </div>

      <div
        style={{
          maxHeight: isCollapsed ? "0px" : "9999px",
          opacity: isCollapsed ? 0 : 1,
          overflow: "hidden",
          transition: "all 0.2s ease-in-out",
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
