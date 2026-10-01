# 📱 SonarVision Mobile Workspace

This folder acts as the standalone compilation wrapper layer for packaging the core React web application environment targets into native mobile platform packages utilizing **Capacitor**.

## 📁 Repository Workspace Layout
*   `android/` - The compiled native Android Studio structural layout assets wrapper.
*   `ios/` - The compiled native Apple Xcode environment assets wrapper.
*   `capacitor.config.json` - The architectural engine routing configurations.

## 🚀 Native Compilation Operations Pipeline

Because this workspace is part of a monorepo structure, web assets must be compiled prior to platform synchronization layers.

### 1. Rebuild Core Web Components
Always run production compilation tasks inside the frontend root before synchronization:
```bash
cd ../web && npm run build
```

### 2. Synchronize Assets
If the standard `npx cap` alias command lookup exceptions block your terminal pipeline, execute paths directly:
```bash
cd ../mobile
./node_modules/.bin/cap sync android
```

### 🐳 3. Local Container Build Engine (Recommended for Linux/Kali Environment)
To compile native packages locally without messing up system Java SDK paths, execute containerized tasks from the main project root:
```bash
cd ../..
docker build --no-cache -t sonarvision-android-builder -f Dockerfile.android .
docker run --name sv-build-run sonarvision-android-builder
docker cp sv-build-run:/workspace/Apps/mobile/android/app/build/outputs/apk/release/app-release-unsigned.apk ./sonarvision-release.apk
docker rm sv-build-run
```
