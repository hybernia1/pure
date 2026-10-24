# Seznamy v JSON editoru

Editor podporuje odrážkové a číslované seznamy. Ve výchozím stavu je `features.lists: true`; volbou `false` skryješ nástroje a vypneš příkazy, načtená data se dál zachovají.

```json
{
  "version": 1,
  "blocks": [
    { "type": "list", "style": "bullet", "items": [
      { "children": [{ "text": "První bod", "bold": true }] },
      { "children": [{ "text": "Druhý bod" }] }
    ] },
    { "type": "paragraph", "children": [{ "text": "Běžný odstavec." }] },
    { "type": "list", "style": "ordered", "items": [{ "children": [{ "text": "První krok" }] }] }
  ]
}
```

Celý seznam je jeden blok s neprázdným polem `items`. Má jedno záhlaví, jeden úchyt pro přesun a jedno tlačítko Smazat. Položky jsou obyčejné `li` v sémantickém `ul` nebo `ol`, bez samostatných rámečků a ovládání. Přesouvá a maže se vždy celý seznam. Dva sousední bloky seznamu zůstávají samostatné; každý číslovaný seznam začíná od 1. Podporovaná je jedna úroveň, bez HTML a vnořených seznamů.

Starší sousední bloky `list-item` stejného stylu `normalizeDocument()` při načtení automaticky spojí do jednoho bloku `list`. Výstup `getJSON()` už používá pouze nový formát. Odstavce, nadpisy a obrázky se nemění; validátor aplikace musí podporovat `list` a jeho `items`.

Položky mají stejné textové běhy jako odstavce: `text`, `bold`, `italic`, `link`. Výběr a formátování mohou začít uvnitř položky, pokračovat přes další položky a přesáhnout do dalších bloků. Fungují odkazy a undo/redo. Patička počítá celý seznam jako jeden blok a všechna jeho slova; nezapočítává čísla, odrážky nebo řídicí UI. `getText()` a kopírování vracejí prostý text položek oddělený novým řádkem, nikoli HTML či Markdown.

## Ovládání a API

- Ikony v toolbaru spojí vybrané textové bloky do odrážkového nebo číslovaného seznamu. Uvnitř seznamu mění styl celého bloku. Opakované stisknutí aktivního nástroje převede položky na odstavce.
- Enter pokračuje novou položkou stejného stylu. Enter na prázdné položce ji převede na odstavec a seznam ukončí.
- Backspace na začátku položky ji převede na odstavec, aniž by smazal předchozí blok. Pokud je položka uprostřed seznamu, zbylé položky před ní a za ní vytvoří samostatné bloky seznamu.
- Přesouvání a mazání používá jedno společné blokové záhlaví. Undo obnoví seznam včetně všech položek.

```js
editor.command('bulletList');
editor.command('orderedList');
editor.command('list', 'bullet'); // explicitní nastavení, nikoli toggle
editor.command('list', 'ordered');
editor.command('list', null);     // zpět na odstavce
```

Všechny příkazy jsou synchronní a pracují nad bloky zasaženými aktuálním výběrem. Neznámý styl vyhodí výjimku. Obrázky ve výběru se při změně typu textu přeskočí. Převod seznamu na nadpisy či odstavce zachová text každé položky v samostatném textovém bloku.

Čistý export `setList(documentJSON, from, to, style)` z `editor-model.js` (i hlavního exportu) vrací normalizovanou kopii se změněnými bloky. Rozsah jsou UTF-16 offsety jako u `formatText` a `setHeading`. Jednotlivé položky odděluje jeden znak nového řádku. `replaceText` zachovává typ položky při rozdělení textu novým řádkem.

Překlady mají klíče `bulletList`, `orderedList`, `listItem`; ikony jsou `list-bullet`, `list-ordered` ve společném sprite.

[Ukázka editoru](../examples/modules.html#editor-title) · [Modelové testy](../test/editor-model.test.js) · [Integrační testy seznamů a médií](../test/editor-lists.html)
