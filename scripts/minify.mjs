import { transform } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

/** Preserve the module tree: imports and import.meta.url keep resolving locally. */
export async function minifiedFile(path, source) {
  if (!/\.(js|css)$/.test(path)) return { code: source };
  const js = path.endsWith('.js');
  const result = await transform(source.toString(), {
    loader: js ? 'js' : 'css', minify: true, sourcemap: false,
    legalComments: 'inline', charset: 'utf8',
    ...(js ? { format: 'esm', target: 'es2022', keepNames: true } : {}),
  });
  return { code: result.code };
}

export async function writeMinified(paths) {
  for (const path of paths) {
    const result = await minifiedFile(path, await readFile(`dist/pure/${path}`));
    await mkdir(dirname(`dist/pure.min/${path}`), { recursive: true });
    await writeFile(`dist/pure.min/${path}`, result.code);
  }
}
