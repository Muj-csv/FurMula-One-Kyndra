import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Static SPA. No server, no env vars, no runtime services — see
// kyndra-architecture-final.md §2 and §9.
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
