import { defineConfig } from '@sanity/pkg-utils'

export default defineConfig({
  bundles: [
    {
      source: './src/lib/resolve-studio-config/worker.ts',
      require: './dist/resolve-studio-config-worker.js',
      runtime: 'node',
    },
  ],
})
