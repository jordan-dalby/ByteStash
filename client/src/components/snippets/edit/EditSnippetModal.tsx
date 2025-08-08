import React, { useState, useEffect } from 'react';
import 'prismjs';
import 'prismjs/components/prism-markup-templating.js';
import 'prismjs/themes/prism.css';
import { Plus } from 'lucide-react';
import { CodeFragment, Snippet } from '../../../types/snippets';
import Modal from '../../common/modals/Modal';
import CategoryList from '../../categories/CategoryList';
import CategorySuggestions from '../../categories/CategorySuggestions';
import { FragmentEditor } from './FragmentEditor';
import { Switch } from '../../../components/common/switch/Switch';

export interface EditSnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (snippetData: Omit<Snippet, 'id' | 'updated_at'>) => void;
  snippetToEdit: Snippet | null;
  showLineNumbers: boolean;
  allCategories: string[];
}

const EditSnippetModal: React.FC<EditSnippetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  snippetToEdit,
  showLineNumbers,
  allCategories
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fragments, setFragments] = useState<CodeFragment[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublic, setIsPublic] = useState(snippetToEdit?.is_public || false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFragments([{
      file_name: 'main',
      code: '',
      language: '',
      position: 0
    }]);
    setCategories([]);
    setError('');
    setCategoryInput('');
    setHasUnsavedChanges(false);
  };

  useEffect(() => {
    if (isOpen) {
      if (snippetToEdit) {
        setTitle(snippetToEdit.title?.slice(0, 255) || '');
        setDescription(snippetToEdit.description || '');
        setFragments(JSON.parse(JSON.stringify(snippetToEdit.fragments || [])));
        setCategories(snippetToEdit.categories || []);
        setIsPublic(snippetToEdit.is_public || false);
      } else {
        resetForm();
      }
    }
  }, [isOpen, snippetToEdit]);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleCategorySelect = (category: string) => {
    const normalizedCategory = category.toLowerCase().trim();
    if (normalizedCategory && categories.length < 20 && !categories.includes(normalizedCategory)) {
      setCategories(prev => [...prev, normalizedCategory]);
      setHasUnsavedChanges(true);
    }
    setCategoryInput('');
  };

  const handleRemoveCategory = (e: React.MouseEvent, category: string) => {
    e.preventDefault();
    setCategories(cats => cats.filter(c => c !== category));
    setHasUnsavedChanges(true);
  };

  const handleAddFragment = () => {
    setFragments(current => [
      ...current,
      {
        file_name: `file${current.length + 1}`,
        code: '',
        language: '',
        position: current.length
      }
    ]);
    setHasUnsavedChanges(true);
  };

  const handleUpdateFragment = (index: number, updatedFragment: CodeFragment) => {
    setFragments(current => {
      const newFragments = [...current];
      newFragments[index] = updatedFragment;
      return newFragments;
    });
    setHasUnsavedChanges(true);
  };

  const handleDeleteFragment = (index: number) => {
    if (fragments.length > 1) {
      setFragments(current => current.filter((_, i) => i !== index));
      setHasUnsavedChanges(true);
    }
  };

  const moveFragment = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;

    if (toIndex < 0 || toIndex >= fragments.length) return;

    setFragments(current => {
      const newFragments = [...current];
      const [movedFragment] = newFragments.splice(fromIndex, 1);
      newFragments.splice(toIndex, 0, movedFragment);
      return newFragments.map((fragment, index) => ({
        ...fragment,
        position: index
      }));
    });
    setHasUnsavedChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (fragments.length === 0) {
      setError('At least one code fragment is required');
      return;
    }

    if (fragments.some(f => !f.file_name.trim())) {
      setError('All fragments must have file names');
      return;
    }

    setIsSubmitting(true);
    const snippetData = {
      title: title.slice(0, 255),
      description: description,
      fragments: fragments.map((f, idx) => ({ ...f, position: idx })),
      categories: categories,
      is_public: isPublic ? 1 : 0
    };

    try {
      await onSubmit(snippetData);
      setHasUnsavedChanges(false);
      onClose();
    } catch (error) {
      setError('An error occurred while saving the snippet. Please try again.');
      console.error('Error saving snippet:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      expandable={true}
      title={
        <h2 className="text-xl font-bold text-light-text dark:text-dark-text">
          {snippetToEdit ? 'Edit Snippet' : 'Add New Snippet'}
        </h2>
      }
    >
      <style>
        {`
          .modal-footer {
            position: sticky;
            background: var(--footer-bg);
            border-top: 1px solid var(--footer-border);
            margin-top: 1rem;
            z-index: 100;
          }

          .modal-footer::before {
            content: '';
            position: absolute;
            bottom: 100%;
            left: 0;
            right: 0;
            height: 20px;
            background: linear-gradient(to top, var(--footer-bg), transparent);
            pointer-events: none;
          }

          .add-fragment-button {
            transition: all 0.2s ease-in-out;
          }

          .add-fragment-button:hover {
            transform: translateY(-1px);
          }

          :root {
            --footer-bg: var(--light-surface);
            --footer-border: var(--light-border);
          }

          .dark {
            --footer-bg: var(--dark-surface);
            --footer-border: var(--dark-border);
          }
        `}
      </style>
      <div className="flex flex-col h-full max-h-full relative isolate">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-none">
            {error && <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="space-y-4 pr-2">
              {/* Title input */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-light-text dark:text-dark-text">Title</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value.slice(0, 100));
                    setHasUnsavedChanges(true);
                  }}
                  className="mt-1 block w-full rounded-md bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text p-2 text-sm
                    border border-light-border dark:border-dark-border
                    focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:border-light-primary dark:focus:border-dark-primary"
                  required
                  placeholder="Enter the title of the snippet (max 100 characters)"
                  maxLength={100}
                />
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">{title.length}/100 characters</p>
              </div>

              {/* Description input */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-light-text dark:text-dark-text">Description</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="mt-1 block w-full rounded-md bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text p-2 text-sm
                    border border-light-border dark:border-dark-border
                    focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:border-light-primary dark:focus:border-dark-primary"
                  rows={3}
                  placeholder="Write a short description of the snippet"
                />
              </div>

              {/* Categories section */}
              <div>
                <label htmlFor="categories" className="block text-sm font-medium text-light-text dark:text-dark-text">
                  Categories (max 20)
                </label>
                <CategorySuggestions
                  inputValue={categoryInput}
                  onInputChange={setCategoryInput}
                  onCategorySelect={handleCategorySelect}
                  existingCategories={allCategories}
                  selectedCategories={categories}
                  placeholder="Type a category and press Enter or comma"
                  maxCategories={20}
                  showAddText={true}
                  handleHashtag={false}
                  className="mt-1 block w-full rounded-md bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text p-2 text-sm
                    border border-light-border dark:border-dark-border
                    focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:border-light-primary dark:focus:border-dark-primary"
                />
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                  {categories.length}/20 categories
                </p>
                <CategoryList
                  categories={categories}
                  onCategoryClick={handleRemoveCategory}
                  className="mt-2"
                  variant="removable"
                />
              </div>

              {/* Public snippet section */}
              <div className="space-y-1">
                <label className="flex items-center gap-2">
                  <Switch
                    id="isPublic"
                    checked={!!isPublic}
                    onChange={(checked) => {
                      setIsPublic(checked);
                      setHasUnsavedChanges(true);
                    }}
                  />
                  <span className="text-sm font-medium text-light-text dark:text-dark-text">Make snippet public</span>
                </label>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Public snippets can be viewed by anyone without authentication
                </p>
              </div>

              {/* Code Fragments section */}
              <div>
                <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-4">
                  Code Fragments ({fragments.length})
                </label>

                <div className="space-y-4">
                  {fragments.map((fragment, index) => (
                    <FragmentEditor
                      key={index}
                      fragment={fragment}
                      onUpdate={(updated) => handleUpdateFragment(index, updated)}
                      onDelete={() => handleDeleteFragment(index)}
                      showLineNumbers={showLineNumbers}
                      onMoveUp={() => moveFragment(index, 'up')}
                      onMoveDown={() => moveFragment(index, 'down')}
                      canMoveUp={index > 0}
                      canMoveDown={index < fragments.length - 1}
                    />
                  ))}

                  {/* New Add Fragment button positioned below fragments */}
                  <button
                    type="button"
                    onClick={handleAddFragment}
                    className="add-fragment-button w-full py-3 px-4 border-2 border-dashed border-light-border dark:border-dark-border rounded-lg
                             hover:border-light-primary dark:hover:border-dark-primary hover:bg-light-hover dark:hover:bg-dark-hover transition-all duration-200
                             flex items-center justify-center gap-2 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-primary dark:hover:text-dark-primary group"
                  >
                    <Plus size={20} className="transition-transform group-hover:scale-110" />
                    <span className="text-sm font-medium">Add New Fragment</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          {
                // --> Shivam Naik - 07.08.2025
                // Added more specificity to footer background to avoid visible background elements in edit/create snippet mode.
                // <-- Shivam Naik - 07.08.2025
          }
          <div className="!bg-light-surface dark:!bg-dark-surface modal-footer -bottom-5 inset-x-0 mt-4 z-10">
            <div className="flex justify-end gap-2 py-4">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-4 py-2 bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text rounded-md
                  hover:bg-light-hover dark:hover:bg-dark-hover text-sm border border-light-border dark:border-dark-border"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-light-primary dark:bg-dark-primary text-white rounded-md hover:opacity-90 text-sm
                  disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : (snippetToEdit ? 'Save Changes' : 'Add Snippet')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EditSnippetModal;
