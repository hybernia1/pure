# Výkon a kontrola před 1.0.0

Měřeno 24. 10. 2026. Výchozí stav je commit `784e4e5`, finální stav jsou navazující optimalizace pracovního stromu. Předchozí [audit](release-audit.md) zůstává historickým záznamem.

## Metoda

Windows x64, Intel Core i5-12500H, Node v24.15.0, Chrome 156, viewport 1920 × 911, bez omezení CPU nebo sítě. Prohlížeč měří synchronní JS a DOM s již načtenými moduly a CSS: dvě zahřívací operace, poté 15 vzorků; p95 je maximum těchto 15 vzorků. Inicializace a destroy jsou jednotlivé orientační vzorky. Mezi scénáři čekáme na dva snímky s časovým fallbackem pro neaktivní kartu.

Nejde o měření vykresleného snímku, INP, LCP, studeného načtení ani skutečného mobilního zařízení. Časové hodnoty nejsou pass/fail testy. Psaní používá řízený beforeinput na začátku dokumentu, další pozice mohou být dražší kvůli výpočtu výběru.

Node měří normalizaci, vložení, formátování a statistiky: 10 zahřívacích operací, 31 dávek po 10 operacích. Jeho dokumenty mají dva textové běhy na řádek; browser jeden. Výsledky těchto dvou prostředí se nesrovnávají přímo.

Reprodukce ze zdrojového checkoutu:

```sh
npm test
npm run build
npm run check:dist
npm run audit:size
npm run bench -- --output docs/benchmarks/local-node.json
npm run dev
```

Poté otevři `/test/performance.html`; JSON je přímo na stránce. Měření pouštěj bez souběžných zátěžových testů na stejném stroji. Surové výsledky: [Node před](benchmarks/baseline-node.json), [Node po](benchmarks/final-node.json), [Chrome před](benchmarks/baseline-browser.json), [Chrome po](benchmarks/final-browser.json).

## Nález a změna

Editor při každém znaku vytvářel celý obsah včetně záhlaví bloků a obrázků. Řízené textové změny nyní zachovávají strukturu, sousední uzly a resize instance a nahrazují jen změněné textové běhy. Změna typu/počtu bloků, struktury seznamu, obrázků, nativní input, setJSON a historie mají dál úplné vykreslení. Žádné nové závislosti ani veřejné nastavení.

Toolbar neprochází odkazy při sbaleném výběru a neopakuje aktualizaci pro nezměněný výběr. Normalizace položek seznamu sdílí validaci běhů s odstavci; nevytváří pro každou položku rekurzivní pomocný dokument. Validace a izolace JSON zůstávají zachované.

## Výsledky prohlížeče

Časy v ms, medián / p95:

| Scénář | Před | Po |
| --- | ---: | ---: |
| Psaní, 100 odstavců | 18,6 / 20,1 | 3,0 / 4,0 |
| Psaní, 1 000 odstavců | 167,2 / 201,8 | 19,1 / 23,8 |
| Psaní, seznam 1 000 položek | 73,5 / 86,6 | 12,0 / 17,7 |
| 100 stejných selectionchange, 1 000 odstavců | 257,4 / 286,3 | 166,9 / 176,8 |
| Reload tabulky, 100 řádků | 13,2 / 17,0 | 13,4 / 21,3 |
| Reload seznamu, 100 řádků | 3,1 / 6,3 | 2,7 / 5,2 |

Psaní zrychlilo přibližně 8,8× u 1 000 odstavců a 6,1× u seznamu. Opakovaný kontrolní běh po změně dal 18,3 a 11,6 ms. U tabulek a datových seznamů nebyla provedena optimalizace; rozdíly jsou běžná variabilita běhů. Výsledný JSON byl ověřen ve všech třech editorových scénářích, fixture po destroy měla nula uzlů; toto není důkaz absence heap leaků.

Node normalizace seznamu 1 000 položek klesla z 0,5508 na 0,4603 ms. Ostatní malé časové rozdíly neinterpretujeme jako prokázané zrychlení. Hlavní přínos je v DOM editoru.

## Distribuce

Velikosti v bajtech; gzip je součet zvlášť komprimovaných souborů statického importního grafu, nikoli HTTP přenos. Dynamické doplňky a CSS nejsou součástí JS grafu.

| Vstup | Soubory | Raw | Gzip |
| --- | ---: | ---: | ---: |
| lazy.js | 3 | 9 527 | 3 597 |
| index.js (všechny statické komponenty) | 38 | 208 292 | 68 358 |
| editor.js | 9 | 82 587 | 24 665 |
| search.js | 5 | 27 785 | 9 860 |
| pure.css | 1 | 49 141 | 8 098 |
| icons.svg | 1 | 4 309 | 1 205 |

Optimalizace přidala do editorového grafu 362 B gzip. Lazy vstup a ostatní vstupy se nezvětšily. Test skutečných browserových resources potvrdil, že search nestahuje editor a základ editoru nestahuje obrázkové doplňky, modal ani knihovnu před použitím.

## Ověření

- 42 Node testů prošlo.
- 67 browserových testů v Chrome: obecné 32, lazy 7, data 6, tabs 6, navigation 5, seznamy/média 8, schémata 3.
- Nová regrese ověřuje stabilitu sousedních uzlů a obrázku při psaní, pending bold, undo/redo a úplný render při změně počtu položek.
- Build a check:dist prošly; dva buildy daly stejný manifest 62 souborů: `55213474f1dfd839947b6310a6bd2dfdfef26a77f893d4d28ffb01b650b0ab08`.
- npm pack --dry-run --json --ignore-scripts prošel; nic se nepublikovalo. Verze a private zůstávají beze změny do samotného release.

## Zbývající omezení vydání

Psaní do 1 000 odstavců stále překračuje rozpočet 16,7 ms pro 60 fps; strukturální změny vytvářejí celý DOM. Model, statistiky, serializace a čtení výběru zůstávají úměrné délce dokumentu. Historie má nejvýše 100 úplných JSON snímků, bez byte limitu; velké dokumenty proto vyžadují další paměť. Virtualizace ani inkrementální historie nejsou součástí této úpravy.

Před veřejným vydáním je stále potřeba zvolit licenci, potvrdit npm scope a způsob publikace (package je private, verze 0.6.1) a dokončit podporovanou browserovou matici včetně Firefox/Safari a reálného mobilu. Tyto body nejsou ověřené tímto Chrome auditem. Balíček nebyl označen tagem ani publikován jako 1.0.0.
