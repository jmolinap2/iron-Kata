# Entrega oficial de Iron Kata

- El único producto vigente está en `app/`.
- El APK release no se versiona en el repositorio; se genera localmente con `pnpm build:apk`, con paquete Android `com.ironkata.app`.
- Antes de instalar una APK, verificar el paquete con `aapt dump badging` y comprobar que sea `com.ironkata.app`.
- Para despliegue inalámbrico usar `tools/deploy.sh`; no seleccionar archivos `app-debug.apk` de forma recursiva.
