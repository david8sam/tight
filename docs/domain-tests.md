# Game rule regression tests

Run `npm test` to build the server and run the Node test suite. The pure rule tests load the public game helpers through the project's TypeScript compiler. They do not start a network server or duplicate the game rules.

`tests/domain-rules.test.mjs` checks these player-visible rules:

- Chosen strategy cards act in initiative order, before factions that have not chosen a card. Sorting does not change seat order.
- The current Naalu zero-token holder goes first. Callers can request ordinary card initiative without that override.
- Base and expansion versions of Diplomacy or Construction represent one card for ownership.
- Strategy picks follow the speaker's order. Action turns identify the faction holding the selected initiative.
- Passed factions are skipped. The end of an initiative pass and a table where everyone passed have no next faction.
- Public and secret objective toggles affect only their own points. Manual points remain separate.

`tests/server.test.mjs` also sends real client commands and reads back game state. It checks exclusive strategy-card ownership, speaker rotation, Naalu initiative, passing through the end of a round, round reset, restart configuration and player preservation, round bounds, and consistent planet ownership. `tests/storage.test.mjs` checks full state preservation across a forced backend restart. `tests/scoring.test.mjs` retains the stable-objective-ID regression.

The initiative and variant-ownership regressions failed on the earlier implementation. The comparator treated an unchosen card as preceding a chosen card, and variant queries did not inspect the base version's owner. These are corrected in the shared helpers used by the browser and server. The ownership lookup returns both the holder and the actual held initiative, so returning a displayed alternate card removes the correct card.

`tests/browser/strategy-variants.spec.ts` verifies both ownership directions for Diplomacy and Construction. It checks owner labels, selection restrictions, and the actual return command. Existing catalog choices remain unchanged. A historical base Construction card appears as a selected-only option while it is held, so an imported game does not display an empty selection.

These tests cover the tracker behavior described above. They are not a complete Twilight Imperium rules engine or physical Windows release qualification.
