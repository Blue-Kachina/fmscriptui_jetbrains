package com.bluekachina.fmscriptui.markdown

import com.intellij.openapi.Disposable
import com.intellij.openapi.diagnostic.Logger
import org.intellij.plugins.markdown.extensions.MarkdownBrowserPreviewExtension
import org.intellij.plugins.markdown.ui.preview.MarkdownHtmlPanel
import org.intellij.plugins.markdown.ui.preview.PreviewStaticServer
import org.intellij.plugins.markdown.ui.preview.ResourceProvider

private val LOG = Logger.getInstance("FmScriptUi")

private const val RES_INIT_JS = "filemaker-init.js"
private const val RES_RENDER_JS = "render.js"
private const val RES_HLJS_LANGUAGE_JS = "hljs-language.js"
private const val RES_HLJS_JS = "hljs.min.js"
private const val RES_CSS = "filemaker-script.css"
private const val RES_DARK_CSS = "filemaker-script-dark.css"

private val RESOURCE_NAMES = setOf(
    RES_INIT_JS, RES_RENDER_JS, RES_HLJS_LANGUAGE_JS, RES_HLJS_JS, RES_CSS, RES_DARK_CSS,
)

private val resourceCache = mutableMapOf<String, ResourceProvider.Resource>()
private val failedResources = mutableSetOf<String>()

/**
 * Renders ```filemaker-script fenced code blocks in the Markdown preview as fmscriptui
 * accordions, with dark-theme styling and calculation syntax highlighting.
 *
 * render.js, hljs-language.js and filemaker-script.css are bundled verbatim from
 * https://github.com/Blue-Kachina/fmscriptui; hljs.min.js is a pinned highlight.js UMD
 * build from cdnjs. filemaker-init.js and filemaker-script-dark.css are the only
 * plugin-authored files, wiring the rest into the preview's lifecycle and theme.
 */
internal class FmScriptUiBrowserExtension : MarkdownBrowserPreviewExtension, ResourceProvider {

    private var serverRegistration: Disposable? = null

    init {
        try {
            serverRegistration = PreviewStaticServer.instance.registerResourceProvider(this)
        } catch (e: Exception) {
            LOG.error(
                "Failed to register fmscriptui resource provider with the Markdown preview server. " +
                    "filemaker-script fences will render as plain code blocks. This may indicate an " +
                    "incompatible Markdown plugin version.",
                e,
            )
        }
    }

    // render.js and hljs-language.js are only ever loaded via filemaker-init.js's dynamic
    // import() (see filemaker-init.js for why), but the preview's CSP script-src allowlist is
    // built purely from extensions' declared `scripts` URLs — a URL that's only reachable via
    // dynamic import is never whitelisted and gets CSP-blocked. Declaring them here gets their
    // exact URLs into the allowlist so the dynamic imports resolve to allowed URLs. It also
    // makes each load once as a plain classic <script>, which throws a harmless "Unexpected
    // token 'export'"/"'default'" (they're ES modules) — that's expected and does not affect
    // the real load via dynamic import.
    //
    // hljs.min.js is a real UMD bundle (not an ES module) and is listed before filemaker-init.js
    // so `window.hljs` exists by the time it's needed for language registration.
    override val scripts: List<String>
        get() = try {
            listOf(
                PreviewStaticServer.getStaticUrl(this, RES_HLJS_JS),
                PreviewStaticServer.getStaticUrl(this, RES_INIT_JS),
                PreviewStaticServer.getStaticUrl(this, RES_RENDER_JS),
                PreviewStaticServer.getStaticUrl(this, RES_HLJS_LANGUAGE_JS),
            )
        } catch (e: Exception) {
            LOG.error("Failed to generate script URLs for fmscriptui preview extension", e)
            emptyList()
        }

    override val styles: List<String>
        get() = try {
            listOf(
                PreviewStaticServer.getStaticUrl(this, RES_CSS),
                PreviewStaticServer.getStaticUrl(this, RES_DARK_CSS),
            )
        } catch (e: Exception) {
            LOG.error("Failed to generate style URLs for fmscriptui preview extension", e)
            emptyList()
        }

    override val resourceProvider: ResourceProvider
        get() = this

    private fun extractResourceName(resourceName: String): String? {
        val lastSegment = resourceName.substringAfterLast('/')
        return if (lastSegment in RESOURCE_NAMES) lastSegment else null
    }

    override fun canProvide(resourceName: String): Boolean {
        return extractResourceName(resourceName) != null
    }

    override fun loadResource(resourceName: String): ResourceProvider.Resource? {
        val resolved = extractResourceName(resourceName) ?: return null

        return synchronized(resourceCache) {
            if (resolved in failedResources) return null
            resourceCache[resolved] ?: run {
                val bytes = javaClass.classLoader.getResourceAsStream("web/$resolved")?.use { it.readBytes() }
                if (bytes == null) {
                    LOG.error("Resource not found: $resolved — plugin installation may be corrupted")
                    failedResources.add(resolved)
                    return null
                }
                val mimeType = when {
                    resolved.endsWith(".js") -> "application/javascript"
                    resolved.endsWith(".css") -> "text/css"
                    else -> "application/octet-stream"
                }
                ResourceProvider.Resource(bytes, mimeType).also { resourceCache[resolved] = it }
            }
        }
    }

    override fun dispose() {
        serverRegistration?.dispose()
        serverRegistration = null
    }

    class Provider : MarkdownBrowserPreviewExtension.Provider {
        override fun createBrowserExtension(panel: MarkdownHtmlPanel): MarkdownBrowserPreviewExtension {
            return FmScriptUiBrowserExtension()
        }
    }
}
