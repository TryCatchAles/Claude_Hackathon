import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // 'forks' (the v2 default) spawns child processes via child_process.fork,
    // which fails with EPERM on Windows + OneDrive due to file locking during sync.
    // 'vmThreads' uses worker_threads instead — no process spawning, no EPERM.
    pool: 'vmThreads',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
