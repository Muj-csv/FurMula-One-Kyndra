import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Static SPA. No server, no env vars, no runtime services — see
// kyndra-architecture-final.md §2 and §9.
export default defineConfig({
  plugins: [react()],
  test: {
    // .tsx too: the UI smoke tests render components. They opt into jsdom
    // with a per-file `@vitest-environment` docblock rather than switching
    // the whole suite — the engine tests are pure and stay on node.
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    environment: 'node',
    // tests/palette.test.ts reads the real stylesheet with `?raw`. Vitest
    // stubs CSS imports by default, which returns an empty string and makes
    // that test silently measure nothing.
    css: true,
  },
});
