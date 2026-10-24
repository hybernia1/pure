# Minifikace distribuce

Měřeno 24. 10. 2026 na kódu po commitu `ea751fb`. Build používá esbuild 0.28.2 pouze jako vývojovou závislost a transformuje každý JS/CSS soubor samostatně. Nepřidává bundler ani runtime knihovnu. Postup a importy: [distribuce](distribution.md).

## Velikosti

Bajty; JS zahrnuje celý statický importní graf daného vstupu, dynamické importy nezahrnuje. Gzip je součet komprese jednotlivých souborů přes Node zlib s výchozím nastavením. Source mapy nejsou zahrnuté, komentáře odkazující na mapy ano. Nejde o HTTP benchmark ani měření doby vykonávání.

| Vstup | Raw čitelný → min | Gzip čitelný → min | Úspora gzip |
| --- | ---: | ---: | ---: |
| lazy.js | 9 527 → 7 363 | 3 597 → 3 271 | 9,1 % |
| index.js | 208 292 → 137 934 | 68 358 → 60 412 | 11,6 % |
| editor.js | 82 587 → 53 030 | 24 665 → 21 535 | 12,7 % |
| search.js | 27 785 → 19 558 | 9 860 → 8 791 | 10,8 % |
| theme.js | 8 255 → 5 853 | 2 897 → 2 484 | 14,3 % |
| pure.css | 49 141 → 42 379 | 8 098 → 7 742 | 4,4 % |
| icons.svg | 4 309 → 4 309 | 1 205 → 1 205 | 0 % |

Minifikace pomáhá zejména JS: celý graf je bez komprese menší o 33,8 %, gzip uspoří přibližně 7,9 kB. U CSS už gzip většinu opakování odstranil, dodatečný přínos je pouze 356 B. SVG nyní neupravujeme; zůstávají bezpečně zachované veřejné symbol ID a currentColor.

Zachování názvů funkcí a samostatných modulů stojí část možné úspory, ale ponechává veřejné API a lazy hranice. Neprovádí se property mangling. Přínos pro síť a parsing je možný, tento audit však dokládá pouze velikosti a funkční shodu; neprokazuje rychlejší editaci ani INP.

## Opakování a kontrola

```sh
npm ci
npm test
npm run build
npm run check:dist
npm run audit:size -- --output docs/benchmarks/minification.json
npm run dev
```

Surový [report velikostí](benchmarks/minification.json). Check:dist kontroluje přesný obsah obou stromů, mapy, veřejné exporty a zachování názvu exportované funkce. Browserové sady se spouštějí proti stejným testům s parametrem `?min`: browser, lazy, data, tabs, navigation, editor-lists a themes. Lazy sada navíc kontroluje, že skutečné JS/CSS/sprite požadavky neopouštějí zvolenou distribuci. Při změně zdrojů se vždy znovu sestavují oba stromy.

Ověřeno: 42 Node testů a 68 browserových testů pro každou variantu (136 celkem v Chrome 156). Build a check:dist prošly; dva buildy daly stejný manifest 185 souborů `43f96102b8cc65e657c7a981cda8518e04e880bee7474e1d615f3029aee903ea`. `npm pack --dry-run --json --ignore-scripts` ověřil obsah balíčku včetně map; nic nebylo publikováno. Oba stromy s mapami zabírají v balíčku přibližně 1,26 MB před kompresí, 344 kB tarball. Tato velikost instalace není velikost načítaná stránkou.
