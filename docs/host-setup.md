# Host setup layout

On desktop windows at least 900 CSS pixels wide, each player slot displays its position, faction, color, and assigned players in one row. The selectors and randomize buttons retain 44-pixel targets. Validation messages remain below the relevant selector.

All eight slots, Start, and Pair a device fit the default 1200 by 850 desktop window. Browser checks also cover 1024 by 660 and 1280 by 800 viewports and keyboard reordering with saved player assignments. The native desktop check uses the application's actual default window, including the content area available on Windows.

Narrow windows use stacked fields. The 390 by 500 minimum window can scroll vertically to every slot while keeping readable controls and avoiding horizontal overflow. Smaller windows and enlarged text may also require vertical scrolling.

Run `npm run test:browser` for the responsive and keyboard checks. Run `npm run test:desktop` for the native default-window check.
