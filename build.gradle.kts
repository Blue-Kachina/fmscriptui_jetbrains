import java.net.HttpURLConnection
import java.net.URI

plugins {
    id("org.jetbrains.kotlin.jvm") version "2.1.20"
    id("org.jetbrains.intellij.platform") version "2.10.2"
}

group = "com.bluekachina"
version = "0.1.2"

repositories {
    mavenCentral()
    intellijPlatform {
        defaultRepositories()
    }
}

dependencies {
    intellijPlatform {
        phpstorm("2025.3")
        testFramework(org.jetbrains.intellij.platform.gradle.TestFrameworkType.Platform)
        bundledPlugin("org.intellij.plugins.markdown")
    }
    testImplementation("junit:junit:4.13.2")
}

intellijPlatform {
    pluginConfiguration {
        ideaVersion {
            sinceBuild = "253"
        }

        changeNotes = """
            0.1.2: Added a proper plugin icon (light + dark variants).<br>
            0.1.1: Removed the highlight.js dependency — calculation syntax highlighting is now
            done via <a href="https://github.com/Blue-Kachina/fmscriptui">fmscriptui</a>'s own
            dependency-free tokenizer. No functional or visual change.<br>
            0.1.0: Initial release: render <code>```filemaker-script</code> fences in the Markdown
            preview using <a href="https://github.com/Blue-Kachina/fmscriptui">fmscriptui</a>.
        """.trimIndent()
    }

    signing {
        certificateChain = providers.environmentVariable("CERTIFICATE_CHAIN")
        privateKey = providers.environmentVariable("PRIVATE_KEY")
        password = providers.environmentVariable("PRIVATE_KEY_PASSWORD")
    }

    publishing {
        token = providers.environmentVariable("PUBLISH_TOKEN")
    }

    pluginVerification {
        ides {
            recommended()
        }
    }
}

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_21)
    }
}

tasks.test {
    useJUnitPlatform()
}

// Shared by the update* tasks below: downloads a URL, failing loudly (existing file
// left untouched) on a non-200 response or a suspiciously small body.
fun downloadBytes(url: String, minSizeBytes: Int = 0): ByteArray {
    println("Downloading $url ...")
    val conn = URI(url).toURL().openConnection() as HttpURLConnection
    conn.connectTimeout = 15_000
    conn.readTimeout = 15_000
    try {
        val responseCode = conn.responseCode
        if (responseCode != 200) {
            throw GradleException("Failed to download $url — HTTP $responseCode")
        }
        val bytes = conn.inputStream.use { it.readBytes() }
        if (bytes.size < minSizeBytes) {
            throw GradleException(
                "Downloaded file is suspiciously small (${bytes.size} bytes, expected >$minSizeBytes). " +
                    "The existing file has NOT been modified."
            )
        }
        return bytes
    } finally {
        conn.disconnect()
    }
}

// Re-syncs the bundled copies of fmscriptui's rendering/highlighting modules from GitHub.
// No hash-pinning ceremony here (unlike a third-party CDN dependency) — this is the same
// author's own repo, fetched straight from the default branch. No third-party JS is bundled
// at all: filemaker-highlight.js is fmscriptui's own dependency-free fallback tokenizer,
// used here instead of a real highlight.js runtime.
tasks.register("updateFmscriptui") {
    group = "fmscriptui"
    description = "Downloads the latest render.js, filemaker-highlight.js, filemaker-grammar.js, and filemaker-script.css from Blue-Kachina/fmscriptui"

    val webDir = layout.projectDirectory.dir("src/main/resources/web")
    val files = mapOf(
        "render.js" to "src/render.js",
        "filemaker-highlight.js" to "src/filemaker-highlight.js",
        "filemaker-grammar.js" to "src/filemaker-grammar.js",
        "filemaker-script.css" to "filemaker-script.css",
    )
    val baseUrl = "https://raw.githubusercontent.com/Blue-Kachina/fmscriptui/main"

    doLast {
        files.forEach { (localName, remotePath) ->
            val bytes = downloadBytes("$baseUrl/$remotePath")
            webDir.file(localName).asFile.writeBytes(bytes)
            println("Updated $localName (${bytes.size} bytes)")
        }
    }
}
