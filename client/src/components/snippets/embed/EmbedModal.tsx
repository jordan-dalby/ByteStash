import React, { useState } from 'react';
import { Code2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from '../../common/modals/Modal';
import { Switch } from '../../common/switch/Switch';
import { basePath } from '../../../utils/api/basePath';
import { Snippet } from '../../../types/snippets';
import { FullCodeBlock } from '../../editor/FullCodeBlock';
import { generateEmbedId } from '../../../utils/helpers/embedUtils';

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareId: string;
  snippet: Snippet;
}

export const EmbedModal: React.FC<EmbedModalProps> = ({
  isOpen,
  onClose,
  shareId,
  snippet
}) => {
  const { t: translateDefault } = useTranslation();
  const { t: translate } = useTranslation('components/snippets/embed');
  const [showTitle, setShowTitle] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [showFileHeaders, setShowFileHeaders] = useState(true);
  const [showPoweredBy, setShowPoweredBy] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [selectedFragment, setSelectedFragment] = useState<number | undefined>(undefined);

  const getEmbedCode = () => {
    const origin = window.location.origin;
    const embedUrl = `${origin}${basePath}/embed/${shareId}?showTitle=${showTitle}&showDescription=${showDescription}&showFileHeaders=${showFileHeaders}&showPoweredBy=${showPoweredBy}&theme=${theme}${
      selectedFragment !== undefined ? `&fragmentIndex=${selectedFragment}` : ''
    }`;
    
    const embedId = generateEmbedId({
      shareId,
      showTitle,
      showDescription,
      showFileHeaders,
      showPoweredBy,
      theme,
      fragmentIndex: selectedFragment
    });

    return `<iframe
  src="${embedUrl}"
  style="width: 100%; border: none; border-radius: 8px;"
  onload="(function(iframe) {
    window.addEventListener('message', function(e) {
      if (e.data.type === 'resize' && e.data.embedId === '${embedId}') {
        iframe.style.height = e.data.height + 'px';
      }
    });
  })(this);"
  title="ByteStash Code Snippet"
></iframe>`;
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-light-text dark:text-dark-text">
          <Code2 size={20} />
          <h2 className="text-xl font-bold">{translate('embedModal.title')}</h2>
        </div>
      }
    >
      <div className="space-y-6 text-light-text dark:text-dark-text" onClick={handleModalClick}>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{translate('embedModal.subTitle')}</h3>

          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <Switch 
                id="showTitle"
                checked={showTitle}
                onChange={setShowTitle}
              />
              <span>{translate('embedModal.form.showTitle')}</span>
            </label>

            <label className="flex items-center gap-2">
              <Switch 
                id="showDescription"
                checked={showDescription}
                onChange={setShowDescription}
              />
              <span>{translate('embedModal.form.showDescription')}</span>
            </label>

            <label className="flex items-center gap-2">
              <Switch 
                id="showFileHeaders"
                checked={showFileHeaders}
                onChange={setShowFileHeaders}
              />
              <span>{translate('embedModal.form.showFileHeaders')}</span>
            </label>

            <label className="flex items-center gap-2">
              <Switch 
                id="showPoweredBy"
                checked={showPoweredBy}
                onChange={setShowPoweredBy}
              />
              <span>{translate('embedModal.form.showPoweredBy')}</span>
            </label>

            <div>
              <label className="block text-sm mb-2">{translate('embedModal.form.theme')}</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                className="w-full px-3 py-2 bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text rounded-md border border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
              >
                <option value="system">{translateDefault('theme.system')}</option>
                <option value="light">{translateDefault('theme.light')}</option>
                <option value="dark">{translateDefault('theme.dark')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2">{translate('embedModal.form.fragmentToShow.label')}</label>
              <select
                value={selectedFragment === undefined ? '' : selectedFragment}
                onChange={(e) => setSelectedFragment(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text rounded-md border border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
              >
                <option value="">{translate('embedModal.form.fragmentToShow.all')}</option>
                {snippet.fragments.map((fragment, index) => (
                  <option key={index} value={index}>
                    {fragment.file_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">{translate('embedModal.form.embedCode')}</h3>
          <FullCodeBlock
            code={getEmbedCode()}
            language={'html'}
            showLineNumbers={false}
          />
        </div>
      </div>
    </Modal>
  );
};

export default EmbedModal;
