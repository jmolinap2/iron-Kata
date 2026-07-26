---
name: deploy-android
description: Build and deploy Iron Kata to a connected Android device (USB or wireless adb). Use when the user asks to deploy, install, push, or side-load the app to a phone/device, or to build+install a release APK.
---

# Deploy Iron Kata to an Android device

Iron Kata has exactly one deploy path: [tools/deploy.sh](../../tools/deploy.sh). It builds the release APK, verifies the package is really `com.ironkata.app` (not a stale/legacy build), installs it, pushes a copy to the phone's APK folder, and prints the installed version. Never reconstruct these steps by hand (manual `adb install` with a located `app-debug.apk`, etc.) — the script exists specifically because that was error-prone before (see [AGENTS.md](../../AGENTS.md)).

## Steps

1. Determine the target device:
   - If a device is already connected (USB, or wireless debugging already paired), no argument is needed — the script auto-detects it.
   - If deploying wirelessly to a device not yet connected, ask the user for the `ip:port` shown in the phone's "Wireless debugging" screen.
2. Run from the repo root:
   ```bash
   bash tools/deploy.sh [ip:puerto]
   ```
   (omit the argument if a device is already connected).
3. Report the script's own output back to the user — it already prints clear step markers (`==> Compilando...`, `==> Instalando...`, `==> Copiando...`, `==> Verificando versión instalada`) and the final installed `versionCode`/`versionName`.

## Exit codes to recognize

- `2` — no ADB device connected and no `ip:port` given / connection failed. Ask the user to confirm wireless debugging is on, or provide `ip:port`.
- `3` — the built APK's package name isn't `com.ironkata.app` (build picked up the wrong project). Do not retry blindly — investigate `app.json` / the build output before re-running.

## Don't

- Don't use `/mobile` or `/legacy-canvas-demo` — the script comment calls these out explicitly as discarded prototypes.
- Don't hand-write an `adb install`/`adb push` sequence — always go through this script so the package-name check and standard-named output (`Iron-Kata-v<version>.apk` at repo root) stay consistent.
