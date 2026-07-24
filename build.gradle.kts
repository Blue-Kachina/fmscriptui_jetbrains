import java.net.HttpURLConnection
import java.net.URI

plugins {
    id("org.jetbrains.kotlin.jvm") version "2.1.20"
    id("org.jetbrains.intellij.platform") version "2.10.2"
}

group = "com.bluekachina"
version = "0.1.0"

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
            Initial release: render <code>```filemaker-script</code> fences in the Markdown preview
            using <a href="https://github.com/Blue-Kachina/fmscriptui">fmscriptui</a>.
        """.trimIndent()
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

// Re-syncs the bundled copy of fmscriptui's render.js / filemaker-script.css from GitHub.
// No hash-pinning ceremony here (unlike a third-party CDN dependency) — this is the same
// author's own repo, fetched straight from the default branch.
tasks.register("updateFmscriptui") {
    group = "fmscriptui"
    description = "Downloads the latest render.js and filemaker-script.css from Blue-Kachina/fmscriptui"

    val webDir = layout.projectDirectory.dir("src/main/resources/web")
    val files = mapOf(
        "render.js" to "src/render.js",
        "hljs-language.js" to "src/hljs-language.js",
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

// Re-fetches the pinned highlight.js UMD build from cdnjs (a genuine third-party
// dependency, unlike fmscriptui above) — bump hljsVersion and re-run to upgrade.
val hljsVersion = "11.11.1"

tasks.register("updateHighlightJs") {
    group = "fmscriptui"
    description = "Downloads highlight.js v$hljsVersion (UMD build) from cdnjs"

    val targetFile = layout.projectDirectory.file("src/main/resources/web/hljs.min.js")
    val url = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/$hljsVersion/highlight.min.js"

    doLast {
        val bytes = downloadBytes(url, minSizeBytes = 50_000)
        targetFile.asFile.writeBytes(bytes)
        println("Updated hljs.min.js to v$hljsVersion (${bytes.size / 1024} KB)")
    }
}
