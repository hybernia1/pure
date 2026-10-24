# JavaScript API

```js
import { initTheme, setTheme, initDisclosures } from '/dist/js/index.js';
const destroyTheme = initTheme();
const destroyDisclosures = initDisclosures();
// Při odpojení obrazovky:
// destroyTheme(); destroyDisclosures();
```

## Téma

Barvy zůstávají v CSS. [Vlastní palety a pojmenovaná schémata](themes.md) doplňují nezávislé `setScheme(name, options)` a konfiguraci `theme.scheme` / `theme.schemeStorageKey`. `initTheme()` obnoví obě volby a vedle přepínače podporuje i tlačítka `[data-theme-set]` a `[data-scheme-set]`.

`initTheme({ root, scope, storage } = {})` načte `pure-theme` z localStorage, použije platné téma nebo systém a připojí delegovaný click listener pro `[data-theme-toggle]`. Vrací cleanup. Výchozí root je `document.documentElement`, scope je `document`. Blokované úložiště nebrání ovládání tématu.

```html
<button class="button button-outline" data-theme-toggle type="button">
  Přepnout světlý / tmavý režim
</button>
```

`setTheme('light' | 'dark' | 'system', { root, storage } = {})` nastaví téma a uloží volbu. `system` odstraní atribut a vrátí řízení CSS. Neplatná hodnota vyhodí TypeError. Přepínač střídá light a dark podle aktuálního vzhledu; návrat k systému proveď přes `setTheme('system')`.

## Disclosure

`initDisclosures(scope = document)` připojí tlačítka `[data-disclosure]` k panelům podle `aria-controls`. Výchozí stav určuje `aria-expanded="true"`; jinak se panel zavře. Chybějící panel se přeskočí. Vrací cleanup posluchačů, který zachová aktuální stav panelů.

```html
<button type="button" data-disclosure aria-controls="details" aria-expanded="false">
  Podrobnosti
</button>
<div id="details" hidden>Obsah panelu</div>
```

Používej nativní button: Enter a mezerník fungují automaticky. Escape uvnitř otevřeného panelu jej zavře a vrátí focus na tlačítko. Jde o běžné rozbalení obsahu, nikoli ARIA menu; panel neuzamyká focus. Inicializátory nejsou idempotentní: při novém připojení nejprve proveď cleanup.

## Další samostatné moduly

`createFlash`, `createEditor`, `request`, `createLoader`, `HttpError` a `states` lze importovat z index.js i příslušných modulů. Úplné API a příklady: [stavy, editor a AJAX](modules.md).

Formulářové API: `createForm`, `initInputs`, `initPasswords`, `createPicker`, `initPickers`, `createSelect`, `initSelects`, `createModal`, `initModals`, `createUpload`, `validateFiles`. Úplné API, příklady a napojení FormData: [formuláře, modal a upload](forms.md). Vlastní datum, čas a select vyžadují explicitní inicializaci; bez ní zůstávají nativní.
