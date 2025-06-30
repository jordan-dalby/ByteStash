import React, { useState, useCallback } from "react";
import { Snippet } from "../../../types/snippets";
import Modal from "../../common/modals/Modal";
import { FullCodeView } from "./FullCodeView";
import { ConfirmationModal } from "../../common/modals/ConfirmationModal";

export interface SnippetModalProps {
  snippet: Snippet | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (snippet: Snippet) => void;
  onDelete?: (id: string) => Promise<void>;
  onCategoryClick: (category: string) => void;
  showLineNumbers: boolean;
  isPublicView: boolean;
  isRecycleView?: boolean;
}

const SnippetModal: React.FC<SnippetModalProps> = ({
  snippet,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onCategoryClick,
  showLineNumbers,
  isPublicView,
  isRecycleView
}) => {
  if (!snippet) return null;

  const handleCategoryClick = (e: React.MouseEvent, category: string) => {
    e.preventDefault();
    onCategoryClick(category);
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [snippetToDelete, setSnippetToDelete] = useState<Snippet | null>(null);

  const handleDeleteSnippet = useCallback(() => {
    setSnippetToDelete(snippet);
    setIsDeleteModalOpen(true);
  }, [snippet]);

  const confirmDeleteSnippet = useCallback(async () => {
    if (snippetToDelete && onDelete) {
      await onDelete(snippetToDelete.id);
      onClose();
    }
    setSnippetToDelete(null);
    setIsDeleteModalOpen(false);
  }, [snippetToDelete, onDelete, onClose]);

  const cancelDeleteSnippet = useCallback(() => {
    setIsDeleteModalOpen(false);
  }, []);

  const handleEditSnippet = useCallback(() => {
    if (snippet && onEdit) {
      onEdit(snippet);
      onClose();
    }
  }, [snippet, onEdit, onClose]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        onEdit={handleEditSnippet}
        onDelete={handleDeleteSnippet}
        title={
          <h2 className="text-2xl font-bold text-light-text dark:text-dark-text">{snippet.title}</h2>
        }
        expandable={true}
      >
        <FullCodeView
          showTitle={false}
          snippet={snippet}
          showLineNumbers={showLineNumbers}
          onCategoryClick={() => handleCategoryClick}
          isModal={true}
          isPublicView={isPublicView}
        />
      </Modal>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDeleteSnippet}
        onConfirm={confirmDeleteSnippet}
         title={isRecycleView ? "Confirm Deletion" : "Move to Recycle Bin"}
        message={
          isRecycleView
            ? `Are you sure you want to permanently delete "${snippet.title}"? This action cannot be undone.`
            : `Are you sure you want to move "${snippet.title}" to the Recycle Bin?`
        }
        confirmLabel={isRecycleView ? "Delete Permanently" : "Move to Recycle Bin"}
        cancelLabel="Cancel"
        variant="danger"
      />
    </>
  );
};

export default SnippetModal;
