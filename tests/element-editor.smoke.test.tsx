import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ElementEditor, { type ElementData } from '../components/ElementEditor';

const baseElement: ElementData = {
  tagName: 'div',
  id: 'test',
  className: 'test',
  textContent: 'Hello',
  href: '',
  path: [0],
  computedStyles: {
    marginTop: '0px',
    marginRight: '0px',
    marginBottom: '0px',
    marginLeft: '0px',
    paddingTop: '0px',
    paddingRight: '0px',
    paddingBottom: '0px',
    paddingLeft: '0px',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    color: 'rgb(255, 255, 255)',
    fontSize: '16px',
    fontFamily: '"Inter", sans-serif',
    fontWeight: '400',
    lineHeight: '20px',
    letterSpacing: '0px',
    textAlign: 'left',
    borderRadius: '0px',
    borderWidth: '0px',
    borderColor: 'rgb(0, 0, 0)',
    width: '100px',
    height: '50px',
    display: 'block',
    position: 'static',
    gap: '0px',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    boxShadow: 'none',
    opacity: '1',
    transform: 'none',
  },
};

describe('ElementEditor smoke', () => {
  it('applies style changes and allows saving', async () => {
    const user = userEvent.setup();
    const onApplyChanges = vi.fn();
    const onSave = vi.fn();

    render(
      <ElementEditor
        isOpen
        element={baseElement}
        onClose={() => {}}
        onApplyChanges={onApplyChanges}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole('button', { name: /size/i }));

    const widthRow = screen.getByText('Width').closest('.property-row');
    expect(widthRow).toBeTruthy();
    const widthInput = within(widthRow as HTMLElement).getByRole('textbox');

    await user.clear(widthInput);
    await user.type(widthInput, '200px');

    expect(onApplyChanges).toHaveBeenCalledWith({ width: '200px' });

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).toBeEnabled();

    await user.click(saveButton);
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
