import { getPreloadUrls } from '../src/js/preload.js';

const args = process.argv.slice(2);
for (const arg of args) {
  if (arg.startsWith('--') && !['--readable', '--compact'].includes(arg) && !arg.startsWith('--base=')) {
    throw Error(`Unknown option: ${arg}`);
  }
}
const variant = args.includes('--readable') ? 'pure' : 'pure.min';
const compact = args.includes('--compact') ? '/compact' : '';
const names = args.filter(arg => !arg.startsWith('--'));
if (!names.length) throw Error('Usage: npm run preload -- --compact --base=/assets/pure/ editor modal tabs flash select');
const { preloadManifest } = await import(`../dist/${variant}${compact}/js/preload-manifest.js`);
const base = args.find(arg => arg.startsWith('--base='))?.slice(7) || '/assets/pure/';
if (!base.startsWith('/') && !/^https?:\/\//.test(base)) throw Error('Base must be root-relative or an absolute HTTP(S) URL.');
const origin = 'https://pure.invalid';
const baseUrl = new URL(base, origin).href;
const escape = text => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const rootRelative = base.startsWith('/') && !base.startsWith('//');
console.log(getPreloadUrls(names, { manifest: preloadManifest, baseUrl })
  .map(url => `<link rel="modulepreload" href="${escape(rootRelative ? url.slice(origin.length) : url)}">`)
  .join('\n'));
