import '@testing-library/jest-dom/vitest';

if (!('ResizeObserver' in globalThis)) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error - runtime polyfill for tests
  globalThis.ResizeObserver = ResizeObserver;
}

if (!('requestAnimationFrame' in globalThis)) {
  // @ts-expect-error - runtime polyfill for tests
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 16) as unknown as number;
}

if (!('cancelAnimationFrame' in globalThis)) {
  // @ts-expect-error - runtime polyfill for tests
  globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id as unknown as NodeJS.Timeout);
}

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  writable: true,
  value: () => ({
    scale() {},
    clearRect() {},
    beginPath() {},
    arc() {},
    fill() {},
    globalAlpha: 1,
    fillStyle: '',
    shadowColor: '',
    shadowBlur: 0,
  }),
});
