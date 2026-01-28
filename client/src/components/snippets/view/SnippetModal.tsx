import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Snippet } from "../../../types/snippets";
import { ConfirmationModal } from "../../common/modals/ConfirmationModal";
import Modal from "../../common/modals/Modal";
import { FullCodeView } from "./FullCodeView";

export interface SnippetModalProps {
  snippet: Snippet;
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
  const { t } = useTranslation();
  const { t: translate } = useTranslation('components/snippets/view/all');

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
        title={
          isRecycleView
            ? translate('snippetModal.confirmationModal.title.isRecycleView.true')
            : translate('snippetModal.confirmationModal.title.isRecycleView.false')
        }
        message={
          isRecycleView
            ? translate('snippetModal.confirmationModal.message.isRecycleView.true', { title: snippet.title })
            : translate('snippetModal.confirmationModal.message.isRecycleView.false', { title: snippet.title })
        }
        confirmLabel={
          isRecycleView
            ? translate('snippetModal.confirmationModal.confirmLabel.isRecycleView.true')
            : translate('snippetModal.confirmationModal.confirmLabel.isRecycleView.false')
        }
        cancelLabel={t('action.cancel')}
        variant="danger"
      />
    </>
  );
};

export default SnippetModal;
