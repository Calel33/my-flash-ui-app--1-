import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * CONFIGURATION
 * Edit these sets to include/exclude specific patterns.
 */
const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.factory',
  'dist',
  'build',
  '.cache',
  '.vercel',
  'node_modules',
  '.cursor',
  '.zencoder',
  '.zenflow'
]);

const IGNORE_FILES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  '.DS_Store',
  'REPO_MAP.md'
]);

const OUTPUT_FILE = path.join(__dirname, '../../REPO_MAP.md');
const ROOT_DIR = path.join(__dirname, '../../');

function getDirectoryTree(dir, prefix = '', isLast = true) {
  const name = path.basename(dir);
  let result = prefix + (isLast ? '└── ' : '├── ') + name + '/\n';

  const newPrefix = prefix + (isLast ? '    ' : '│   ');

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
      .filter(entry => {
        if (entry.isDirectory()) return !IGNORE_DIRS.has(entry.name);
        return !IGNORE_FILES.has(entry.name);
      })
      .sort((a, b) => {
        // Folders first, then alphabetically
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const entryPath = path.join(dir, entry.name);
      const isLastEntry = i === entries.length - 1;

      if (entry.isDirectory()) {
        result += getDirectoryTree(entryPath, newPrefix, isLastEntry);
      } else {
        result += newPrefix + (isLastEntry ? '└── ' : '├── ') + entry.name + '\n';
      }
    }
  } catch (err) {
    result += newPrefix + '└── [Error reading directory]\n';
  }

  return result;
}

console.log('Generating Repository Map...');
const tree = getDirectoryTree(ROOT_DIR, '', true);

const markdown = `# Repository Map\n\nGenerated on: ${new Date().toLocaleString()}\n\n\`\`\`text\n${tree}\`\`\`\n`;

fs.writeFileSync(OUTPUT_FILE, markdown);
console.log(`Successfully generated map at: ${OUTPUT_FILE}`);
