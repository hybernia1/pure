# Tabbed content

One module works in pages, cards and modals. Switching hides ordinary HTML panels without rebuilding them or losing field values. Without JavaScript, all panels remain available in document order.

[Example](../examples/tabs.html) - [Browser tests](../test/tabs.html)

```html
<div class="tabs" data-tabs id="profile-tabs">
  <div class="tabs-list" data-tab-list aria-label="Profile">
    <button type="button" data-tab="overview">Overview</button>
    <button type="button" data-tab="settings">Settings</button>
  </div>
  <div class="tabs-panel" data-tab-panel="overview">Overview content</div>
  <div class="tabs-panel" data-tab-panel="settings">Settings content</div>
</div>
```

```js
import { loadComponent } from '@pure-ui/core/lazy';
const { createTabs } = await loadComponent('tabs');
const tabs = createTabs(document.querySelector('#profile-tabs'));
tabs.select('settings');
```

Direct imports require tabs.css with tokens/base/components or pure.css. The lazy tabs entry does not load modal/editor.

## API

createTabs(root,options={}) requires data-tabs, exactly one owned data-tab-list and nonempty unique data-tab/data-tab-panel key pairs. Tabs are direct button children of the list. Owned panels cannot contain one another; nested tabs use a separate data-tabs root.

| Option | Default | Meaning |
| --- | --- | --- |
| active | HTML selected tab, otherwise first enabled | Initial key; explicitly invalid/disabled values throw. |
| activation | auto | Arrows activate; manual moves focus, Enter/Space activates. |
| orientation | horizontal | horizontal or vertical keyboard/layout direction. |
| onChange(detail) | No callback | Actual panel changes only, not initialization/reselection. |

activation/orientation inherit configurePure({tabs:{activation:'manual',orientation:'horizontal'}}).

| Method | Behavior |
| --- | --- |
| select(key,{focus=false}) | Activate and return true; unknown/disabled returns false. |
| getActive() | Key, or null when all disabled. |
| refresh() | Reconcile disabled/aria-disabled changes; hide panels and return false if none enabled. |
| destroy() | Restore original attributes, IDs and visibility; retain content/field values. |

Structure is fixed at initialization. To add/remove tabs/panels, destroy, edit HTML and initialize again. Mutating methods throw after destroy; repeated destroy is safe. Duplicate initialization is rejected.

initTabs(scope=document,options={}) explicitly initializes roots within scope, including scope itself when marked, and returns cleanup. If validation fails, instances created during that call are cleaned up. Importing never scans automatically.

## Keyboard and accessibility

Left/Right navigates horizontal lists (respecting RTL); Up/Down navigates vertical lists. Home/End selects first/last enabled tab. Arrows wrap and skip disabled entries. Manual activation requires Enter/Space. Tab leaves the single tabbable tab for content.

Pure adds tablist/tab/tabpanel, ID relationships, aria-selected, orientation and roving tabindex. Panels without tabindex receive 0. Name the list with aria-label/aria-labelledby. Existing IDs must be unique; missing IDs are generated. Programmatic switching does not steal focus unless it would hide the focused panel, in which case focus moves to the new tab.

Tabs remain tabs on mobile, not accordions. Horizontal overflow stays inside the list. Vertical layout puts the list above content on mobile and beside it from 960px. No extra breakpoints.

## Events, loading and modals

`pure:tab-change` bubbles from root with `{key,previous,tab,panel}`. Filter event.target when nesting:

```js
root.addEventListener('pure:tab-change', event => {
  if (event.target !== root) return;
  const { key, panel } = event.detail;
  // Connect an application API or createLoader(panel).
});
```

Tabs do not load AJAX or persist URL state. Applications own cache/errors/transport cleanup. manual activation suits expensive loading.

In a modal, use the same markup and createTabs(dialog.querySelector('[data-tabs]')). Initialize the modal separately. Tabs do not intercept Escape, close dialogs or change focus trapping. State persists across close/reopen. Destroy both controllers when removing the modal.
