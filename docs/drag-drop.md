# Drag & drop

V editoru zabírá úchyt celé záhlaví až po samostatné tlačítko „Smazat“, včetně prázdné plochy vedle názvu a údaje o šířce. Text dokumentu zůstává označitelný.

Volitelný callback `translate(key, values)` překládá oznámení služby. Klíče `dragMoved`, `dragMoving`, `dragCanceled`, `dragPicked`, `dragPosition` a parametry `{index}`, `{count}` odpovídají slovníkům `editorLocales`; bez callbacku zůstávají původní české texty.

`createDragDrop` je samostatná služba pro svislé řazení přímých potomků kontejneru. Nepotřebuje editor, ikony ani knihovnu. Podporuje myš, dotyk, pero a klávesnici. Souborový upload a přenos mezi seznamy nejsou součástí tohoto API.

Volby `nested: true, reorder: false` dovolují položky uvnitř společného kontejneru i pod seskupujícími elementy. Služba v tomto režimu nepřesouvá DOM; předá `onMove({ from, to, item, items })` a aplikace aktualizuje model a vykreslení. `items` je původní pořadí. Obě volby použij společně; nested s automatickým DOM reorderem se odmítne. Jde o volitelný režim; editor používá přímé potomky, protože i celý seznam je jeden blok.

```html
<ul id="tasks">
  <li data-drag-item data-id="a"><button type="button" data-drag-handle>První úloha</button></li>
  <li data-drag-item data-id="b"><button type="button" data-drag-handle>Druhá úloha</button></li>
</ul>
```

```js
import { createDragDrop } from './dist/js/index.js';
const drag = createDragDrop(document.querySelector('#tasks'), {
  items: '[data-drag-item]',
  handle: '[data-drag-handle]',
  onMove({ from, to, item, items }) {
    // DOM už je v novém pořadí. Indexy jsou od nuly, to je výsledný index.
    console.log(from, to, items.map(item => item.dataset.id));
  },
});
drag.move(0, 1); // stejná operace programově
drag.cancel(); // zruší pouze probíhající gesto
drag.destroy(); // odpojí události a odstraní indikátory; pořadí zachová
```

Selektory mají uvedené výchozí hodnoty. Úchyt musí ležet uvnitř řazené položky; použij pojmenované tlačítko. Nové přímé potomky služba rozpozná automaticky. Na jednom kontejneru smí být jedna instance. `onMove` se volá jednou po skutečné změně pořadí; stejné indexy nic nemění. Služba přesune DOM uzel, aplikace synchronizuje data a případné uložení do API. Neúspěšné uložení může aplikace řešit pomocí `move(to, from)` se svou ochranou proti opakovanému ukládání.

Tažení začíná po drobném pohybu úchytu; text v těle položky zůstává normálně označitelný. Značka ukazuje výslednou pozici, DOM se mění až po uvolnění. Uvolnění mimo kontejner, Escape, pointercancel nebo ztráta focusu okna gesto zruší. Při tažení u okraje se posouvá nejbližší scrollovací kontejner nebo stránka.

Klávesnice na úchytu: mezerník/Enter vybere blok, šipky nahoru/dolů mění cílovou pozici, Home/End přejdou na začátek/konec, mezerník/Enter potvrdí, Escape nebo Tab zruší. Stav a výsledná pozice se oznamují přes `role="status"`. Focus zůstává na přesunutém úchytu.

CSS `drag-drop.css` využívá atributy `data-dragging`, `data-drop-before`, `data-drop-end`, tokeny a neutrální barvy. Pro vlastní selektory si položky označ i `data-drag-item`, úchyty `data-drag-handle`, nebo doplň ekvivalentní CSS (zejména `touch-action: none` na úchytu). CSS je také součástí `pure.css`. Ukázka: [samostatný seznam](../examples/modules.html#drag-title).

Editor používá stejnou službu. Úchytem je text typu bloku v záhlaví, mazání má text „Smazat“. Přesun i odstranění jsou jedna položka undo/redo; řídicí texty se nikdy nezapisují do JSON. Příkazy editoru: `editor.command('moveBlock', { from: 0, to: 2 })`, `editor.command('removeBlock', 1)`. Po odstranění posledního bloku zůstane prázdný odstavec. Při modulárním CSS editoru připoj i `drag-drop.css`.
