# Záložkový obsah

Jeden modul pro stránku, kartu i modal. Obsah jsou běžné HTML panely: přepnutí je pouze skryje, nepřestavuje je a nemaže hodnoty formulářů. Bez JS zůstávají všechny panely dostupné pod sebou.

[Živá ukázka](../examples/tabs.html) · [Testy v prohlížeči](../test/tabs.html)

```html
<div class="tabs" data-tabs id="profile-tabs">
  <div class="tabs-list" data-tab-list aria-label="Profil">
    <button type="button" data-tab="overview">Přehled</button>
    <button type="button" data-tab="settings">Nastavení</button>
  </div>
  <div class="tabs-panel" data-tab-panel="overview">Obsah přehledu…</div>
  <div class="tabs-panel" data-tab-panel="settings">Nastavení…</div>
</div>
```

```js
import { loadComponent } from '@pure-ui/core/lazy';
const { createTabs } = await loadComponent('tabs');
const tabs = createTabs(document.querySelector('#profile-tabs'));
tabs.select('settings');
```

Při přímém importu `@pure-ui/core/js/tabs.js` připoj `css/tabs.css` se závislostmi tokens → base → components, nebo celý `pure.css`. `loadComponent('tabs')` načte pouze záložkový modul, jeho konfiguraci a potřebné CSS; modal ani editor se nestahují.

## API

`createTabs(root, options = {})` vyžaduje kořen s `data-tabs`, jeden vlastní `data-tab-list` a neprázdné unikátní páry klíčů `data-tab` / `data-tab-panel`. Záložky jsou přímé potomky seznamu a musí být tlačítka. Vlastní panely se nesmějí vzájemně obsahovat; vnořené záložky patří do dalšího kořene `data-tabs`.

| Volba | Výchozí hodnota | Význam |
| --- | --- | --- |
| `active` | Vybraná záložka v HTML, jinak první dostupná | Klíč počátečního panelu. Explicitní neplatný nebo zakázaný klíč vyhodí výjimku. |
| `activation` | `'auto'` | `'auto'`: šipka aktivuje panel. `'manual'`: šipka přesune focus, Enter/mezerník aktivuje panel. |
| `orientation` | `'horizontal'` | Směr klávesnice a vzhledu; podporuje také `'vertical'`. |
| `onChange(detail)` | Prázdný callback | Volá se při skutečné změně panelu, nikoli při inicializaci nebo opakované aktivaci. |

`activation` a `orientation` přebírají globální výchozí hodnoty:

```js
configurePure({ tabs: { activation: 'manual', orientation: 'horizontal' } });
```

| Metoda | Chování |
| --- | --- |
| `select(key, { focus = false })` | Aktivuje panel, vrací `true`; neznámá nebo zakázaná záložka vrací `false`. |
| `getActive()` | Aktivní klíč, případně `null`, pokud byly všechny záložky zakázány. |
| `refresh()` | Po změně `disabled` / `aria-disabled` zvolí dostupnou záložku. Pokud není žádná dostupná, skryje všechny panely a vrátí `false`. |
| `destroy()` | Odpojí listenery a obnoví původní atributy, ID i viditelnost panelů. Obsah a hodnoty polí zachová. |

Struktura záložek je při inicializaci pevná. Pro přidávání/odebírání tlačítek nebo panelů použij `destroy()`, uprav HTML a inicializuj znovu. Po `destroy()` změnové metody vyhodí výjimku; opakované `destroy()` je bezpečné. Druhá inicializace stejného kořene bez cleanup se odmítne.

`initTabs(scope = document, options = {})` explicitně inicializuje všechny kořeny ve scope, včetně samotného scope, pokud má `data-tabs`; vrací cleanup funkci. Pokud některý kořen neprojde validací, již vytvořené instance z tohoto volání se uklidí. Nejde o automatický scan při importu.

## Klávesnice a přístupnost

- Levá/pravá šipka ovládá horizontální seznam, horní/dolní vertikální. Horizontální směr respektuje RTL.
- Home / End přejdou na první / poslední dostupnou záložku. Navigace šipkami je cyklická a přeskakuje zakázané záložky.
- V ručním režimu obsah aktivuje Enter nebo mezerník. Tab pokračuje z jednoho dostupného tlačítka do obsahu.
- Pure doplní `tablist`, `tab`, `tabpanel`, vazby přes ID, `aria-selected`, orientaci a roving tabindex. Panel bez vlastního tabindex dostane `0`.
- Seznam pojmenuj přes `aria-label` nebo `aria-labelledby`. Existující ID musí být unikátní; chybějící ID se vygenerují.
- Programové přepnutí standardně nekrade focus. Pokud ale focus leží v právě skrývaném panelu, přesune se na nové tlačítko.

Záložky na mobilu zachovávají svůj význam; nepřepínají se na accordion. Horizontální lišta se při nedostatku místa posouvá uvnitř obalu. Vertikální varianta má na mobilu seznam nad obsahem, od 960 px vedle obsahu. Nejsou zavedené další breakpointy.

## Událost, načítání obsahu a modal

Na kořeni bublá `pure:tab-change` s `detail: { key, previous, tab, panel }`. Při vnoření filtruj `event.target`, protože událost vnitřních záložek probublá i do vnějšího kořene.

```js
root.addEventListener('pure:tab-change', event => {
  if (event.target !== root) return;
  const { key, panel } = event.detail;
  // Sem lze připojit vlastní API nebo Pure createLoader(panel).
});
```

Záložky samy neprovádějí AJAX ani neukládají stav do URL. Aplikace může napojit `onChange` na datový controller nebo loader a sama řídit cache, chyby a cleanup transportu. Pro nákladné načítání se hodí `activation: 'manual'`.

V modalu použij úplně stejný markup a `createTabs(dialog.querySelector('[data-tabs]'))`. Modal se inicializuje samostatně. Záložky nepřebírají Escape, nezavírají dialog a nemění modalový focus trap. Jejich stav při zavření a opětovném otevření zůstává zachovaný. Při odstranění modalu znič oba controllery.
