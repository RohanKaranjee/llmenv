import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  minify: false,
  splitting: false,
  bundle: true,
  banner: {
    js: '#!/usr/bin/env node'
  },
  external: [
    'commander',
    'inquirer',
    'chalk',
    'ora'
  ]
})
