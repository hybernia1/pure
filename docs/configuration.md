# Globální konfigurace

`configurePure(patch)` nastavuje výchozí hodnoty pro nové komponenty. Import je samostatný, bez DOM efektů a bez načítání komponent:

```js
import { configurePure, getPureConfig } from '@pure-ui/core/config';
// Bez balíčku: ../dist/js/config.js

configurePure({
  locale: 'auto',
  iconsUrl: '/assets/pure/icons.svg',
  theme: { default: 'system', persist: true, storageKey: 'app-theme' },
  search: { delay: 250, minLength: 2, limit: 8 },
  upload: { maxSize: 5 * 1024 * 1024 },
  editor: { features: { headings: true, images: true } },
});
```

API je dostupné i z `@pure-ui/core/lazy` a hlavního exportu. Hlavní export staticky načítá všechny moduly; pro lehký start použij `config` nebo `lazy`.

## Priorita a životnost

Výchozí hodnoty Pure → globální nastavení → volby konkrétní instance. Vnořené objekty se slučují, `undefined` ponechá předchozí hodnotu. `null` vypne adaptér editoru. Opakované volání mění pouze dodané volby. Neznámé klíče a neplatné hodnoty vyhodí výjimku; chybný patch nezmění uloženou konfiguraci.

`configurePure()` i `getPureConfig()` vracejí oddělenou kopii konfigurace. Změny konfigurace neprovádějí přestavbu existujícího UI. Nastav ji při startu aplikace před vytvářením komponent a otevíráním jejich doplňků. Explicitní samostatné operace, například `setTheme()` a `ensureStyles()`, používají aktuální konfiguraci.

Konfigurace je sdílená v rámci jedné ESM instance. Na serveru ji neměň pro jednotlivé HTTP požadavky; uživatelské volby předávej konkrétní komponentě. Obsah editoru, hodnoty polí, DOM cíle a CSS tokeny nejsou součást konfigurace.

## Dostupné volby

| Volba | Výchozí hodnota | Použití |
| --- | --- | --- |
| `locale` | `'auto'` | Jazyk z `html lang`, bez něj `en`; lze přepsat podporovaným jazykovým tagem. |
| `messages` | `{}` | Plochý slovník textů. Vestavěné UI má cs/en; ostatní jazyky mají anglický fallback. Editor podporuje lokální `messages`. |
| `iconsUrl` | Sprite vedle distribučních souborů | Společná cesta ikon; editor a resize dál podporují lokální cestu. |
| `styles.auto` | `true` | Automatické CSS v lazy loaderu, editoru a knihovně médií. Lokální `styles` má přednost. |
| `styles.baseUrl` | Distribuční `css/` | Adresář jednotlivých stylů; relativní URL se vyhodnotí při konfiguraci proti dokumentu. |
| `theme.default` | `'system'` | Výchozí téma při `initTheme()`, pokud není uložená platná volba. |
| `theme.persist` | `true` | Čtení a zápis uloženého tématu. |
| `theme.storageKey` | `'pure-theme'` | Klíč úložiště. Tyto tři volby lze přepsat i lokálně v theme API. |
| `search.delay` / `minLength` / `limit` | `250` / `2` / `8` | Prodleva v ms, minimální délka dotazu a maximální počet návrhů. |
| `upload.accept` | `''` | Výchozí typy souborů; neprázdný atribut `accept` pole má přednost. |
| `upload.maxFiles` / `maxSize` | `Infinity` / `Infinity` | Počet a velikost v bajtech pro `createUpload()`. Jednoduchý input dovolí vždy nejvýše jeden soubor. |
| `editor.features` | `{headings:false, images:false, fullscreen:true, lists:true}` | Zapnutí funkcí editoru. |
| `editor.uploadImage` | `null` | Výchozí upload callback, stejný kontrakt jako u lokálního editoru. |
| `editor.mediaLibrary` | `null` | Výchozí objekt s adaptéry knihovny; lokální objekt se slučuje. |
| `mediaLibrary.pageSize` | `12` | Počet médií na stránku. |
| `flash.duration` | `0` | Doba zobrazení v ms; `0` znamená bez automatického zavření. |
| `modal.closeOnBackdrop` | `true` | Zavření přes pozadí. Editor si pro fullscreen vynucuje `false`. |
| `data.pageSize` | `20` | Výchozí počet záznamů na stránku pro datový controller, tabulky a seznamy. |
| `pagination.siblings` | `1` | Počet sousedních čísel stránek na každé straně, 0–10. |
| `tabs.activation` / `orientation` | `'auto'` / `'horizontal'` | Aktivace záložek (`auto`/`manual`) a směr (`horizontal`/`vertical`). |
| `navigation.match` / `closeOnSelect` | `'path'` / `true` | Shoda aktivní URL (`path`/`exact`) a zavření po výběru odkazu. |

Obrázkové uploady editoru a media library zachovávají podporované obrazové typy a jeden soubor. Používají globální `upload.maxSize`; při výchozím `Infinity` ponechávají původní limit 10 MiB. Samostatné `validateFiles()` zůstává čistou funkcí s explicitními limity.

## Lokální přepsání a adaptéry

```js
configurePure({
  editor: {
    uploadImage: async (file, { signal }) => {
      const response = await fetch('/api/media', { method: 'POST', body: file, signal });
      if (!response.ok) throw new Error('Upload failed');
      return response.json(); // { id, src }
    },
    mediaLibrary: { load: async ({ query, page, pageSize, signal }) => { /* vlastní API */ } },
  },
});

const { createEditor } = await loadComponent('editor');
const editor = createEditor(textarea, {
  locale: 'cs',
  features: { images: false },
  mediaLibrary: null,
});
await editor.ready;
```

Nastavení cesty k CSS mění pouze styly; JS moduly se dál načítají relativně k distribučnímu ESM entry. `styles.auto:false` nezakazuje explicitní `ensureStyles()`. Ručně připojený celý bundle loader nadále rozpozná. Paddingy, barvy a rozměry nastavuj pomocí CSS tokenů.

Funkční ukázka: [načítání a konfigurace](../examples/lazy.html). Testy: `npm test` a `test/browser.html`.
