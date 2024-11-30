import React, { useState, useEffect } from 'react';
import { Share as ShareIcon, Trash2, Link as LinkIcon, Check, ShieldCheck, ShieldOff, Code2 } from 'lucide-react';
import parseDuration from 'parse-duration';
import { formatDistanceToNow } from 'date-fns';
import { Share, ShareSettings, Snippet } from '../../../types/snippets';
import { useToast } from '../../../hooks/useToast';
import { createShare, deleteShare, getSharesBySnippetId } from '../../../utils/api/share';
import { basePath } from '../../../utils/api/basePath';
import Modal from '../../common/modals/Modal';
import { Switch } from '../../common/switch/Switch';
import EmbedModal from '../embed/EmbedModal';

interface ShareMenuProps {
  isOpen: boolean;
  onClose: () => void;
  snippet: Snippet;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({ isOpen, onClose, snippet }) => {
  const [shares, setShares] = useState<Share[]>([]);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [expiresIn, setExpiresIn] = useState<string>('');
  const [durationError, setDurationError] = useState<string>('');
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [selectedShareId, setSelectedShareId] = useState<string | null>(null);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const { addToast } = useToast();
  
  useEffect(() => {
    if (isOpen) {
      loadShares();
      setCopiedStates({});
    }
  }, [isOpen, snippet]);

  const loadShares = async () => {
    try {
      const loadedShares = await getSharesBySnippetId(snippet.id);
      setShares(loadedShares);
    } catch (error) {
      addToast('Failed to load shares', 'error');
    }
  };

  const handleCreateShare = async () => {
    if (expiresIn) {
      const seconds = parseDuration(expiresIn, 's');
      if (!seconds) {
        setDurationError('Invalid duration format. Use 1h, 2d, 30m etc.');
        return;
      }
      setDurationError('');
    }

    try {
      const settings: ShareSettings = {
        requiresAuth,
        expiresIn: expiresIn ? Math.floor(parseDuration(expiresIn, 's')!) : undefined
      };
      
      await createShare(snippet.id, settings);
      await loadShares();
      addToast('Share link created', 'success');
      
      setRequiresAuth(false);
      setExpiresIn('');
    } catch (error) {
      addToast('Failed to create share link', 'error');
    }
  };

  const handleDeleteShare = async (shareId: string) => {
    try {
      await deleteShare(shareId);
      setShares(shares.filter(share => share.id !== shareId));
      addToast('Share link deleted', 'success');
    } catch (error) {
      addToast('Failed to delete share link', 'error');
    }
  };

  const copyShareLink = async (shareId: string) => {
    const url = `${window.location.origin}${basePath}/s/${shareId}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
        } finally {
          textArea.remove();
        }
      }

      setCopiedStates(prev => ({ ...prev, [shareId]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [shareId]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleEmbedClick = (shareId: string) => {
    setSelectedShareId(shareId);
    setIsEmbedModalOpen(true);
  };

  const getRelativeExpiryTime = (expiresAt: string): string => {
    try {
      const expiryDate = new Date(expiresAt);
      return `Expires in ${formatDistanceToNow(expiryDate)}`;
    } catch (error) {
      console.error('Error formatting expiry date:', error);
      return 'Unknown expiry time';
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2 text-light-text dark:text-dark-text">
            <ShareIcon size={20} />
            <h2 className="text-xl font-bold">Share Snippet</h2>
          </div>
        }
      >
        <div className="space-y-6 text-light-text dark:text-dark-text">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Create New Share Link</h3>
            
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <Switch 
                  id="useAuth"
                  checked={requiresAuth}
                  onChange={setRequiresAuth}/>
                <span>Require authentication</span>
              </label>

              <div>
                <label className="block text-sm mb-1">Expires in (e.g. 1h, 2d, 30m)</label>
                <input
                  type="text"
                  value={expiresIn}
                  onChange={e => {
                    setExpiresIn(e.target.value);
                    setDurationError('');
                  }}
                  placeholder="Never"
                  className="w-full px-3 py-2 bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text rounded-md border border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
                />
                {durationError && (
                  <p className="text-red-400 text-sm mt-1">{durationError}</p>
                )}
              </div>

              <button
                onClick={handleCreateShare}
                className="w-full py-2 bg-light-primary dark:bg-dark-primary text-white rounded-md hover:opacity-90 transition-colors"
              >
                Create Share Link
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Active Share Links</h3>
            
            {shares.length === 0 ? (
              <p className="text-light-text-secondary dark:text-dark-text-secondary">No active share links</p>
            ) : (
              <div className="space-y-2">
                {shares.map(share => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 bg-light-surface dark:bg-dark-surface rounded-md border border-light-border dark:border-dark-border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{share.id}</span>
                        {share.requires_auth === 1 && (
                          <span className="text-emerald-500 dark:text-emerald-400" title="Protected - Authentication required">
                            <ShieldCheck size={15} className="stroke-[2.5]" />
                          </span>
                        )}
                        {share.requires_auth === 0 && (
                          <span className="text-light-text-secondary dark:text-dark-text-secondary" title="Public access">
                            <ShieldOff size={15} className="stroke-[2.5]" />
                          </span>
                        )}
                        <div className="flex items-center">
                          {share.expired === 1 && (
                            <span className="px-2 py-0.5 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 dark:border-red-500/30 rounded text-xs">
                              Expired
                            </span>
                          )}
                          {share.expires_at && share.expired === 0 && (
                            <span className="px-2 py-0.5 bg-light-primary/10 dark:bg-dark-primary/20 text-light-primary dark:text-dark-primary border border-light-primary/20 dark:border-dark-primary/30 rounded text-xs">
                              {getRelativeExpiryTime(share.expires_at)}
                            </span>
                          )}
                          {share.expires_at === null && (
                            <span className="px-2 py-0.5 bg-light-primary/10 dark:bg-dark-primary/20 text-light-primary dark:text-dark-primary border border-light-primary/20 dark:border-dark-primary/30 rounded text-xs">
                              Never Expires
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyShareLink(share.id)}
                        className="p-2 hover:bg-light-hover dark:hover:bg-dark-hover rounded-md transition-colors"
                        title="Copy link"
                      >
                        {copiedStates[share.id] ? (
                          <Check size={16} className="text-light-primary dark:text-dark-primary" />
                        ) : (
                          <LinkIcon size={16} className="text-light-text dark:text-dark-text" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEmbedClick(share.id)}
                        className="p-2 hover:bg-light-hover dark:hover:bg-dark-hover rounded-md transition-colors"
                        title="Embed snippet"
                      >
                        <Code2 size={16} className="text-light-text dark:text-dark-text" />
                      </button>
                      <button
                        onClick={() => handleDeleteShare(share.id)}
                        className="p-2 hover:bg-light-hover dark:hover:bg-dark-hover rounded-md transition-colors"
                        title="Delete share link"
                      >
                        <Trash2 size={16} className="hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {selectedShareId && (
        <EmbedModal
          isOpen={isEmbedModalOpen}
          onClose={() => {
            setIsEmbedModalOpen(false);
            setSelectedShareId(null);
          }}
          shareId={selectedShareId}
          snippet={snippet}
        />
      )}
    </>
  );
};
