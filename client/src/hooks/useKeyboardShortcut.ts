import { useEffect, useRef } from 'react';

/**
 * Options for the useKeyboardShortcut hook
 */
interface UseKeyboardShortcutOptions {
  /** The keyboard key to listen for (e.g., '/', 'Escape', 'Enter') */
  key: string;
  /** Function to call when the key is pressed */
  callback: () => void;
  /** Whether the shortcut is enabled (default: true) */
  enabled?: boolean;
  /** Whether to prevent the default browser behavior (default: true) */
  preventDefault?: boolean;
}

/**
 * Custom hook for handling global keyboard shortcuts
 * 
 * @param options - Configuration options for the keyboard shortcut
 * @returns void
 * 
 * @example
 * ```tsx
 * useKeyboardShortcut({
 *   key: '/',
 *   callback: () => focusSearchInput(),
 *   enabled: true,
 *   preventDefault: true
 * });
 * ```
 */
export const useKeyboardShortcut = ({
  key,
  callback,
  enabled = true,
  preventDefault = true,
}: UseKeyboardShortcutOptions) => {
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the pressed key matches our target key
      if (event.key === key) {
        // Don't trigger if user is typing in an input, textarea, or contenteditable
        const target = event.target as HTMLElement;
        const isTyping = 
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.contentEditable === 'true';

        if (!isTyping) {
          if (preventDefault) {
            event.preventDefault();
          }
          callbackRef.current();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [key, enabled, preventDefault]);
};

export default useKeyboardShortcut;
