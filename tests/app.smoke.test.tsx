import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const streamFrom = (chunks: string[]) => ({
  async *[Symbol.asyncIterator]() {
    for (const chunk of chunks) yield chunk;
  },
});

vi.mock('../ai/generate', () => {
  return {
    generateStyles: vi.fn(async () => '/* test styles */'),
    streamHtmlArtifact: vi.fn(() => streamFrom(['<div>hello</div>'])),
    streamReactComponent: vi.fn(() => streamFrom(['export const Component = () => null;'])),
    streamSnippetExtraction: vi.fn(() => streamFrom(['<div>snippet</div>'])),
    streamSnippetToReact: vi.fn(() => streamFrom(['export const Snippet = () => null;'])),
    streamVariations: vi.fn(() => streamFrom(['[]'])),
    cleanCodeFences: (value: string) => value,
  };
});

describe('App smoke', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.stubGlobal('alert', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders empty state', async () => {
    const { App } = await import('../index.tsx');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Flash UI' })).toBeInTheDocument();
  });

  it('persists default preferences on mount', async () => {
    const { App } = await import('../index.tsx');

    render(<App />);

    await waitFor(() => {
      expect(localStorage.getItem('flash_ui_provider')).toBe('gemini');
      expect(localStorage.getItem('flash_ui_concurrent_generations')).toBe('3');
      expect(localStorage.getItem('flash_ui_bar_position')).toBe('bottom');
      expect(localStorage.getItem('flash_ui_bar_hidden')).toBe('false');
    });
  });

  it('can send a prompt and save result to library', async () => {
    const user = userEvent.setup();
    const { App } = await import('../index.tsx');
    const generate = await import('../ai/generate');

    render(<App />);

    await user.click(screen.getAllByRole('button', { name: 'Open prompt editor' })[0]);
    await user.type(screen.getByPlaceholderText('Describe a UI component...'), 'A simple card UI');
    await user.click(screen.getByRole('button', { name: 'Send prompt' }));

    expect(generate.streamHtmlArtifact).toHaveBeenCalledTimes(3);

    await waitFor(() => {
      expect(document.querySelector('.artifact-card')).toBeTruthy();
    });
    await user.click(document.querySelector('.artifact-card') as HTMLElement);

    const getEnabledStoreButton = () =>
      screen.getAllByTitle('Archive to Library').find((el) => !(el as HTMLButtonElement).disabled);

    await waitFor(() => {
      expect(getEnabledStoreButton()).toBeTruthy();
    });
    await user.click(getEnabledStoreButton() as HTMLElement);

    await user.click(screen.getAllByTitle('My Creative Library')[0]);
    expect(await screen.findByText('Creative Library')).toBeInTheDocument();

    await waitFor(() => {
      const saved = localStorage.getItem('flash_ui_creative_library');
      expect(saved).toBeTruthy();
      expect(JSON.parse(saved ?? '[]')).toHaveLength(1);
    });
  });

  it('opens and closes the library drawer', async () => {
    const user = userEvent.setup();
    const { App } = await import('../index.tsx');

    render(<App />);

    await user.click(screen.getAllByTitle('My Creative Library')[0]);
    expect(await screen.findByText('Creative Library')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '×' }));
    await waitFor(() => {
      expect(screen.queryByText('Creative Library')).not.toBeInTheDocument();
    });
  });
});
