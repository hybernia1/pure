// Run the same assertions against either complete distribution graph.
export const distRoot = new URL(new URLSearchParams(location.search).has('min') ? '../dist/pure.min/' : '../dist/pure/', import.meta.url).href;
if (new URLSearchParams(location.search).has('min')) {
  document.title += ' (min)';
  await Promise.all([...document.querySelectorAll('link[rel="stylesheet"]')].map(link => {
    if (!link.href.includes('/dist/')) return;
    return new Promise((resolve, reject) => {
      link.onload = resolve; link.onerror = () => reject(new Error('Minified CSS failed to load'));
      link.href = `${distRoot}${new URL(link.href).pathname.split('/dist/pure/')[1]}`;
    });
  }));
}
