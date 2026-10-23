# Změna velikosti

Volitelný `help` přepíše text nápovědy úchytu; editor jej používá pro překlad podle locale.

`createResize` je samostatný modul bez závislosti na editoru. Mění šířku obalu v procentech kontejneru; obrázek uvnitř zachovává poměr stran. Nezmenšuje soubor ani jeho rozlišení.

```js
import { createResize } from './dist/js/index.js';
const resize = createResize(document.querySelector('#photo'), {
  width: 50, min: 25, max: 100, step: 5,
  onChange: width => console.log('Náhled', width),
  onCommit: width => console.log('Uložit', width),
});
resize.smaller();
resize.larger();
resize.setWidth(75);
resize.getWidth(); // 75
resize.destroy();
```

Použij obal jako `<figure id="photo"><img src="photo.jpg" alt="Popis"></figure>`, nikoli přímo `img`. CSS: `tokens`, `base`, `components`, `resize` (nebo celé `pure.css`). Úchyt používá ikonu `resize` z `icons.svg`.

Volby: `container` (výchozí rodič), `width` (100), `min` (10), `max` (100), `step` (1), `label` („Šířka“), `iconsUrl`, `onChange`, `onCommit`. Číselné hodnoty jsou procenta, `0 < min ≤ max ≤ 100`, krok je kladný. Krok se počítá od `min`; hodnoty se zaokrouhlí a omezí mezemi. Kontejner musí mít šířku nezávislou na měněném prvku. Uvnitř obalu musí být možné vložit úchyt.

Úchyt funguje myší, dotykem a klávesnicí. Šipky mění šířku o krok, Home/End nastaví minimum/maximum. Escape, ztráta focusu okna nebo zrušení pointeru vrátí probíhající tažení. `onChange` oznamuje změny náhledu včetně vrácení při zrušení. `onCommit` běží jednou za dokončené tažení nebo změnu přes klávesnici/API, jen pokud se šířka změnila. Inicializace callbacky nevolá.

`destroy()` odpojí události, odstraní úchyt a obnoví původní inline šířku, bez callbacků. Jednomu prvku náleží jedna instance. Inicializace je explicitní.

Ukázka mimo editor: [examples/modules.html](../examples/modules.html#resize-title). Editor používá tentýž modul s krokem 25 % a ukládá pouze dokončenou změnu do JSON a historie.
