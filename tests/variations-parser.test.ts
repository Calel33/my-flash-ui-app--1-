import { describe, expect, it } from 'vitest';

import { extractVariationsFromBuffer } from '../hooks/useVariations';

describe('extractVariationsFromBuffer', () => {
  it('extracts JSON objects incrementally', () => {
    const parsed = extractVariationsFromBuffer(
      '{"name":"A","html":"<div>a</div>"}{"name":"B","html":"<div>b</div>"}',
    );

    expect(parsed.buffer).toBe('');
    expect(parsed.variations).toEqual([
      { name: 'A', html: '<div>a</div>' },
      { name: 'B', html: '<div>b</div>' },
    ]);
  });

  it('keeps incomplete objects in the buffer', () => {
    const parsed = extractVariationsFromBuffer('{"name":"A","html":"<div>a</div>"');

    expect(parsed.variations).toEqual([]);
    expect(parsed.buffer).toBe('{"name":"A","html":"<div>a</div>"');
  });
});

