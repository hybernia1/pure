import { transform } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, relative, basename } from 'node:path';

/** Preserve the module tree: imports and import.meta.url keep resolving locally. */
export async function minifiedFile(path, source) {
  if (!/\.(js|css)$/.test(path)) return { code: source };
  const js = path.endsWith('.js');
  const result = await transform(source.toString(), {
    loader: js ? 'js' : 'css', minify: true, sourcemap: 'external',
    sourcefile: relative(dirname(`dist/min/${path}`), `dist/${path}`).replaceAll('\\', '/'),
    sourcesContent: true, legalComments: 'inline', charset: 'utf8',
    ...(js ? { format: 'esm', target: 'es2022', keepNames: true } : {}),
  });
  const link = js ? `//# sourceMappingURL=${basename(path)}.map\n` : `/*# sourceMappingURL=${basename(path)}.map */\n`;
  return { code: result.code + link, map: result.map };
}

export async function writeMinified(paths) {
  for (const path of paths) {
    const result = await minifiedFile(path, await readFile(`dist/${path}`));
    await mkdir(dirname(`dist/min/${path}`), { recursive: true });
    await writeFile(`dist/min/${path}`, result.code);
    if (result.map) await writeFile(`dist/min/${path}.map`, result.map);
  }
}
