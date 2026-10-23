import { mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { utilities } from './utilities.mjs';

const names = ['tokens', 'base', 'components', 'states', 'flash', 'editor', 'forms', 'controls', 'modal', 'upload', 'resize', 'activity', 'progress', 'search', 'drag-drop', 'media-library'];
const parts = await Promise.all(names.map((name) => readFile(`src/css/${name}.css`, 'utf8')));
const output = resolve('dist');
if (dirname(output) !== resolve('.') || output === resolve('.')) throw new Error('Invalid build output path');
await rm(output, { recursive: true, force: true });
await mkdir('dist/css', { recursive: true });
await mkdir('dist/js', { recursive: true });
for (let i = 0; i < names.length; i++) await writeFile(`dist/css/${names[i]}.css`, parts[i]);
const generated = utilities();
await writeFile('dist/css/utilities.css', generated);
await writeFile('dist/pure.css', [...parts, generated].join('\n'));
await cp('src/js', 'dist/js', { recursive: true });
await cp('src/icons.svg', 'dist/icons.svg');
console.log('Pure sestaveno → dist/');
