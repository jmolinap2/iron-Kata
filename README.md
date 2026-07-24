# Iron Kata

Aplicación Android offline enfocada en responder una sola pregunta al abrirla: **¿qué me toca entrenar hoy?** La implementación vigente está en [`app/`](app/). `mobile/` y `legacy-canvas-demo/` son prototipos heredados descartados y no forman parte del APK entregado.

## Producto implementado

- Inicio directo con rutina recomendada, historial semanal, explicación y primer ejercicio.
- Secuencia real de rutinas que avanza por el último entrenamiento completado, aunque se falte uno o varios días.
- Días de descanso dentro de la secuencia y entrenamientos rápidos que no alteran esa secuencia.
- Rutinas predefinidas y editor simple de rutinas personalizadas.
- Ejecución serie por serie con peso, repeticiones, valores previos y temporizador basado en una hora de finalización persistida.
- Doce demostraciones fotográficas WebP animadas, locales y en bucle.
- Resumen final con celebración Lottie, récords personales y estimación 1RM mediante Epley.
- Historial, volumen por grupo muscular, peso corporal y tendencia básica.
- Nutrición opcional con calorías, proteína y alimentos.
- Importación y exportación de respaldos JSON.
- Persistencia SQLite local, sin cuenta, servidor ni conexión obligatoria.

## Stack

React Native 0.86, Expo SDK 57, TypeScript, Zustand, SQLite, React Navigation, Reanimated, Lottie y Expo Image. El diseño usa fondo negro/carbón, tarjetas oscuras y acento verde lima conforme a las referencias de [`img/`](img/).

## Desarrollo

Se utiliza exclusivamente pnpm:

```powershell
cd C:\Repos\iron-Kata\app
pnpm install
pnpm typecheck
pnpm test
pnpm start
```

Para regenerar el proyecto Android y compilar localmente:

```powershell
pnpm prebuild:android
pnpm build:apk
```

El SDK Android debe estar disponible mediante `ANDROID_HOME` o `app/android/local.properties`. El APK de Gradle se genera en `app/android/app/build/outputs/apk/release/app-release.apk`.

## APK entregado

Instala únicamente [`Iron-Kata-OFICIAL-v1.0.4.apk`](Iron-Kata-OFICIAL-v1.0.4.apk). Es la única APK entregable del repositorio.

- Paquete Android: `com.ironkata.app`
- Versión: `1.0.4` (`versionCode` 5)
- SHA-256: `39D05CBF8783380724FEE7EA4524AEEFCF32300E16AE44A185E6C21786965C62`
- Android mínimo: 7.0 (API 24)

No instalar APKs bajo `mobile/`, `legacy-canvas-demo/` ni variantes `app-debug.apk`: son prototipos descartados y pueden aparecer con el mismo nombre visual de la aplicación.

Para desplegar por depuración inalámbrica usa `tools/deploy.sh`. El script compila únicamente `app/`, comprueba que el paquete sea `com.ironkata.app` y luego instala/copia la APK oficial.

## Transferencia MTP

`tools/deploy-mtp.ps1` usa Windows Shell COM y debe ejecutarse con Windows PowerShell clásico en apartamento STA. No utiliza ADB:

```powershell
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -NoProfile -Sta -ExecutionPolicy Bypass -File C:\Repos\iron-Kata\tools\deploy-mtp.ps1 -SourceApk C:\Repos\iron-Kata\Iron-Kata-OFICIAL-v1.0.4.apk
```

El script navega `Este equipo` como namespace Shell, elimina APK anteriores de Iron Kata, copia de forma asíncrona y verifica nombre, tipo y tamaño expuestos por MTP.
