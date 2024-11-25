import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import { Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface GitHubRelease {
  tag_name: string;
  published_at: string;
  body: string;
  prerelease: boolean;
}

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReleases = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('https://api.github.com/repos/jordan-dalby/ByteStash/releases');
        if (!response.ok) {
          throw new Error('Failed to fetch releases');
        }
        const data = await response.json();
        setReleases(data);
      } catch (err) {
        setError('Failed to load changelog. Please try again later.');
        console.error('Error fetching releases:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReleases();
  }, [isOpen]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={<h2 className="text-xl font-bold text-light-text dark:text-dark-text">Changelog</h2>}
    >
      <div className="pb-4">
        <div className="space-y-8">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 text-light-text-secondary dark:text-dark-text-secondary animate-spin" />
            </div>
          ) : error ? (
            <div className="text-red-400 text-center py-4">{error}</div>
          ) : releases.length === 0 ? (
            <div className="text-light-text-secondary dark:text-dark-text-secondary text-center py-4">No releases found</div>
          ) : (
            releases.map((release) => (
              <div key={release.tag_name} className="border-b border-light-border dark:border-dark-border pb-6 last:border-0">
                <div className="flex flex-col mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">
                      {release.tag_name}
                      {release.prerelease && (
                        <span className="ml-2 text-xs bg-light-surface dark:bg-dark-surface text-light-text-secondary dark:text-dark-text-secondary px-2 py-1 rounded">
                          Pre-release
                        </span>
                      )}
                    </h3>
                  </div>
                  <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                    {formatDate(release.published_at)}
                  </span>
                </div>
                <div className="markdown-content bg-light-surface dark:bg-dark-surface rounded-lg">
                  <ReactMarkdown className="markdown prose dark:prose-invert max-w-none">
                    {release.body}
                  </ReactMarkdown>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ChangelogModal;
