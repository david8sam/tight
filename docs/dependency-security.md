# Dependency maintenance

Run `npm ci --legacy-peer-deps`, `npm run audit:runtime`, and `npm audit` before updating a release. CI rejects any reported runtime advisory. The runtime gate requires the npm advisory service to respond successfully; network errors also fail the gate.

The October 22, 2026 update removed unused `superagent`, `cors`, and `ip`, replaced the address lookup with Node's network-interface API, removed unused Babel CLI, and replaced nodemon with Node's built-in watch mode. Express, ws, Babel, lodash, React Router, webpack, and their transitive dependencies were updated. The development toolchain now requires Node 22.15 or later. CI covers that minimum and Node 24.19.

## Validation and request-parser security

The dependency graph uses body-parser 1.20.9 and Zod 4.6.7 to address GHSA-27r3-jxmh-p828 and GHSA-mrhx-c7xc-m3w5. The Zod 4 migration updates schema types, safe-parse result types, and IPv4 validation. TypeScript 5.9.3 supports its declarations.

Run `node --test tests/dependency-validation.test.mjs` to verify that oversized constrained arrays are rejected before their elements are read. The sparse-array regression reproduces the old traversal behavior without allocating a large payload or exhausting memory. Backend and browser suites verify the application contracts across the major-version upgrade.

## Development dependency audit

The development-only webpack-dev-server proxy was removed after its dependency chain retained [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Browser development now uses webpack watch mode, and the backend serves the generated assets from the same origin. Developers reload after browser rebuilds instead of using hot module replacement. The proxy, middleware, glob parser and their affected dependency entries are no longer needed.

Both the complete installed graph and the production-only graph must be audited before releases. The dependency removal preserves every production lockfile entry. CI still installs from the committed lockfile, builds the app, runs the protocol/browser/native suites, and generates runtime license notices for Windows.

## Windows dependency inventory and notices

The packaging script generates `runtime-dependencies.json` and `THIRD-PARTY-NOTICES.txt`, both inside the app archive and beside the executable. The inventory records the production dependency closure from the lockfile, with exact versions, integrity hashes, source URLs, and declared licenses. It deliberately includes production dependencies used only during browser bundling. Build and watch tools are excluded.

`scripts/runtime-inventory.mjs` verifies installed versions and copies actual published license/notice files. Missing notices fail packaging. cookie-signature publishes its license in its README. is-in-browser 1.1.3 declares MIT but omits the notice file; a copy from its upstream project, with its source commit URL, is retained under `docs/licenses`. Electron's own license and Chromium notices remain in the packager output. These files support release review; they do not replace the final license review for distribution.

## Installer build tool

The installer uses electron-builder 26.15.3. Its app-builder-lib dependency is overridden to @electron/get 5.0.0, the same downloader major already used by the desktop packager. Earlier downloader versions pull an unpatched sprintf-js denial-of-service advisory through their proxy logger. This override removes that build-only chain and requires Node 22.12 or later; the project already requires 22.15. The downloader API loads on the minimum Node version, and Windows CI must build and exercise the resulting installer before this dependency change lands. The development-server advisory chain has been removed as described above. Recheck this override with each electron-builder update.
