# Audit před prvním vydáním — 23. 10. 2026

Výchozí stav: commit `ad2638c`. Audit zahrnuje zdroje CSS/JS/SVG, distribuci, npm obsah, lifecycle a zátěž vybraných funkcí. Níže uvedené opravy jsou implementované a ověřené. Veřejné vydání zatím není dokončené: zůstávají rozhodnutí o licenci, vydávané verzi a podporovaných prohlížečích. Nic se nepublikovalo ani netagovalo.

## Otevřené nálezy podle priority

| Priorita | Nález | Další krok |
| --- | --- | --- |
| P1 před veřejným vydáním | Chybí LICENSE i údaj license v package.json. | Vlastník zvolí licenci a doplní soubor a metadata. Audit licenci nevybírá. |
| P1 před veřejným vydáním | Balíček zůstává private: true a verze 0.6.1 je dosavadní pracovní označení. Oprávnění k npm scope nejsou ověřená. | Potvrdit cílové vydání, způsob distribuce a případně npm scope; až pak upravit private/verzi a vytvořit tag. |
| P1 pro deklarovanou podporu | UI bylo ověřené v dostupném Chrome. Chybí ověření Firefox/Safari a deklarace minimálních verzí. | Stanovit podporu a ověřit cílové prohlížeče. Dialog/Popover API, pointer capture a CSS vrstvy jsou požadavky implementace; polyfill se nedodává. |
| P2 pro velké dokumenty | Editor při vstupu normalizuje a vykreslí celý dokument, poté drží až 100 plných JSON snapshotů historie. Limit počtu snapshotů není limit bajtů. | Změřit latenci a paměť na cílovém zařízení a maximálním dokumentu. Při potřebě zavést limit historie v bajtech a postupné vykreslování; undo API se nyní neměnilo. |
| P2 pro lehké stránky | Browser import z index.js načítá celý graf 27 modulů. Samotná deklarace sideEffects to v prohlížeči neodstraní. | Používat přímé importy modulů. Root export je pohodlný pro celé aplikace; bundler aplikace může provést tree shaking. |

## Opraveno

| Oblast | Změna | Ověření |
| --- | --- | --- |
| Statistiky | Cache nejvýše 8 Intl.Segmenter instancí, průchod segmenty bez pole a filtru, jeden průchod bloky pro text a obrázky. | Node testy počtů, jazyků a fallbacku, mikrobenchmark. |
| Drag & drop | Jeden geometrický odečet na položku místo dvou, žádné přepisování markerů při nezměněném cíli; scrollovací předek jednou za gesto. | Testy pointeru, klávesnice, Escape, cancel a editorové historie. |
| Resize | Čtyři globální listenery až během gesta, odpojení při konci/cancel/destroy. | Test měří 0 listenerů v klidu, 4 během gesta a opět 0 po ukončení. |
| Reset | Validace a upload respektují preventDefault na resetu, obnovují UI po nativní změně hodnot a ruší časovače při destroy. | Nový test zrušeného a následně platného resetu; stávající reset/upload testy. |
| Build | Po kontrole cílové cesty se odstraní pouze dist. Zaniklé moduly se nepřenášejí do nové distribuce. | Zkušební zastaralý soubor odstraněn, přesná kontrola 46 souborů a shody se zdroji. |
| npm | Whitelist dist/docs/README, root i dílčí ESM/CSS/SVG exporty, CSS side effects. prepack sestaví a ověří dist. | Self-import root i theme subpath, npm pack --dry-run; zdroje, testy, dev server a .pure se nebalí. |
| Reprodukovatelnost | .gitattributes drží LF pro text a binární PNG. | Dva buildy stejného stromu daly totožný SHA-256 manifestu dist. |

## Velikosti

Neminifikovaná distribuce. Gzip JS je součet samostatně komprimovaných souborů všech statických závislostí vstupu. Nejde o HTTP měření ani bundle; neobsahuje režii požadavků a cache aplikace může výsledek změnit. Jednotky jsou bajty.

| Vstup | Soubory | Zdrojové bajty | Gzip bajty |
| --- | ---: | ---: | ---: |
| pure.css | 1 | 37 908 | 6 547 |
| icons.svg | 1 | 3 987 | 1 124 |
| js/index.js včetně závislostí | 27 | 146 735 | 48 979 |
| js/editor.js včetně závislostí | 13 | 100 534 | 32 181 |
| js/search.js včetně závislostí | 5 | 20 822 | 7 418 |
| js/theme.js | 1 | 1 539 | 707 |
| js/activity.js | 1 | 1 563 | 742 |

Výchozí JS root měl 145 589 B / 48 630 B gzip. Opravy přidaly 349 B gzip do součtu modulů a snížily práci za běhu. CSS se velikostí nezměnilo. Minifikátor ani bundler se nepřidávaly.

## Zátěž a rozsah důkazů

Node v24.15.0, jeden lokální stroj: 1 000 odstavců, 5 000 slov, 3 zahřívací průchody, medián z 15 měření editorStats. Před změnou 1,704 ms, po změně 1,228 ms; další měření po změně 1,102 ms. Orientační pokles přibližně 28 % v porovnaných bězích. Není to odezva celého editoru, profil paměti ani garance na mobilu. Časování není součástí pass/fail testů.

- 23 Node testů prošlo.
- 30 integračních testů v Chrome prošlo, včetně dvou nových regresí auditu.
- npm run prepack prošel (build a check:dist).
- npm pack --dry-run --json --ignore-scripts ověřil whitelist po samostatně provedeném prepack; tarball ani publish se nevytvářely.
- check:dist ověřil kopie zdrojů, vygenerované utility, obsah společného CSS, chybějící/přebývající soubory a exporty.
- Dva buildy daly manifest SHA-256 `74a70c5df011c6be0566f5b21c8668a7445dbccc1c946221ab40f7d5cb16ec5b`.

Audit nezahrnoval DevTools profil paměti, end-to-end zátěž velkého editoru, cross-browser CI ani CDN nasazení. Vývojový upload server je lokální příklad; autentizace, autorizace mediaId, úplné ověření obrázků a produkční ukládání zůstávají smlouvou hostitelské aplikace podle dokumentace médií.

## Opakování kontroly

```sh
npm test
npm run build
npm run check:dist
npm run audit:size
npm pack --dry-run --json --ignore-scripts
```

Otevři `/test/browser.html` přes `npm run dev` pro integrační testy. Velikosti a benchmark lze přeměřit; tabulka je snímek tohoto auditu.
