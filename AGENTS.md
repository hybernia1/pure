# Pure — pravidla práce

- Pure je malý CSS, JS a SVG framework bez runtime závislostí. Drž KISS.
- Zdrojové soubory patří do `src/`; `dist/` vzniká příkazem `npm run build`.
- CSS vrstvy: tokens → base → components → utilities. Komponenty a JS jsou volitelné.
- Pouze dva viewporty: mobile (výchozí) a desktop od 960 px (`dt:`). Breakpoint měň pouze spolu s dokumentací a generátorem.
- Používej neutrální paletu a sémantické tokeny. Podporuj light i dark bez duplikace komponent.
- Utility mají jeden účel. Novou abstrakci přidej až pro skutečně opakovaný vzor.
- Rozestupy čerpají z `--p-space-*` nebo sémantických tokenů; žádné lokální číselné paddingy. Výchozí layout drž kompaktní. Nepoužívej box-shadow.
- Informační stavy jsou `error`, `success`, `info`, sdílené přes `data-state`. Stav vyjádři i textem, nejen barvou.
- Editor ukládá výhradně verzovaný JSON s textovými bloky a obrázky; nepřidávej HTML import/export ani HTML string renderování. Nadpisy/obrázky jsou volitelné funkce; odkazy a obrázky používají Pure modaly. Nahrávání vrací trvalou URL, nikdy neukládej blob/data URL. UI používá bezpečné DOM uzly a ikony z icons.svg.
- Modal obrázku nabízí klasický file upload s náhledem, nikoli zadávání URL. Adresa obrázku zůstává pouze datem modelu a výsledkem upload callbacku.
- Editor přebírá jazyk z html lang, podporuje locale/messages a slovníky cs/en. Nové UI texty patří do editor-i18n.js. Obrázky zachovávají mediaId (u starých dat null); upload a media library jsou nezávislé callbacky aplikace. Patička počítá jen model, nikdy řídicí texty DOM.
- AJAX načítá standardně text; jeho explicitní HTML režim prochází allowlistem. Server musí obsah znovu validovat.
- JS exportuje explicitní inicializaci, bez automatických globálních vedlejších efektů. Inicializace vrací cleanup.
- Ikony přidávej jako `symbol` do `src/icons.svg`, s `viewBox="0 0 24 24"`, `currentColor` a bez pevných barev.
- Zachovej ovládání klávesnicí, viditelný focus, reduced motion a přístupné názvy ovládacích prvků.
- Formulářové ikony a akce patří dovnitř jednotného `.control`. Datum, čas a select mají vlastní UI modulů picker/select nad původními poli; hodnoty, validita a FormData zůstávají v původních prvcích. Chybový focus směruj na jejich viditelné ovládání.
- Každé veřejné API zdokumentuj česky v `docs/` a ukaž v `examples/`.
- Před dokončením spusť `npm test` a `npm run build`. Nevnášej bundler ani závislost bez konkrétní potřeby.
