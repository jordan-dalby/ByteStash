import React from 'react';

export const Switch: React.FC<{
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ id, checked, onChange }) => (
  <button
    type="button"
    id={id}
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`
      relative inline-flex h-5 w-9 items-center rounded-full
      transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-light-primary dark:focus-visible:ring-dark-primary
      ${checked ? 'bg-light-primary dark:bg-dark-primary' : 'bg-light-hover dark:bg-dark-hover'}
    `}
  >
    <span
      className={`
        inline-block h-4 w-4 transform rounded-full
        transition duration-200 ease-in-out
        ${checked ? 'translate-x-4 bg-white' : 'translate-x-1 bg-light-text-secondary dark:bg-dark-text-secondary'}
      `}
    />
  </button>
);
