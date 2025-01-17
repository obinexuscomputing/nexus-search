import { existsSync } from 'fs';
import { resolve } from 'path';

const requiredFiles = [
  'dist/index.js',
  'dist/index.cjs',
  'dist/index.umd.js',
  'dist/index.d.ts'
];

const missing = requiredFiles.filter(file => !existsSync(resolve(process.cwd(), file)));

if (missing.length > 0) {
  console.error('Build verification failed. Missing files:', missing);
  process.exit(1);
} else {
  console.log('Build verification successful.');
}