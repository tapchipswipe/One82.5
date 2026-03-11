import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const distDir = join(root, 'dist');
const nextIndex = join(root, '.next', 'server', 'app', 'index.html');
const nextStatic = join(root, '.next', 'static');
const publicDir = join(root, 'public');

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

if (!existsSync(nextIndex)) {
  throw new Error('Missing .next/server/app/index.html. Run next build first.');
}
if (!existsSync(nextStatic)) {
  throw new Error('Missing .next/static. Run next build first.');
}

cpSync(nextIndex, join(distDir, 'index.html'));
mkdirSync(join(distDir, '_next'), { recursive: true });
cpSync(nextStatic, join(distDir, '_next', 'static'), { recursive: true });

if (existsSync(publicDir)) {
  cpSync(publicDir, distDir, { recursive: true });
}

console.log('Prepared dist/ from Next build output.');
