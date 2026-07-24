# fmscriptui-markdown

An IntelliJ Platform plugin that extends the built-in Markdown preview (the bundled
`org.intellij.plugins.markdown` plugin — present in PhpStorm, IntelliJ IDEA, WebStorm, etc.)
so that ` ```filemaker-script ` fenced code blocks render as collapsible, FileMaker-Pro-style
script accordions, using [fmscriptui](https://github.com/Blue-Kachina/fmscriptui).

## How it works

- `render.js` and `filemaker-script.css` are bundled verbatim from fmscriptui
  (`src/main/resources/web/`) — see `./gradlew updateFmscriptui` below to re-sync them.
- `FmScriptUiBrowserExtension` (Kotlin) registers with the Markdown plugin's
  `org.intellij.markdown.browserPreviewExtensionProvider` extension point to inject
  `filemaker-init.js` and `filemaker-script.css` into the preview's JCEF browser.
- `filemaker-init.js` is the only hand-written script. Since `render.js` is an ES module
  (`export function renderFileMakerScripts`) but the preview injects scripts as plain classic
  `<script src>` tags, `filemaker-init.js` dynamically `import()`s `render.js` and calls
  `renderFileMakerScripts()` on load and after every incremental DOM patch the preview applies
  (falling back to a `MutationObserver` if that hook isn't available).

## Known limitations (v1)

- No syntax highlighting for embedded calculation blocks — `render.js` already degrades
  gracefully to plain text when `window.hljs` isn't present, per its own README. Bundling a
  real highlight.js distribution (plus fmscriptui's `hljs-language.js`) is a planned follow-up.
- `filemaker-script.css` is light-mode only; no dark-theme-aware styling yet.
- Markdown-preview integration only — no standalone `.fmscript` file type/editor.

## Development

```bash
./gradlew runIde        # launches a sandboxed PhpStorm with the plugin installed
./gradlew updateFmscriptui  # re-downloads render.js / filemaker-script.css from GitHub
```

Open `src/test/resources/sample.md` in the sandboxed IDE and check its Markdown preview.
