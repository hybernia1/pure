import { readdir, readFile, access } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';

const root = resolve('.');
const paths = ['README.md', 'AGENTS.md', 'CONTRIBUTING.md', 'CHANGELOG.md', ...(await readdir('docs', { recursive: true })).filter(name => name.endsWith('.md')).map(name => `docs/${name}`)];
let links = 0;
for (const path of paths) {
  const text = (await readFile(path, 'utf8')).replace(/```[^\n]*\n[\s\S]*?```/g, '');
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const href = match[1];
    if (/^(?:[a-z]+:|\/\/)/i.test(href)) continue;
    const [file, anchor] = href.split('#');
    const target = resolve(dirname(path), decodeURIComponent(file || path.split('/').at(-1)));
    if (relative(root, target).startsWith('..')) throw new Error(`Link outside repository: ${path}: ${href}`);
    try { await access(target); } catch { throw new Error(`Missing link target: ${path}: ${href}`); }
    if (anchor && target.endsWith('.md')) {
      const contents = await readFile(target, 'utf8');
      const headings = [...contents.matchAll(/^#{1,6}\s+(.+)$/gm)].map(heading => heading[1].toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s/g, '-'));
      if (!headings.includes(decodeURIComponent(anchor))) throw new Error(`Missing heading: ${path}: ${href}`);
    }
    links++;
  }
}
console.log(`Documentation checked: ${paths.length} files, ${links} local links.`);
