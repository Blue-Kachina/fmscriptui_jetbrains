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

// Re-syncs the bundled copy of fmscriptui's render.js / filemaker-script.css from GitHub.
// No hash-pinning ceremony here (unlike a third-party CDN dependency) — this is the same
// author's own repo, fetched straight from the default branch.
tasks.register("updateFmscriptui") {
    group = "fmscriptui"
    description = "Downloads the latest render.js and filemaker-script.css from Blue-Kachina/fmscriptui"

    val webDir = layout.projectDirectory.dir("src/main/resources/web")
    val files = mapOf(
        "render.js" to "src/render.js",
        "filemaker-script.css" to "filemaker-script.css",
    )
    val baseUrl = "https://raw.githubusercontent.com/Blue-Kachina/fmscriptui/main"

    doLast {
        files.forEach { (localName, remotePath) ->
            val url = URI("$baseUrl/$remotePath").toURL()
            println("Downloading $url ...")
            val conn = url.openConnection() as HttpURLConnection
            conn.connectTimeout = 15_000
            conn.readTimeout = 15_000
            try {
                val responseCode = conn.responseCode
                if (responseCode != 200) {
                    throw GradleException("Failed to download $url — HTTP $responseCode")
                }
                val bytes = conn.inputStream.use { it.readBytes() }
                webDir.file(localName).asFile.writeBytes(bytes)
                println("Updated $localName (${bytes.size} bytes)")
            } finally {
                conn.disconnect()
            }
        }
    }
}
