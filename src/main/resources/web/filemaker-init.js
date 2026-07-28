/**
 * Glue between the IntelliJ Markdown JCEF preview and fmscriptui.
 *
 * render.js is an ES module (`export function`), but the Markdown preview injects `scripts`
 * as plain classic `<script src="...">` tags — so it can't be listed there directly. Instead
 * this classic script dynamically imports it. `import('./render.js')` resolves relative to
 * this script's own served URL, which is served from the same ResourceProvider/path prefix.
 * render.js in turn statically imports filemaker-highlight.js (fmscriptui's own
 * dependency-free fallback highlighter, used since this plugin never sets `window.hljs`),
 * which imports filemaker-grammar.js — both fetched automatically as part of the same module
 * graph once render.js loads.
 */
(function () {
    'use strict';

    // --- Theme detection -----------------------------------------------------
    // fmscriptui's CSS hardcodes light colors; filemaker-script-dark.css supplies
    // dark overrides keyed off an `fm-dark` class this script toggles on <html>.
    // No single IDE-version-stable signal exists for "is this a dark theme", so
    // this checks several fallbacks, same approach used by the Mermaid IntelliJ
    // plugin for the same problem.

    var DARK_CLASSES = ['darcula', 'dark', 'dark-mode', 'dark-theme', 'theme-dark'];

    function computeBrightness(el) {
        if (!el) return -1;
        var bg = window.getComputedStyle(el).backgroundColor;
        if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') return -1;
        var match = bg.match(/\d+/g);
        if (!match || match.length < 3) return -1;
        return (parseInt(match[0], 10) * 299 + parseInt(match[1], 10) * 587 + parseInt(match[2], 10) * 114) / 1000;
    }

    function isDarkTheme() {
        try {
            var cs = window.getComputedStyle(document.documentElement).colorScheme;
            if (cs && cs.indexOf('dark') !== -1 && cs.indexOf('light') === -1) return true;

            var meta = document.querySelector('meta[name="color-scheme"]');
            if (meta) {
                var content = meta.getAttribute('content') || '';
                if (content.indexOf('dark') !== -1 && content.indexOf('light') === -1) return true;
            }

            if (DARK_CLASSES.some(function (c) { return document.documentElement.classList.contains(c); })) return true;
            if (document.body && DARK_CLASSES.some(function (c) { return document.body.classList.contains(c); })) return true;

            for (var i = 0; i < 2; i++) {
                var brightness = computeBrightness(i === 0 ? document.body : document.documentElement);
                if (brightness >= 0) return brightness < 128;
            }

            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return true;
        } catch (e) {
            console.warn('[fmscriptui] theme detection failed', e);
        }
        return false;
    }

    function applyTheme() {
        document.documentElement.classList.toggle('fm-dark', isDarkTheme());
    }

    function setupThemeObserver() {
        var timer = null;
        function onThemeChange() {
            clearTimeout(timer);
            timer = setTimeout(applyTheme, 100);
        }
        var observer = new MutationObserver(onThemeChange);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
        observer.observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ['content'] });
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onThemeChange);
        }
    }

    // --- Rendering --------------------------------------------------------

    function hasWork() {
        return document.querySelector('pre code.language-filemaker-script') !== null;
    }

    function boot(renderMod) {
        function render() {
            try {
                renderMod.renderFileMakerScripts();
            } catch (e) {
                console.error('[fmscriptui] render failed', e);
            }
        }

        // The Markdown preview patches the DOM incrementally (IncrementalDOM) rather
        // than reloading the page on every edit; hook its after-patch notification so
        // newly-typed fences get rendered. Fall back to a MutationObserver if that
        // hook isn't available in this preview implementation/version.
        function hookIncrementalDOM() {
            if (typeof IncrementalDOM === 'undefined' || !IncrementalDOM.notifications) return false;
            if (!Array.isArray(IncrementalDOM.notifications.afterPatchListeners)) {
                IncrementalDOM.notifications.afterPatchListeners = [];
            }
            IncrementalDOM.notifications.afterPatchListeners.push(render);
            return true;
        }

        function setupMutationObserver() {
            new MutationObserver(function () {
                if (hasWork()) render();
            }).observe(document.body, { childList: true, subtree: true });
        }

        if (!hookIncrementalDOM()) {
            setupMutationObserver();
        }

        render();
    }

    // This script is injected before <body> is necessarily parsed, so touching
    // document.body (theme detection/observers, the render MutationObserver fallback)
    // has to wait for DOMContentLoaded — doing it eagerly throws synchronously and
    // aborts the rest of this script, including the Promise.all() below.
    function bootstrap() {
        applyTheme();
        setupThemeObserver();

        // External stylesheets (including the ones that set the IDE's actual theme
        // colors) don't block DOMContentLoaded, so this first applyTheme() can run
        // before those finish loading and land on the browser-default (light)
        // background. A DOM MutationObserver won't catch that transition either,
        // since nothing about the DOM itself changes when a stylesheet finishes
        // loading — only computed styles do. Re-check once, shortly after, to
        // catch late-applied theme styles (same workaround the reference Mermaid
        // IntelliJ plugin uses for this exact timing quirk).
        setTimeout(applyTheme, 500);

        import('./render.js').then(function (renderMod) {
            boot(renderMod);
        }).catch(function (err) {
            console.error('[fmscriptui] failed to load render.js', err);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }
})();
