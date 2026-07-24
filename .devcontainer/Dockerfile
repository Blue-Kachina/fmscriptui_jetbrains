# JDK 21 matches the toolchain required by build.gradle.kts (the IntelliJ Platform Gradle
# plugin needs plugins built with Java 21). The Gradle version itself is not baked into
# the image on purpose - the wrapper (./gradlew) downloads whatever distribution is
# pinned in gradle/wrapper/gradle-wrapper.properties on first run.
#
# To test against a different Gradle version without touching the committed wrapper
# properties, regenerate the wrapper for a one-off run and then restore it:
#   ./gradlew wrapper --gradle-version=8.11 && ./gradlew build
#   git checkout -- gradle/wrapper/ gradlew gradlew.bat
# Each version's distribution is cached in the GRADLE_USER_HOME volume (see
# devcontainer.json), so re-testing an already-downloaded version is fast.
FROM eclipse-temurin:21-jdk-jammy

# git is needed to restore gradle/wrapper/* after a one-off version switch (see the
# wrapper-switching instructions above) - the base image doesn't include it.
RUN apt-get update && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --shell /bin/bash gradle

ENV GRADLE_USER_HOME=/home/gradle/.gradle

# Pre-create and own the cache dir as root so Docker copies this ownership when it
# initializes the (empty) named volume mounted here at container start - otherwise
# the volume comes up root-owned and the gradle user below can't write to it.
RUN mkdir -p "$GRADLE_USER_HOME" && chown gradle:gradle "$GRADLE_USER_HOME"

USER gradle
WORKDIR /workspace
