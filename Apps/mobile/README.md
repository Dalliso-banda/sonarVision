# 📱 SonarVision Mobile Workspace

This folder acts as the isolated native compilation layer for packaging the core React web application components into mobile targets utilizing **Capacitor**.

## 📁 Workspace Layout
*   `android/` - The compiled native Android Studio structural shell environment.
*   `ios/` - The compiled native Apple Xcode environment assets directory.
*   `capacitor.config.json` - The architectural engine routing parameters.

---

## 🚀 Daily Development Workflow

Because this project uses a monorepo workspace structure, you must compile your frontend web components before syncing changes into the mobile shell.

### 1. Rebuild the React Frontend
Run the production compiler inside the web application directory:
```bash
cd ../web && npm run build
```

### 2. Synchronize Assets Locally
Since standard global `npx cap` routing triggers workspace configuration checks that can block execution, sync the static assets to the native Android folder by executing the local script binary directly:
```bash
cd ../mobile
./node_modules/.bin/cap sync android
```

---

## 🐳 Production Compilation (Docker Workspace Container)

To completely bypass local Java version compatibility blocks (such as major version 69 errors from Java 25) and avoid polluting your host environment, compile your final Android binary inside the isolated Docker engine.

Execute these commands from your **main project root directory** (`~/sonarVision`):

```bash
# 1. Mount the local Gradle cache to prevent redundant distribution downloads
docker run --name sv-build-run \
  -v "$HOME/.gradle:/root/.gradle" \
  sonarvision-android-builder

# 2. Extract the compiled binary package out to your host computer
docker cp sv-build-run:/workspace/Apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk ./sonarvision-debug.apk

# 3. Clean up the container execution snapshot layer
docker rm sv-build-run
```
Your runnable application package file (`sonarvision-debug.apk`) will be output cleanly to your root repository folder.
