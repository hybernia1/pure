# Loader a progress bar

Ukázka: [moduly](../examples/modules.html#activity-title). Oba moduly jsou nezávislé na AJAXu a editoru. Nemají automatickou inicializaci ani runtime závislosti.

## Indikátor činnosti

```js
import { createActivity } from './dist/js/index.js';
const activity = createActivity(); // globálně, vpravo nahoře
const finish = activity.start('Ukládám…');
try { await save(); } finally { finish(); }

// Stejné chování s automatickým úklidem i při chybě:
const result = await activity.run(() => save(), 'Ukládám…');
activity.isActive();
activity.destroy();
```

Volby `createActivity({ target, global, label })`: výchozí `target` je `document.body`, `global` je true pro body a jinak false, výchozí text „Probíhá zpracování…“. Pro lokální použití předej kontejner. Indikátor se vloží jako nový prvek a zachová existující obsah. Globální varianta je neblokující pevný indikátor; nekrade focus ani nezakazuje ovládání stránky. Nad nativním dialogem použij lokální indikátor uvnitř dialogu.

Každé `start(text)` vrací vlastní idempotentní funkci pro ukončení. Souběžné činnosti se počítají samostatně; indikátor zůstane viditelný do dokončení poslední. Zobrazuje text poslední aktivní činnosti. `run(fn, text)` vrací výsledek funkce, chyby předává volajícímu a v `finally` ukončí pouze svou činnost. Operaci neruší; případný AbortController spravuje aplikace. `destroy()` odstraní UI; pozdější ukončovací callbacky bezpečně ignoruje.

CSS `activity.css`, tokeny `--p-spinner-size`, `--p-activity-z` a sdílené rozestupy. Pro samostatný statický spinner lze použít `<span class="spinner" aria-hidden="true"></span>` uvnitř kontejneru s `role="status"` a textem činnosti. Animace respektuje reduced motion.

## Progress bar

```js
import { createProgress } from './dist/js/index.js';
const progress = createProgress(document.querySelector('#progress'), {
  max: 100, value: 0, label: 'Nahrávání',
});
progress.set(45);
progress.set(null); // neurčitý průběh, bez aria-valuenow
progress.setState('info', 'Zpracování');
progress.set(100);
progress.setState('success', 'Hotovo');
// Při chybě: progress.setState('error', 'Soubor se nepodařilo nahrát');
progress.getValue(); // 100; nebo null při neurčitém průběhu
progress.setState(null); // obnoví neutrální stav a původní label
progress.destroy();
```

Výchozí hodnoty: `max: 100`, `value: 0`, `label: 'Průběh'`. Maximum musí být kladné konečné číslo. `set(value)` omezuje konečné číselné hodnoty na 0…max; `null` aktivuje neurčitý průběh. Hodnoty předává aplikace podle skutečného průběhu, modul je neodhaduje. Dosažení maxima automaticky nemění stav. `setState(state, message)` přijímá společné `error`, `success`, `info` nebo `null`; stav je vyjádřen i textem. Bez vlastní zprávy se použije „Chyba“, „Hotovo“ nebo „Probíhá zpracování“, pro `null` původní label.

UI má `role="progressbar"`, přístupný název a meze. Změna stavové zprávy se oznamuje přes `role="status"`. `destroy()` odstraní jen vytvořené UI a umožní opětovnou inicializaci. Na jeden kontejner patří jedna instance.

CSS `progress.css`, pro stavové barvy také `states.css`; výška používá `--p-progress-height`. Oba moduly jsou součástí `pure.css` a exportů `dist/js/index.js`. Light/dark dědí z tokenů, bez stínů.

`createLoader(target)` z AJAX modulu zůstává API pro načtení obsahu. Vizuální loader libovolné činnosti vytváří `createActivity()`.
