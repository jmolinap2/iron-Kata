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
- Almacenamiento en la nube para imágenes y video (con compresión/transcodificación).
- Moderación de contenido (reportes, filtro básico de abuso).
- Política de privacidad actualizada — deja de ser "los datos nunca salen del teléfono" ([BackupScreen.tsx](app/src/screens/BackupScreen.tsx) hoy lo promete así).
- Costo de hosting recurrente (hoy la app no tiene ninguno).

---

## 4. Fuera de esta fase también

Se mantiene la exclusión del documento base salvo que se indique lo contrario:

- Chat con entrenadores.
- Retos públicos / clasificaciones entre usuarios.
- Tienda y pagos.

---

## 5. Preguntas abiertas

- ¿Perfil público para cualquiera o solo visible para seguidores aceptados?
- ¿Los estados se borran solos a las 24 h o quedan guardados?
- ¿Cómo se modera contenido sensible (fotos corporales) — qué se prohíbe, quién revisa?
- ¿La cuenta/login se aprovecha para agregar sincronización en la nube del resto de los datos (rutinas, sesiones, récords), o queda aislada solo para lo social?

---

## 6. Cuándo abordarlo

La sección 15 del documento base pide que toda función nueva responda: **¿ayuda al usuario a saber qué entrenar o a completar mejor su entrenamiento?** Red social no responde eso directamente — es una capa de motivación/comunidad, no del flujo de entrenamiento. Por eso el documento base la deja fuera de la v1, y este documento queda listo para cuando se decida evaluarla como fase 2.
