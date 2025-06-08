import React, { useEffect, useState } from 'react';
import { Key, Plus, Trash2, X } from 'lucide-react';
import Modal from '../common/modals/Modal';
import { ApiKey } from '../../types/apiKey';
import { getApiKeys, createApiKey, deleteApiKey } from '../../utils/api/apiKeys';
import { PreviewCodeBlock } from '../editor/PreviewCodeBlock';
import { IconButton } from '../common/buttons/IconButton';

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeysModal: React.FC<ApiKeysModalProps> = ({ isOpen, onClose }) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewKey(null);
      loadApiKeys();
    }
  }, [isOpen]);

  const loadApiKeys = async () => {
    try {
      const keys = await getApiKeys();
      setApiKeys(keys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;

    try {
      setIsCreating(true);
      const response = await createApiKey({ name: newKeyName.trim() });
      setNewKey(response.key);
      setNewKeyName('');
      await loadApiKeys();
    } catch (error) {
      console.error('Failed to create API key:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      await deleteApiKey(id);
      await loadApiKeys();
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="API Keys">
      <div className="space-y-4">
        {/* Create new key section */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Enter key name"
              className="flex-1 px-3 py-2 bg-light-hover dark:bg-dark-hover border border-light-border
                dark:border-dark-border rounded-md text-sm text-light-text dark:text-dark-text
                focus:border-light-primary dark:focus:border-dark-primary outline-none
                transition-colors"
            />
            <IconButton
              icon={<Plus size={20} />}
              label="Create Key"
              onClick={handleCreateKey}
              variant="action"
              className="h-10 pl-2 pr-4"
              showLabel={true}
              disabled={isCreating || !newKeyName.trim()}
            />
          </div>

          {/* Display newly created key */}
          {newKey && (
            <div className="p-3 bg-light-hover dark:bg-dark-hover rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-light-text dark:text-dark-text">
                  New API Key (copy it now, it won't be shown again)
                </span>
                <button
                  onClick={() => setNewKey(null)}
                  className="text-light-text-secondary dark:text-dark-text-secondary
                    hover:text-light-primary dark:hover:text-dark-primary transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <PreviewCodeBlock
                code={newKey}
                language='plaintext'
                showLineNumbers={false}
                previewLines={1}
              />
            </div>
          )}
        </div>

        {/* List of existing keys */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-light-text dark:text-dark-text">Your API Keys</h3>
          <div className="space-y-2">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-3 bg-light-surface dark:bg-dark-surface
                  border border-light-border dark:border-dark-border rounded-md hover:bg-light-hover-more
                  dark:hover:bg-dark-hover-more transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Key size={16} className="text-light-text dark:text-dark-text" />
                    <span className="text-sm font-medium text-light-text dark:text-dark-text">
                      {key.name}
                    </span>
                  </div>
                  <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                    Created: {new Date(key.created_at).toLocaleDateString()}
                    {key.last_used && ` • Last used: ${new Date(key.last_used).toLocaleDateString()}`}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteKey(key.id)}
                  className="p-1 text-light-text-secondary dark:text-dark-text-secondary
                    hover:text-red-500 transition-colors"
                  aria-label="Delete API key"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {apiKeys.length === 0 && (
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center py-4">
                No API keys found
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
