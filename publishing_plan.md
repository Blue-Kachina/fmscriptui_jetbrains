# Publishing Plan — fmscriptui-markdown → JetBrains Marketplace

Target: get `com.bluekachina.fmscriptui` ("FileMaker Script UI") listed on the
[JetBrains Marketplace](https://plugins.jetbrains.com/). This plan assumes you're
reusing the vendor account / signing setup you already started on the other
plugin's repo — steps that should be **shared across both plugins** are called out
explicitly so you don't duplicate secrets or certs.

## Current state (as of this repo today)

- No LICENSE file.
- Git remote added (`github.com/Blue-Kachina/fmscriptui_jetbrains`), but not yet pushed.
- No plugin icon (`pluginIcon.svg`) — in progress.
- No CI/CD (no `.github/workflows`).
- No signing config (`signPlugin`/`publishPlugin`) in `build.gradle.kts`.
- No tests beyond a fixture (`src/test/resources/sample.md`) — no actual test class.
- Bundles zero third-party code: `render.js`/`filemaker-highlight.js`/`filemaker-grammar.js`/
  `filemaker-script.css` are vendored verbatim from your own `fmscriptui` repo. `hljs.min.js`
  (highlight.js) has been removed — `render.js` now falls back to fmscriptui's own
  dependency-free tokenizer instead.
- `pluginVerification { ides { recommended() } }` is already wired up in
  `build.gradle.kts` — good starting point, but hasn't been run/checked yet.

---

## 1. Licensing

- [ ] **Pick a license and add `LICENSE`** at repo root. Since `fmscriptui` is your
  own repo, check what license *it* declares (or add one there too) and use the
  same one here for consistency — MIT is the common choice for JetBrains plugins.
- [x] ~~Add a `THIRD-PARTY-NOTICES.md` documenting the bundled highlight.js build~~ —
  no longer needed. `hljs.min.js` has been removed entirely: `render.js` now falls back to
  `fmscriptui`'s own dependency-free `filemaker-highlight.js` tokenizer instead of a real
  highlight.js runtime, so this plugin bundles zero third-party code. Also shrinks the
  packaged ZIP by ~124 KB.
- [ ] Confirm `fmscriptui`'s own license permits this kind of redistribution (moot
  if you're the sole author/owner, but worth a one-line note in the README either
  way since it's a stated dependency).

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

- [ ] Add `src/main/resources/META-INF/pluginIcon.svg` (16×16 or scalable, used in
  Settings > Plugins list) and `pluginIcon_dark.svg` for dark theme. JetBrains'
  [plugin icon guidelines](https://plugins.jetbrains.com/docs/marketplace/icons-for-plugins.html)
  give exact sizing/format rules — 40×40 canvas, monochrome-friendly.
- [ ] Consider 1–3 screenshots or a short GIF of the accordion rendering in the
  Markdown preview (light + dark) for the Marketplace page gallery. This plugin is
  purely visual, so a screenshot does a lot of work convincing someone to install
  it — worth the 10 minutes.

## 4. Repository visibility

- [ ] Push this repo to `github.com/Blue-Kachina/phpstorm_fmscriptui` (or whatever
  name you settle on) — there's currently no git remote configured locally.
  Marketplace listings link back to a public source repo, and `plugin.xml`
  already references `github.com/Blue-Kachina/fmscriptui` for the fence spec.
- [ ] Make sure the README's dev instructions (`./gradlew runIde`, etc.) still
  read correctly once public — they currently do.

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

- [ ] If you haven't already generated a cert for the other repo, do it once:
  ```bash
  openssl genrsa -aes256 -out private.pem 4096
  openssl req -x509 -key private.pem -sha256 -days 3650 -out chain.crt
  ```
- [ ] Store `CERTIFICATE_CHAIN`, `PRIVATE_KEY`, `PRIVATE_KEY_PASSWORD` as secrets
  (reuse the exact same values from the other repo's setup if they exist).
- [ ] Add to `build.gradle.kts`:
  ```kotlin
  intellijPlatform {
      signing {
          certificateChain = providers.environmentVariable("CERTIFICATE_CHAIN")
          privateKey = providers.environmentVariable("PRIVATE_KEY")
          password = providers.environmentVariable("PRIVATE_KEY_PASSWORD")
      }
      publishing {
          token = providers.environmentVariable("PUBLISH_TOKEN")
      }
  }
  ```

## 7. Compatibility verification

- [ ] Run `./gradlew verifyPlugin` locally at least once before first submission —
  `pluginVerification { ides { recommended() } }` is already configured, so this
  should "just work," but it hasn't been exercised yet in this repo.
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

## 8. CI/CD (mirror whatever pattern you used on the other repo)

If the other repo's prep already includes a GitHub Actions release workflow
(build → verify → sign → draft GitHub release → publish to Marketplace on
tag/release), copy that pattern here for consistency rather than inventing a
second one. If it doesn't exist yet either, the standard shape (from JetBrains'
[intellij-platform-plugin-template](https://github.com/JetBrains/intellij-platform-plugin-template))
is:

- [ ] `.github/workflows/build.yml` — on push/PR: `./gradlew build test verifyPlugin`.
- [ ] `.github/workflows/release.yml` — on published GitHub release: build, sign
  (`./gradlew signPlugin`), publish (`./gradlew publishPlugin`), attach the signed
  zip to the GitHub release.
- [ ] Wire `CERTIFICATE_CHAIN` / `PRIVATE_KEY` / `PRIVATE_KEY_PASSWORD` /
  `PUBLISH_TOKEN` from step 5–6 into the workflow's `env`.

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
