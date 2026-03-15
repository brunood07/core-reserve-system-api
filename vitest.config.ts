import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'prisma/**',
        'src/interface/**',
        'src/infrastructure/**',
      ],
      include: [
        'src/domain/**',
        'src/application/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@/domain': resolve(__dirname, 'src/domain'),
      '@/application': resolve(__dirname, 'src/application'),
      '@/infrastructure': resolve(__dirname, 'src/infrastructure'),
      '@/interface': resolve(__dirname, 'src/interface'),
    },
  },
})
