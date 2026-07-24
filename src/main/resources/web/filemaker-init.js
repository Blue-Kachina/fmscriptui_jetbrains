/**
 * Glue between the IntelliJ Markdown JCEF preview and fmscriptui's render.js.
 *
 * render.js is an ES module (uses `export function`), but the Markdown preview
 * injects `scripts` as plain classic `<script src="...">` tags — so it can't be
 * listed there directly. Instead this classic script dynamically imports it.
 * `import('./render.js')` resolves relative to this script's own served URL,
 * which is served from the same ResourceProvider/path prefix as render.js.
 */
(function () {
    'use strict';

    function hasWork() {
        return document.querySelector('pre code.language-filemaker-script') !== null;
    }

    function boot(mod) {
        function render() {
            try {
                mod.renderFileMakerScripts();
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

    import('./render.js').then(boot).catch(function (err) {
        console.error('[fmscriptui] failed to load render.js', err);
    });
})();
