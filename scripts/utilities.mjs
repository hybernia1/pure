export const breakpoint = 960;

export function utilities() {
  const rules = {
    block: 'display:block', flex: 'display:flex', 'inline-flex': 'display:inline-flex', grid: 'display:grid', hidden: 'display:none',
    static: 'position:static', relative: 'position:relative', sticky: 'position:sticky',
    'z-auto': 'z-index:auto', 'z-sticky': 'z-index:var(--p-sticky-z)',
    'flex-col': 'flex-direction:column', 'flex-row': 'flex-direction:row', 'flex-wrap': 'flex-wrap:wrap', 'flex-1': 'flex:1 1 0%',
    'items-center': 'align-items:center', 'items-start': 'align-items:flex-start', 'justify-between': 'justify-content:space-between', 'justify-center': 'justify-content:center',
    'w-full': 'width:100%', 'min-w-0': 'min-width:0', 'mx-auto': 'margin-inline:auto',
    'text-left': 'text-align:left', 'text-center': 'text-align:center', 'font-medium': 'font-weight:500', 'font-semibold': 'font-weight:600',
    'text-xs': 'font-size:.75rem', 'text-sm': 'font-size:.875rem', 'text-base': 'font-size:1rem', 'text-lg': 'font-size:1.125rem',
    'text-xl': 'font-size:1.5rem', 'text-2xl': 'font-size:2rem', 'text-3xl': 'font-size:3rem', 'text-4xl': 'font-size:4.5rem',
    'text-subtle': 'color:var(--p-subtle)', 'text-default': 'color:var(--p-text)',
    'bg-surface': 'background:var(--p-surface)', 'bg-muted': 'background:var(--p-muted)', 'bg-default': 'background:var(--p-bg)',
    border: 'border:1px solid var(--p-border)', 'border-b': 'border-bottom:1px solid var(--p-border)',
    rounded: 'border-radius:var(--p-radius)', 'rounded-full': 'border-radius:999px',
    'leading-tight': 'line-height:1.1', 'no-underline': 'text-decoration:none',
  };
  const scale = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24];
  const spacing = { p: 'padding', px: 'padding-inline', py: 'padding-block', pt: 'padding-top', pb: 'padding-bottom', m: 'margin', mx: 'margin-inline', my: 'margin-block', mt: 'margin-top', mb: 'margin-bottom', gap: 'gap' };
  for (const [prefix, property] of Object.entries(spacing)) {
    for (const step of scale) rules[`${prefix}-${step}`] = `${property}:var(--p-space-${step})`;
  }
  for (const step of scale) {
    rules[`top-${step}`] = `inset-block-start:var(--p-space-${step})`;
    rules[`bottom-${step}`] = `inset-block-end:var(--p-space-${step})`;
  }
  for (let count = 1; count <= 4; count++) rules[`grid-cols-${count}`] = `grid-template-columns:repeat(${count},minmax(0,1fr))`;
  const render = (prefix = '') => Object.entries(rules).map(([name, value]) => `  .${prefix}${name} { ${value}; }`).join('\n');
  return `@layer utilities {\n${render()}\n  @media (min-width: ${breakpoint}px) {\n${render('dt\\:')}\n  }\n}\n`;
}
