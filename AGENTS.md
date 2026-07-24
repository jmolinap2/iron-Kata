# Entrega oficial de Iron Kata

- El único producto vigente está en `app/`.
- `mobile/` y `legacy-canvas-demo/` son prototipos descartados: nunca se deben compilar, instalar ni copiar al teléfono.
- La única APK entregable es `Iron-Kata-OFICIAL-v<versión>.apk`, con paquete Android `com.ironkata.app`.
- Antes de instalar una APK, verificar el paquete con `aapt dump badging` y comprobar que sea `com.ironkata.app`.
- Para despliegue inalámbrico usar `tools/deploy.sh`; no seleccionar archivos `app-debug.apk` de forma recursiva.
