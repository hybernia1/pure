# Navigace

Jedna sada odkazů pro mobile i desktop. Nativní `nav`, seznamy, odkazy a `details/summary` podnabídky. Bez JavaScriptu jsou odkazy viditelné a podnabídky fungují nativně; JS přidává mobilní sbalení, řízení focusu a aktivní URL. Žádná role `menu` ani vlastní router.

[Živá ukázka](../examples/navigation.html) · [Testy](../test/navigation.html)

```html
<nav class="navigation" data-navigation aria-label="Hlavní navigace">
  <a class="navigation-brand" href="/">Pure</a>
  <button type="button" class="button button-outline navigation-toggle"
    data-nav-toggle aria-controls="main-links" hidden>
    <svg class="icon" aria-hidden="true"><use href="/assets/pure/icons.svg#menu"></use></svg>
  </button>
  <div class="navigation-panel" data-nav-panel id="main-links">
    <ul class="navigation-list">
      <li><a href="/">Přehled</a></li>
      <li>
        <details data-nav-dropdown>
          <summary>Projekt <svg class="icon" aria-hidden="true"><use href="/assets/pure/icons.svg#chevron-down"></use></svg></summary>
          <ul class="navigation-submenu">
            <li><a href="/members">Členové</a></li>
            <li><a href="/settings">Nastavení</a></li>
          </ul>
        </details>
      </li>
    </ul>
  </div>
</nav>
```

```js
import { loadComponent } from '@pure-ui/core/lazy';
const { createNavigation } = await loadComponent('navigation');
const navigation = createNavigation(document.querySelector('[data-navigation]'));
```

Při přímém importu `@pure-ui/core/js/navigation.js` připoj `css/navigation.css` se závislostmi tokens → base → components, nebo celý `pure.css`. Lazy loader nenačítá modal, formulářové widgety ani editor. SVG markup je součástí HTML aplikace; cestu k ikonám může sestavit z `getPureConfig().iconsUrl`.

## Struktura a chování

Kořen musí být `nav[data-navigation]`. Vyžaduje právě jedno vlastní tlačítko `data-nav-toggle` a jeden panel `data-nav-panel`. Panel musí mít unikátní ID a tlačítko odpovídající `aria-controls`. Tlačítko leží mimo panel. Jednotlivé instance mají samostatný stav; jejich selektory ignorují případné další kořeny navigace.

Tlačítko má v HTML `hidden`, panel žádný `hidden`. Bez JS tak není nefunkční mobilní přepínač a odkazy zůstávají dosažitelné. Vlastní skrývací utility na panel nedávej — viditelnost řídí modul.

Podnabídka je `details[data-nav-dropdown]` uvnitř panelu, jehož první element je `summary`. Obsah používá `.navigation-submenu`. JS otevře nejvýše jednu sousední podnabídku, zachová případné otevřené předky. Neotevírá podnabídky při hoveru. Na desktopu koriguje přesah jejich obalu proti okrajům viewportu, při změně šířky pozici přepočítá.

Pod 960 px tlačítko rozbaluje panel pod značkou. Od 960 px je panel vždy viditelný a tlačítko skryté. Při přechodu přes breakpoint se stav mobilního menu i podnabídek zavře; focus se přesune pouze tehdy, pokud by se aktuální prvek skryl.

Navigace není modální: neblokuje scroll stránky a nepoužívá focus trap. Tab prochází odkazy, Enter/mezerník nativně přepíná summary. Escape zavře nejbližší otevřenou podnabídku a vrátí focus na summary. Další Escape zavře mobilní panel a vrátí focus na přepínač. Klik mimo nebo odchod focusu mimo navigaci ji zavře. Odchod focusu nekrade focus cílovému prvku.

## Volby a metody

`createNavigation(root, options = {})` vrací controller:

| Volba | Výchozí hodnota | Význam |
| --- | --- | --- |
| `active` | Aktuální URL dokumentu | Počáteční URL pro označení odkazu; `null` označení vymaže. |
| `match` | `'path'` | Shoda podle origin + pathname, s rozlišením hash sekcí; nebo `'exact'` pro úplnou URL včetně query a hashe. |
| `closeOnSelect` | `true` | Po běžném kliknutí na odkaz zavře podnabídky i mobilní panel. |
| `locale`, `messages` | Globální nastavení | Překlady přepínače: `openNavigation`, `closeNavigation`. Vlastní `aria-label` tlačítka má přednost. |

Aktivní je nejvýše jeden odkaz uvnitř panelu. Značka mimo panel se neoznačuje. Pokud odpovídá odkaz na stránku i konkrétní sekci, sekce má přednost. Stránka dostává `aria-current="page"`, sekce `aria-current="location"`; rodič podnabídky `data-nav-active`. Query se při režimu path ignoruje, trailing slash se nenormalizuje. Externí odkazy a download odkazy se neoznačují.

| Metoda | Chování |
| --- | --- |
| `open()` | Rozbalí mobilní panel; na desktopu zůstává panel standardně viditelný. Vrací mobilní stav boolean. |
| `close({ focus = false } = {})` | Sbalí mobilní panel a zavře podnabídky. Focus uvnitř skrývaného panelu přesune na přepínač. |
| `toggle()` | Přepne mobilní stav. |
| `isOpen()` | Vrací, zda je mobilní panel rozbalený; na desktopu `false`. |
| `setActive(url = document.location.href)` | Nastaví aktivní URL; vrací nalezený odkaz nebo `null`. |
| `refresh()` | Obnoví viditelnost a přepočítá označení podle poslední nastavené URL. |
| `destroy()` | Odpojí listenery a obnoví původní atributy, viditelnost a otevření details. Opakované volání je bezpečné. |

`initNavigations(scope = document, options = {})` explicitně inicializuje kořeny ve scope, případně samotný scope, a vrací cleanup funkci. Při chybě uklidí instance vytvořené během tohoto volání. Duplicitní inicializace stejného kořene se odmítne. Strukturu navigace měň až po destroy a následné nové inicializaci; změnu href stávajícího odkazu lze převzít přes refresh.

## Router a události

Navigace nikdy nevolá `preventDefault()` na odkazech. Ctrl/Cmd/Shift/Alt klik, download a odkazy s jiným cílovým oknem ponechává otevřené. Běžné odkazy mohou fungovat bez routeru nebo být obsloužené aplikací.

`hashchange` a `popstate` automaticky aktualizují aktivní položku. `history.pushState()` samo událost nevyvolává; router po změně adresy zavolá `navigation.setActive()`.

Na kořeni bublá `pure:navigation-change` s `{ open }` při programovém nebo uživatelském rozbalení/sbalení mobilního panelu. Přepnutí viewportu pouze obnovuje layout. U vnořených navigací filtruj `event.target`.

```js
configurePure({ navigation: { match: 'path', closeOnSelect: true } });
// Po navigaci SPA:
navigation.setActive(window.location.href);
```

Rozestupy používají společné control/space tokeny. `--p-navigation-width` určuje požadovanou šířku podnabídky (14rem), `--p-navigation-z` její vrstvu (20). Žádné stíny, jen neutrální povrch a ohraničení. UI podporuje light/dark přes stejné tokeny.
