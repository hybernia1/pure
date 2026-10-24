# Navigation

One set of native nav/list/link elements serves mobile and desktop, with details/summary submenus. Without JavaScript links remain visible and submenus work natively. JS adds mobile collapse, focus handling and active URL state. No menu role or router.

[Example](../examples/navigation.html) - [Tests](../test/navigation.html)

```html
<nav class="navigation" data-navigation aria-label="Main navigation">
  <a class="navigation-brand" href="/">Pure</a>
  <button type="button" class="button button-outline navigation-toggle"
    data-nav-toggle aria-controls="main-links" hidden>
    <svg class="icon" aria-hidden="true"><use href="/assets/pure/icons.svg#menu"></use></svg>
  </button>
  <div class="navigation-panel" data-nav-panel id="main-links">
    <ul class="navigation-list">
      <li><a href="/">Overview</a></li>
      <li><details data-nav-dropdown>
        <summary>Project</summary>
        <ul class="navigation-submenu">
          <li><a href="/members">Members</a></li>
          <li><a href="/settings">Settings</a></li>
        </ul>
      </details></li>
    </ul>
  </div>
</nav>
```

```js
import { loadComponent } from '@pure-ui/core/lazy';
const { createNavigation } = await loadComponent('navigation');
const navigation = createNavigation(document.querySelector('[data-navigation]'));
```

Direct imports require navigation.css with tokens/base/components, or pure.css. Lazy loading does not load modal/form/editor modules. SVG markup belongs to the application; its URL can come from getPureConfig().iconsUrl.

## Structure and behavior

Root must be nav[data-navigation] with exactly one owned data-nav-toggle button and data-nav-panel. The panel needs a unique ID matching aria-controls. The button is outside the panel. Instances are independent and ignore nested navigation roots.

Initially hide the toggle, not the panel: non-JS links remain accessible. Do not apply hiding utilities to the panel; the module owns visibility. A submenu is details[data-nav-dropdown] within the panel with summary as first element and .navigation-submenu content. JS opens at most one sibling submenu, preserving open ancestors, and does not open on hover. Desktop positioning corrects viewport overflow and recalculates after resizing.

Below 960px the toggle expands the panel below the brand. From 960px the panel is always visible and toggle hidden. Crossing the breakpoint closes mobile/submenu state, moving focus only if its current element would become hidden.

Navigation is nonmodal: no scroll lock/focus trap. Tab follows links; Enter/Space natively toggles summary. Escape closes the nearest submenu and returns summary focus; another Escape closes mobile navigation and focuses the toggle. Outside click/focus departure closes it without stealing focus from the destination.

## Options and methods

| Option | Default | Meaning |
| --- | --- | --- |
| active | Document URL | Initial active URL; null clears it. |
| match | path | origin/pathname with hash-section handling, or exact including query/hash. |
| closeOnSelect | true | Regular link clicks close submenus/mobile panel. |
| locale/messages | Global defaults | openNavigation/closeNavigation translations; explicit toggle aria-label wins. |

At most one panel link is active; a brand outside it is excluded. Section matches beat page matches. aria-current is page for pages and location for sections; ancestors get data-nav-active. path ignores query but does not normalize trailing slash. External/download links are not marked.

| Method | Behavior |
| --- | --- |
| open() | Expand mobile panel; return mobile open boolean. Desktop stays visible. |
| close({focus=false}={}) | Collapse mobile/submenus; move hidden panel focus to the toggle. |
| toggle() | Toggle mobile state. |
| isOpen() | Mobile expanded state; false on desktop. |
| setActive(url=document.location.href) | Set active URL; return matching link or null. |
| refresh() | Reconcile visibility and re-evaluate the last active URL. |
| destroy() | Restore original attributes/visibility/details state and remove listeners; repeat-safe. |

initNavigations(scope=document,options={}) explicitly initializes roots including scope itself, returning cleanup. Failure cleans instances created during that call. Duplicate initialization is rejected. Change structure after destroy/reinitialize; existing href changes can be picked up by refresh.

## Router and events

Navigation never prevents link defaults. Modifier clicks, downloads and other-window targets stay open normally. Regular links work without a router or can be handled by the application.

hashchange/popstate update active state automatically. pushState emits no event itself: call navigation.setActive() after SPA navigation.

`pure:navigation-change` bubbles with `{open}` on mobile open/close changes. Viewport changes only restore layout. Filter event.target for nested instances.

```js
configurePure({ navigation: { match: 'path', closeOnSelect: true } });
navigation.setActive(window.location.href);
```

Uses shared control/space tokens, --p-navigation-width (14rem) and --p-navigation-z (20), neutral borders/surfaces and light/dark tokens without shadows.
