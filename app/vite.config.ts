import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [react(), svgr()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    // 'forks' pool — the default threaded pool interacts badly with
    // vite-plugin-svgr's worker init, intermittently leaving jsdom
    // uninitialised ("document is not defined"). Forks pay a small
    // startup cost but are stable.
    pool: 'forks',
  },
})
