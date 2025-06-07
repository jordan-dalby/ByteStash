import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CommandPalette } from './CommandPalette';

const mockSnippets = [
  {
    id: '1',
    title: 'Test Snippet',
    description: 'A test snippet',
    categories: ['test'],
    fragments: [{ file_name: 'test.js', code: 'console.log("test")', language: 'javascript', position: 0 }],
    updated_at: '2023-01-01T00:00:00Z',
    is_public: 0
  }
];

const mockActions = [
  {
    id: 'test-action',
    label: 'Test Action',
    description: 'A test action',
    action: vi.fn(),
    keywords: ['test']
  }
];

describe('CommandPalette', () => {
  it('renders when open', () => {
    render(
      <CommandPalette
        isOpen={true}
        onClose={vi.fn()}
        actions={mockActions}
        snippets={mockSnippets}
      />
    );
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <CommandPalette
        isOpen={false}
        onClose={vi.fn()}
        actions={mockActions}
        snippets={mockSnippets}
      />
    );
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
}); 