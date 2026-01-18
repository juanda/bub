import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();
const dist = path.join(root, 'dist');

const filesToCopy = [
  'index.html',
  'style.css',
  'game.js',
  'manifest.json',
  'service-worker.js'
];

async function ensureCleanDist() {
  await fs.rm(dist, { recursive: true, force: true });
  await fs.mkdir(dist, { recursive: true });
}

async function copyFiles() {
  for (const file of filesToCopy) {
    await fs.copyFile(path.join(root, file), path.join(dist, file));
  }

  const iconsSrc = path.join(root, 'icons');
  const iconsDest = path.join(dist, 'icons');
  await fs.mkdir(iconsDest, { recursive: true });

  const icons = await fs.readdir(iconsSrc);
  for (const icon of icons) {
    await fs.copyFile(path.join(iconsSrc, icon), path.join(iconsDest, icon));
  }
}

async function build() {
  await ensureCleanDist();
  await copyFiles();
  console.log('Build complete: dist/');
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
