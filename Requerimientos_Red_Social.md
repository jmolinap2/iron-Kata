# Red social — alcance para una fase futura de Iron Kata

## 0. Relación con el documento base

`Requerimientos_App_Gimnasio.md`, sección 11 ("Fuera del alcance inicial"), excluye explícitamente **red social** y **clasificaciones entre usuarios** de la primera versión. Este documento no cambia esa decisión: describe cómo se vería esa función si se construye en una fase posterior, para no mezclarla con el alcance ya cerrado de la v1.

---

## 1. Objetivo

Permitir que el usuario comparta su entrenamiento y progreso físico con otras personas dentro de la app — fotos, video corto y estados temporales — más lo esperable de una red social básica.

---

## 2. Funciones incluidas

- Subir **imágenes** (progreso físico, entrenamientos, comidas).
- Subir **video** corto (ej. un levantamiento, un PR).
- Publicar **estados** temporales tipo historia (visibles por tiempo limitado, ej. 24 h).
- Perfil social: foto, nombre visible, biografía corta.
- Feed / muro con las publicaciones de las personas que el usuario sigue.
- Seguir / dejar de seguir a otros usuarios.
- Reacciones (me gusta) y comentarios en publicaciones.
- Notificaciones sociales (nuevo seguidor, comentario, reacción).

---

## 3. Cambios de arquitectura que exige

La app actual es 100 % local (SQLite, sin servidor, sin login — sección 9 del documento base). Esta función rompe esa premisa:

- Backend con autenticación de usuarios (cuentas, sesión).
- Almacenamiento en la nube para imágenes y video. **Corrección**: la compresión y la miniatura las hace **la app**, no el servidor — el hosting elegido es compartido y no permite ffmpeg. El servidor valida y rechaza lo que no cumpla.
- Moderación de contenido (reportes, filtro básico de abuso). **No es opcional**: Google Play exige, para apps con contenido de usuarios, reportar y bloquear dentro de la app como funciones separadas y claramente etiquetadas, más moderación activa. Sin eso, la app se rechaza o se baja de la tienda.
- Política de privacidad actualizada — deja de ser "los datos nunca salen del teléfono" ([BackupScreen.tsx](app/src/screens/BackupScreen.tsx) hoy lo promete así).
- **Cumplimiento de la LOPDP (Ecuador)**: las fotos de progreso corporal y el historial de entrenamiento son datos de salud, o sea datos sensibles, con consentimiento explícito y separado, derechos ARCO y notificación de brechas en 5 días hábiles.
- Costo de hosting recurrente (hoy la app no tiene ninguno).

---

## 4. Fuera de esta fase también

Se mantiene la exclusión del documento base salvo que se indique lo contrario:

- Chat con entrenadores.
- Retos públicos / clasificaciones entre usuarios.
- Tienda y pagos.

---

## 5. Preguntas abiertas — resueltas

Las cuatro quedaron respondidas al diseñar el backend. El detalle vive en `C:\Repos\IronKataSocial\documentacion\`.

| Pregunta | Respuesta |
|---|---|
| ¿Perfil público para cualquiera o solo para seguidores aceptados? | **Ambas, elegibles por el usuario.** La cuenta puede ser pública o privada, y además cada publicación tiene su propia visibilidad. **Por defecto todo nace visible solo para seguidores**; "público" es una acción deliberada. |
| ¿Los estados se borran solos a las 24 h? | **Sí**, expiran solos y su archivo se borra de verdad del almacenamiento. El autor puede borrarlos antes y ve quién los vio. |
| ¿Cómo se modera el contenido sensible? | Reportes con catálogo de motivos, **auto-ocultación al llegar a 3 reportantes distintos**, lista de términos bloqueados, y cola de revisión humana en el panel con auditoría de toda acción. Revisa el administrador del sistema. |
| ¿La cuenta se aprovecha para sincronizar el resto de los datos? | **No en la v1** — decisión tomada. Queda documentada como **fase 2**, con el modelo diseñado para que quepa después sin rehacer nada. El obstáculo real no es técnico sino de capacidad: las series de entrenamiento son la tabla que más filas genera, y el plan de hosting da 1 GB. |

---

## 6. Documentación completa

El alcance detallado —funcional y no funcional— vive en el repo del backend:

- [01 — Alcance funcional](../IronKataSocial/documentacion/01_Alcance_Funcional.md)
- [02 — Arquitectura de datos y API](../IronKataSocial/documentacion/02_Arquitectura_Datos_y_API.md)
- [03 — Seguridad, privacidad y legal](../IronKataSocial/documentacion/03_Seguridad_Privacidad_y_Legal.md)
- [04 — Operación, despliegue y capacidad](../IronKataSocial/documentacion/04_Operacion_Despliegue_y_Capacidad.md)
- [05 — Cambios en la app Iron Kata](../IronKataSocial/documentacion/05_Cambios_en_la_App_IronKata.md) ← lo que hay que construir **en este repo**

---

## 6. Cuándo abordarlo

La sección 15 del documento base pide que toda función nueva responda: **¿ayuda al usuario a saber qué entrenar o a completar mejor su entrenamiento?** Red social no responde eso directamente — es una capa de motivación/comunidad, no del flujo de entrenamiento. Por eso el documento base la deja fuera de la v1, y este documento queda listo para cuando se decida evaluarla como fase 2.
