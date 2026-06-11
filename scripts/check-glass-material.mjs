import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const roots = ['app', 'components'];
const extensions = new Set(['.ts', '.tsx', '.css']);
const allowedLegacyFiles = new Set([
  'app/ClientLayout.tsx',
  'app/admin/components/ArticleEditor.tsx',
  'app/admin/components/ProjectEditor.tsx',
  'app/liquid-glass.css',
  'app/globals.css',
]);

const offenders = [];

const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
      continue;
    }

    const ext = fullPath.slice(fullPath.lastIndexOf('.'));
    if (!extensions.has(ext)) continue;

    const relPath = relative(process.cwd(), fullPath).replaceAll('\\', '/');
    const text = readFileSync(fullPath, 'utf8');
    const lines = text.split(/\r?\n/);

    lines.forEach((line, index) => {
      if (!line.includes('backdrop-blur')) return;
      if (allowedLegacyFiles.has(relPath)) return;
      offenders.push(`${relPath}:${index + 1}: ${line.trim()}`);
    });
  }
};

roots.forEach((root) => walk(join(process.cwd(), root)));

if (offenders.length > 0) {
  console.error('Found new backdrop-blur usage outside the liquid glass system.');
  console.error('Use <LiquidGlass> or a glass-card/glass-panel/glass-popover class instead.');
  console.error(offenders.join('\n'));
  process.exit(1);
}

console.log('Liquid glass material check passed.');
