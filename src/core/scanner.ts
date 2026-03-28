import fs from 'fs/promises';
import path from 'path';

/**
 * Result of the project scan
 */
export interface ScanResult {
  dependencies: string[];
  devDependencies: string[];
  features: string[];
  nodeVersion?: string;
  projectName?: string;
  typescript: {
    enabled: boolean;
    strict: boolean;
    aliases: string[];
  };
  linting: string[];
  envVars: string[];
  structure: {
    componentPatterns: string[];
    hasApi: boolean;
    hasTests: boolean;
  };
}

/**
 * Scan a project directory and extract AI-relevant context
 */
export async function scanProject(cwd: string): Promise<ScanResult> {
  const result: ScanResult = {
    dependencies: [],
    devDependencies: [],
    features: [],
    typescript: { enabled: false, strict: false, aliases: [] },
    linting: [],
    envVars: [],
    structure: { componentPatterns: [], hasApi: false, hasTests: false },
  };

  // 1. Scan package.json
  const packagePath = path.join(cwd, 'package.json');
  try {
    const pkgStr = await fs.readFile(packagePath, 'utf-8');
    const pkg = JSON.parse(pkgStr);
    
    if (pkg.name) result.projectName = pkg.name;
    
    // Extract major tech stack with versions
    const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    const extractDeps = (depsObj: Record<string, string>, target: string[]) => {
      for (const [name, rawVersion] of Object.entries(depsObj)) {
        // Only grab major ones to avoid bloat
        if (
          name.includes('react') || name.includes('next') || name.includes('vue') ||
          name.includes('svelte') || name.includes('nuxt') || name.includes('express') ||
          name.includes('tailwindcss') || name.includes('prisma') || name.includes('drizzle') ||
          name.includes('vite') || name.includes('webpack') || name.includes('typescript') ||
          name.includes('jest') || name.includes('vitest') || name.includes('cypress') ||
          name.includes('playwright')
        ) {
          const version = rawVersion.replace(/[\^~]/, '');
          target.push(`${name}@${version}`);
        }
      }
    };
    
    extractDeps(pkg.dependencies || {}, result.dependencies);
    extractDeps(pkg.devDependencies || {}, result.devDependencies);

    if (pkg.engines?.node) {
      result.nodeVersion = pkg.engines.node;
    }

  } catch {
    // No package.json, skip
  }

  // 2. Scan tsconfig.json
  const tsconfigPath = path.join(cwd, 'tsconfig.json');
  try {
    const tsStr = await fs.readFile(tsconfigPath, 'utf-8');
    // Basic regex to extract stuff since tsconfig might have comments (JSON.parse fails)
    result.typescript.enabled = true;
    
    if (tsStr.includes('"strict": true') || tsStr.includes('"strict":true')) {
      result.typescript.strict = true;
    }

    if (tsStr.includes('"paths"')) {
      const match = tsStr.match(/"(@\/[^"]+)"/g);
      if (match) {
        result.typescript.aliases = [...new Set(match.map(m => m.replace(/"/g, '')))];
      }
    }
  } catch {
    // No tsconfig
  }

  // 3. Scan Linting/Formatting
  if (await fileExists(path.join(cwd, '.eslintrc.json')) || await fileExists(path.join(cwd, '.eslintrc.js'))) {
    result.linting.push('ESLint enabled');
  }
  if (await fileExists(path.join(cwd, 'eslint.config.js')) || await fileExists(path.join(cwd, 'eslint.config.ts'))) {
    result.linting.push('ESLint (Flat Config) enabled');
  }
  if (await fileExists(path.join(cwd, '.prettierrc')) || await fileExists(path.join(cwd, '.prettierrc.json'))) {
    result.linting.push('Prettier formatting');
  }

  // 4. Scan Environment Variables (.env.example)
  const envExamplePath = path.join(cwd, '.env.example');
  try {
    const envStr = await fs.readFile(envExamplePath, 'utf-8');
    const lines = envStr.split('\n');
    for (const line of lines) {
      if (line.trim() && !line.startsWith('#')) {
        const key = line.split('=')[0].trim();
        if (key) result.envVars.push(key);
      }
    }
  } catch {
    // No .env.example
  }

  // 5. Scan Folder Structure Concepts
  const srcDirs = ['src', 'app', 'lib', 'components', 'pages', 'api'];
  for (const dir of srcDirs) {
    if (await fileExists(path.join(cwd, dir))) {
      result.features.push(`Has \`/${dir}\` directory`);
      if (dir === 'api') result.structure.hasApi = true;
    }
    // Check src/app vs src/pages for NextJS
    if (await fileExists(path.join(cwd, 'src', dir))) {
      result.features.push(`Has \`src/${dir}\` structure`);
      if (dir === 'api') result.structure.hasApi = true;
    }
  }

  // Testing directories
  if (await fileExists(path.join(cwd, 'tests')) || await fileExists(path.join(cwd, '__tests__'))) {
    result.structure.hasTests = true;
    result.features.push('Has dedicated test suite');
  }

  return result;
}

/**
 * Format the scan result into a concise string array for context insertion.
 */
export function formatScanToContext(scan: ScanResult): string[] {
  const ctx: string[] = [];

  // Tech stack
  const stack = [...scan.dependencies, ...scan.devDependencies];
  if (stack.length > 0) {
    ctx.push(`Detected Stack: ${stack.join(', ')}`);
  }

  // TypeScript rules
  if (scan.typescript.enabled) {
    let tsCtx = 'TypeScript Enabled';
    if (scan.typescript.strict) tsCtx += ' (Strict Mode)';
    if (scan.typescript.aliases.length > 0) tsCtx += ` | Aliases: ${scan.typescript.aliases.join(', ')}`;
    ctx.push(tsCtx);
  }

  // Linting
  if (scan.linting.length > 0) {
    ctx.push(`Linting: ${scan.linting.join(', ')}`);
  }

  // Structure
  if (scan.features.length > 0) {
    ctx.push(`Structure: ${scan.features.join(' | ')}`);
  }

  // Env
  if (scan.envVars.length > 0) {
    ctx.push(`Required Env Vars (.env.example): ${scan.envVars.join(', ')}`);
  }

  return ctx;
}

// Helper
async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
