# Publishing Plan — fmscriptui-markdown → JetBrains Marketplace

Target: get `com.bluekachina.fmscriptui` ("FileMaker Script UI") listed on the
[JetBrains Marketplace](https://plugins.jetbrains.com/). This plan assumes you're
reusing the vendor account / signing setup you already started on the other
plugin's repo — steps that should be **shared across both plugins** are called out
explicitly so you don't duplicate secrets or certs.

## Current state (as of this repo today)

- LICENSE added (MIT).
- Pushed to `github.com/Blue-Kachina/fmscriptui_jetbrains`.
- Plugin icon added at `src/main/resources/META-INF/pluginIcon.svg`, plus a real screenshot at
  `docs/screenshots/preview.png`, wired into `README.md`.
- CI/CD added: `.github/workflows/ci.yml` + `release.yml`, mirroring FMCuttingBoard's proven
  pattern (`publishPlugin` deliberately deferred until after first manual submission).
- Signing configured in `build.gradle.kts`; cert generated and `CERTIFICATE_CHAIN`/
  `PRIVATE_KEY`/`PRIVATE_KEY_PASSWORD` confirmed set as GitHub secrets.
- No tests beyond a fixture (`src/test/resources/sample.md`) — no actual test class.
- Bundles zero third-party code: `render.js`/`filemaker-highlight.js`/`filemaker-grammar.js`/
  `filemaker-script.css` are vendored verbatim from your own `fmscriptui` repo. `hljs.min.js`
  (highlight.js) has been removed — `render.js` now falls back to fmscriptui's own
  dependency-free tokenizer instead.
- `pluginVerification { ides { recommended() } }` is already wired up in
  `build.gradle.kts` — good starting point, but hasn't been run/checked yet.

---

## 1. Licensing

- [x] **Pick a license and add `LICENSE`** at repo root — MIT added, copyright "Blue Kachina",
  matching `fmscriptui`'s own declared license and FMCuttingBoard's precedent. `README.md` has
  a `## License` section pointing at it.
- [x] ~~Add a `THIRD-PARTY-NOTICES.md` documenting the bundled highlight.js build~~ —
  no longer needed. `hljs.min.js` has been removed entirely: `render.js` now falls back to
  `fmscriptui`'s own dependency-free `filemaker-highlight.js` tokenizer instead of a real
  highlight.js runtime, so this plugin bundles zero third-party code. Also shrinks the
  packaged ZIP by ~124 KB.
- [x] Confirm `fmscriptui`'s own license permits this kind of redistribution —
  `fmscriptui`'s `package.json` declares `"license": "MIT"`, same as here.

## 2. `plugin.xml` / metadata polish

- [ ] Add an **email** attribute to `<vendor>` (currently only `url` is set).
  Marketplace shows this on the listing and it's expected for support contact.
- [ ] Description CDATA is fine as a starting point, but Marketplace listings read
  better with a bit more: what problem it solves, a short "before/after", and a
  link back to the main `fmscriptui` project. You can keep it short — this isn't a
  hard requirement, just improves discoverability.
- [ ] Double check `sinceBuild = "253"` is intentional and leave `untilBuild`
  unset (already the case) — Marketplace now recommends *not* pinning an upper
  bound so the plugin doesn't go stale automatically.

## 3. Plugin icon (required for a polished listing, de facto required by reviewers)

- [x] `src/main/resources/META-INF/pluginIcon.svg` — final version (0.1.2) uses your own
  `resources/FmScriptUI_JetBrains_icon_small_bw.svg`: simple black line art (scroll + "FM" +
  accordion-triangle), ~3.9 KB, transparent background, renders legibly at 40×40 and 16×16.
  (An earlier hand-built version and your initial VTracer auto-trace of the 1024×1024 PNG were
  both superseded by this one — the auto-trace was 140+ KB of photographic bezier detail that
  didn't downscale cleanly.)
- [x] Added `src/main/resources/META-INF/pluginIcon_dark.svg` — same artwork with white instead
  of black lines. The original is pure black on transparent, which would be nearly invisible
  against the dark Settings→Plugins list background in Darcula/dark themes without this.
- [x] Added a real screenshot (`docs/screenshots/preview.png` — the actual Markdown preview
  showing a rendered accordion with calculation syntax highlighting), wired into `README.md`.
  One screenshot covers the plugin's whole surface area well; more aren't necessary.

## 4. Repository visibility

- [x] Pushed to `github.com/Blue-Kachina/fmscriptui_jetbrains`.
- [x] README's dev instructions (`./gradlew runIde`, etc.) read correctly.

## 5. JetBrains Marketplace account / vendor (shared with the other plugin)

If you already created a Marketplace account/organization while prepping the
other repo, **reuse it** — don't create a second vendor identity.

- [ ] Confirm you have a Marketplace account under the `Blue-Kachina` vendor name
  at https://plugins.jetbrains.com/author/me (or an Organization if you want both
  plugins under one shared org umbrella — recommended once you have 2+ plugins).
- [ ] Generate a **Permanent Token** (Profile → My Tokens) scoped for uploading —
  this is what `publishPlugin` uses. Store it as `PUBLISH_TOKEN`.
- [ ] If using a GitHub *organization* for both repos, prefer **org-level GitHub
  Actions secrets** over per-repo secrets so both plugins' CI can reference the
  same `PUBLISH_TOKEN`/signing cert without duplicating them.

## 6. Plugin signing (shared cert with the other plugin)

Marketplace strongly recommends signed plugins (shows a "verified" badge, and is
required for some update-channel behaviors). Since both plugins share the
`Blue-Kachina` vendor, **sign both with the same certificate** rather than
generating a new one per plugin.

- [x] Added the `signing`/`publishing` blocks to `build.gradle.kts`, reading
  `CERTIFICATE_CHAIN`/`PRIVATE_KEY`/`PRIVATE_KEY_PASSWORD`/`PUBLISH_TOKEN` from environment
  variables — same shape as FMCuttingBoard's. `./gradlew tasks` confirms `signPlugin` and
  `publishPlugin` are now registered.
- [x] Generated a fresh 10-year self-signed cert for this repo (couldn't reuse FMCuttingBoard's
  exact key material — its private key was deleted from local disk after being pushed to GitHub
  secrets, which are write-only): `CN=FmScriptUiMarkdown, OU=Blue Kachina, O=Blue Kachina,
  C=US`. Generated via `openssl genrsa -aes256` / `openssl req -x509`, written only to a local
  scratch dir, never committed.
- [x] `CERTIFICATE_CHAIN`, `PRIVATE_KEY`, `PRIVATE_KEY_PASSWORD` confirmed set via
  `gh secret list --repo Blue-Kachina/fmscriptui_jetbrains`. Local/scratch copies of the cert
  material deleted afterward.

## 7. Compatibility verification

- [x] Ran `./gradlew buildPlugin verifyPlugin` (via the project's own devcontainer) —
  **Compatible** against PS-2025.3, PS-2026.1, and PS-2026.2, "can probably be enabled/disabled
  without IDE restart." Re-ran clean after adding the icon/signing config — still green.
- [ ] Since the plugin only depends on `com.intellij.modules.platform` +
  `org.intellij.plugins.markdown` (no PhpStorm-specific API), it should be
  installable in *any* IDE that bundles the Markdown plugin — IDEA, WebStorm,
  PyCharm, GoLand, RubyMine, CLion, Rider, PhpStorm, etc., matching the README's
  "PhpStorm, IntelliJ IDEA, WebStorm, etc." claim. Spot-check that
  `recommended()` is actually covering that breadth (it resolves IDEs from
  Marketplace's suggestion API based on declared dependencies/compat range) —
  worth manually confirming in the verifier report rather than assuming.
- [ ] Run `./gradlew test` — currently there's no real test class, just a
  fixture file. Not a blocker for Marketplace, but consider at least one smoke
  test asserting the extension registers and the bundled JS/CSS files are
  present in the built jar, so a future refactor can't silently drop
  `render.js` from resources.

## 8. CI/CD (mirrors FMCuttingBoard's pattern)

- [x] `.github/workflows/ci.yml` — on push/PR to any branch: `gradle build`, `gradle test`,
  `gradle verifyPlugin`. Identical shape to FMCuttingBoard's (JDK 21, Gradle cache, uses the
  runner's hosted `gradle` rather than `./gradlew`, matching the already-proven pattern there).
- [x] `.github/workflows/release.yml` — on `v*` tag push: verifies the tag matches `version =`
  in `build.gradle.kts` (this repo tracks version there, not in `gradle.properties` like
  FMCuttingBoard), runs tests + `buildPlugin` + `verifyPlugin` + `signPlugin`
  (`CERTIFICATE_CHAIN`/`PRIVATE_KEY`/`PRIVATE_KEY_PASSWORD` now available as repo secrets), then
  creates a GitHub Release with the signed zip attached via `gh release create --generate-notes`.
- [ ] **Not yet pushed/exercised** — needs an actual `v0.1.1`-style tag pushed to confirm the
  pipeline runs end-to-end (FMCuttingBoard's only proved itself once a real tag triggered it).
- [ ] `publishPlugin` intentionally left out for now (commented explanation in `release.yml`) —
  the first submission of a new plugin ID goes through manual moderation regardless, so there's
  no `PUBLISH_TOKEN` secret yet. Add both once `0.1.1` (or whatever version is submitted first)
  is accepted.

## 9. First submission

- [ ] The **first** upload of a new plugin ID always goes through **manual
  JetBrains moderation** (typically a few business days), regardless of whether
  it's done via web UI or `publishPlugin` — plan the timing accordingly if this
  is time-sensitive. Subsequent version updates via token are automatic.
- [ ] Do the first upload manually via the web UI
  (https://plugins.jetbrains.com/plugin/add) the first time, so you can see and
  fix any moderation feedback interactively, then switch to CI-driven
  `publishPlugin` for all later versions.
- [ ] Pick a pricing model at submission time: Free is the obvious choice here
  (small utility plugin) unless you have other plans.
- [ ] Pick 1–2 Marketplace categories/tags (e.g. "Markdown", "Other Tools") to
  aid discoverability.

## 10. Ongoing maintenance

- [ ] Keep `changeNotes` in `build.gradle.kts` updated per release (currently a
  single hardcoded "Initial release" block) — consider the
  `org.jetbrains.changelog` Gradle plugin later if release cadence picks up, but
  not needed to ship v0.1.0.
- [ ] Bump `version` in `build.gradle.kts` per release; Marketplace uses this
  directly.
- [ ] Since the `updateFmscriptui` Gradle task pulls from upstream on demand rather than
  pinning via a lockfile, re-run and re-verify before each release so published versions
  have deterministic, known-good bundled assets.
