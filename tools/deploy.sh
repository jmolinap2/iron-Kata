#!/usr/bin/env bash
# Despliega exclusivamente la aplicación oficial de Iron Kata.
# Nunca usa /mobile ni /legacy-canvas-demo: ambos son prototipos descartados.
# Uso: tools/deploy.sh [ip:puerto-de-depuracion-inalambrica]

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$ROOT/app"
ADB="${ADB:-/c/Android/Sdk/platform-tools/adb.exe}"
AAPT="${AAPT:-/c/Android/Sdk/build-tools/36.0.0/aapt.exe}"
DEVICE="${1:-}"

if [[ -n "$DEVICE" ]]; then
  "$ADB" connect "$DEVICE" >/dev/null || true
fi

if [[ -z "$DEVICE" ]]; then
  DEVICE="$($ADB devices | awk '$2 == "device" { print $1; exit }')"
fi

if [[ -z "$DEVICE" ]]; then
  echo "No hay un dispositivo ADB conectado. Indica ip:puerto o activa la depuración inalámbrica." >&2
  exit 2
fi

cd "$APP_DIR"
echo "==> Compilando la app oficial React Native"
pnpm build:apk

VERSION="$(node -p "require('./app.json').expo.version")"
SOURCE_APK="$APP_DIR/android/app/build/outputs/apk/release/app-release.apk"
OFFICIAL_APK="$ROOT/Iron-Kata-OFICIAL-v${VERSION}.apk"
PHONE_DEST="/sdcard/APK'S - DESARROLLOS/Iron-Kata-v${VERSION}.apk"
#prefiero un nombre estandar
cp -f "$SOURCE_APK" "$OFFICIAL_APK"

if ! "$AAPT" dump badging "$OFFICIAL_APK" | grep -q "package: name='com.ironkata.app'"; then
  echo "La compilación no corresponde al paquete oficial com.ironkata.app." >&2
  exit 3
fi

echo "==> Instalando Iron Kata $VERSION en $DEVICE"
"$ADB" -s "$DEVICE" install --streaming -r "$OFFICIAL_APK"

echo "==> Copiando la APK oficial al teléfono"
"$ADB" -s "$DEVICE" push "$OFFICIAL_APK" "$PHONE_DEST"

echo "==> Verificando versión instalada"
"$ADB" -s "$DEVICE" shell dumpsys package com.ironkata.app | grep -E 'versionCode=|versionName='
echo "==> Despliegue oficial completado: $OFFICIAL_APK"
