# Aplicación de entrenamiento personal

## 1. Objetivo

Crear una aplicación móvil sencilla que elimine la principal duda al llegar al gimnasio:

> **¿Qué me toca entrenar hoy?**

La aplicación debe revisar lo realizado durante la semana, mostrar el entrenamiento correspondiente y guiar al usuario en el orden de ejercicios.

La prioridad no es registrar la mayor cantidad de datos, sino permitir que el usuario empiece a entrenar rápidamente.

---

## 2. Principios del producto

1. **Menos es más.**
2. La acción principal debe estar visible al abrir la aplicación.
3. El usuario no debe navegar por varias pantallas para empezar.
4. Cada pantalla debe tener una acción principal clara.
5. El registro debe requerir pocos toques.
6. La aplicación debe funcionar sin conexión.
7. Alimentación, peso corporal y configuración son funciones secundarias.


---

## 3. Función principal

La pantalla de inicio debe responder inmediatamente:

- Qué grupo muscular corresponde hoy.
- Qué entrenamientos se realizaron recientemente.
- Por qué la aplicación recomienda esa rutina.
- Cuál es el primer ejercicio.

Ejemplo:

```text
Hoy te toca
Espalda + Bíceps

Esta semana:
Lunes: Pierna
Martes: Pecho + Tríceps

Primer ejercicio:
Jalón al pecho

[Comenzar entrenamiento]
```

La aplicación no debe depender únicamente de días fijos. También debe considerar el último entrenamiento completado para continuar correctamente la secuencia de la rutina.

---

## 4. Flujo principal

### 4.1 Abrir la aplicación

La aplicación muestra:

- Entrenamiento recomendado para hoy.
- Resumen corto de la semana.
- Botón **Comenzar entrenamiento**.

### 4.2 Revisar la rutina

Se muestra el orden completo de ejercicios:

1. Nombre del ejercicio.
2. Series.
3. Repeticiones objetivo.
4. Descanso.
5. Peso utilizado anteriormente, cuando exista.

### 4.3 Ejecutar un ejercicio

El usuario puede:

- Ver una demostración corta.
- Registrar peso y repeticiones.
- Completar una serie.
- Usar el temporizador de descanso.
- Continuar al siguiente ejercicio.

### 4.4 Finalizar entrenamiento

Al terminar:

- Se guarda el entrenamiento.
- Se actualiza el historial semanal.
- Se muestra un resumen breve.
- La aplicación determina cuál será el siguiente entrenamiento de la secuencia.

---

## 5. Pantallas necesarias

### 5.1 Inicio

Debe contener solamente:

- Saludo y fecha.
- Rutina recomendada para hoy.
- Últimos entrenamientos de la semana.
- Explicación corta de la recomendación.
- Botón **Comenzar entrenamiento**.
- Vista previa de los primeros ejercicios.

### 5.2 Rutina de hoy

Debe mostrar:

- Grupo muscular.
- Progreso del entrenamiento.
- Ejercicios en orden.
- Series, repeticiones y descanso.
- Último peso utilizado.
- Botón para comenzar cada ejercicio.

### 5.3 Ejercicio activo

Debe mostrar:

- Nombre del ejercicio.
- Demostración visual.
- Series completadas y pendientes.
- Peso y repeticiones.
- Temporizador de descanso.
- Botón **Completar serie**.
- Botón **Siguiente ejercicio**.

### 5.4 Progreso

Debe ser simple y contener:

- Historial semanal.
- Grupos musculares entrenados.
- Peso corporal reciente.
- Tendencia básica de progreso.

No debe convertirse en un panel analítico complejo.

### 5.5 Nutrición

Función secundaria y opcional:

- Calorías diarias.
- Proteína diaria.
- Registro simple de alimentos.

No se incluirán planes nutricionales avanzados en la primera versión.

### 5.6 Perfil y configuración

Debe contener únicamente:

- Objetivo principal.
- Nivel de experiencia.
- Días disponibles.
- Duración aproximada del entrenamiento.
- Unidades de peso.
- Tema visual.

---

## 6. Rutinas

La aplicación debe permitir:

- Usar una rutina predefinida.
- Crear una rutina personalizada.
- Ordenar ejercicios.
- Definir grupos musculares.
- Configurar series, repeticiones y descanso.
- Marcar días de descanso.
- Continuar la secuencia aunque el usuario falte uno o varios días.

Ejemplo de secuencia:

```text
Día 1: Pecho + Tríceps
Día 2: Espalda + Bíceps
Día 3: Pierna
Día 4: Hombros
Día 5: Descanso
```

Si el usuario no entrena el martes, la aplicación no debe saltar automáticamente al entrenamiento del miércoles. Debe continuar desde el siguiente entrenamiento pendiente.

---

## 7. Registro de entrenamiento

Por cada serie se guardará:

- Ejercicio.
- Número de serie.
- Peso utilizado.
- Repeticiones realizadas.
- Fecha.
- Estado completado.

El registro debe permitir reutilizar los valores de la sesión anterior para reducir la escritura manual.

---

## 8. Animaciones y demostraciones

### Ejercicios

Usar archivos locales:

- **WebP animado**, o
- **MP4 corto en bucle**.

No se utilizarán cuerpos humanos generados mediante SVG animado.

### Interfaz

- **React Native Reanimated:** transiciones, tarjetas y gestos.
- **Lottie:** estados completados, recompensas e indicadores simples.
- **React Native Skia:** gráficas, temporizadores y mapas musculares, únicamente cuando sea necesario.

Las animaciones deben ayudar a comprender una acción. No deben utilizarse como decoración excesiva.

---

## 9. Stack propuesto

### Aplicación móvil

- React Native.
- TypeScript.
- Zustand para estado local.
- SQLite para almacenamiento.
- React Navigation.
- React Native Reanimated.
- Reproductor local para WebP o MP4.

### Primera versión

- Sin servidor obligatorio.
- Sin inicio de sesión obligatorio.
- Sin sincronización en la nube.
- Datos almacenados localmente.

La arquitectura debe permitir agregar sincronización y usuarios en una fase posterior sin rehacer toda la aplicación.

---

## 10. Modelo mínimo de datos

### Rutina

- Id.
- Nombre.
- Orden dentro de la secuencia.
- Grupos musculares.
- Estado activo.

### Ejercicio

- Id.
- Nombre.
- Grupo muscular.
- Archivo de demostración.
- Instrucciones breves.

### Ejercicio de rutina

- Rutina.
- Ejercicio.
- Orden.
- Series.
- Repeticiones mínimas y máximas.
- Descanso.

### Sesión de entrenamiento

- Fecha de inicio.
- Fecha de finalización.
- Rutina realizada.
- Estado.

### Serie realizada

- Ejercicio.
- Número de serie.
- Peso.
- Repeticiones.
- Estado.

### Peso corporal

- Fecha.
- Peso.

---

## 11. Fuera del alcance inicial

No se incluirá inicialmente:

- Inteligencia artificial generativa.
- Red social.
- Chat con entrenadores.
- Tienda.
- Pagos.
- Retos públicos.
- Clasificaciones entre usuarios.
- Integración con relojes inteligentes.
- Escáner de alimentos.
- Planes nutricionales médicos.
- Paneles estadísticos complejos.
- Editor avanzado de animaciones.

Estas funciones solo se evaluarán después de validar que el flujo principal funciona correctamente.

---

## 12. Requisitos no funcionales

- Inicio rápido.
- Funcionamiento sin conexión.
- Interfaz fluida.
- Información legible durante el entrenamiento.
- Botones grandes y accesibles.
- Persistencia segura de datos locales.
- Compatibilidad inicial con Android.
- Código modular y mantenible.
- Sin dependencias innecesarias.

---

## 13. Criterios de aceptación

La primera versión será funcional cuando el usuario pueda:

1. Configurar o seleccionar una rutina.
2. Abrir la aplicación y saber qué le toca entrenar.
3. Revisar lo realizado durante la semana.
4. Iniciar la rutina recomendada.
5. Ver los ejercicios en orden.
6. Consultar una demostración del ejercicio.
7. Registrar peso y repeticiones.
8. Completar series y descansos.
9. Finalizar el entrenamiento.
10. Volver otro día y continuar la secuencia correcta.

El objetivo se considera cumplido cuando el usuario puede llegar al gimnasio, abrir la aplicación y comenzar su entrenamiento sin tratar de recordar qué hizo anteriormente.

---

## 14. Entregables

### Producto

- Aplicación Android instalable.
- Navegación completa del flujo principal.
- Base de datos local.
- Rutinas predefinidas básicas.
- Creación y edición simple de rutinas.
- Registro de series y entrenamientos.
- Historial semanal.
- Temporizador de descanso.
- Demostraciones visuales locales.
- Registro básico de peso corporal.

### Diseño

- Diseño de las pantallas principales.
- Componentes reutilizables.
- Tema oscuro inicial.
- Estados vacíos, carga y errores.
- Guía básica de tipografía, espaciado y componentes.

### Desarrollo

- Código fuente organizado por módulos.
- Configuración de compilación Android.
- Script o migraciones de SQLite.
- Datos iniciales de ejercicios y rutinas.
- Pruebas de las reglas principales.
- Documento breve de instalación y ejecución.

---

## 15. Prioridad de implementación

1. Determinar qué entrenamiento corresponde hoy.
2. Mostrar historial reciente.
3. Ejecutar y registrar una rutina.
4. Guardar el progreso localmente.
5. Mostrar demostraciones de ejercicios.
6. Añadir progreso corporal básico.
7. Añadir nutrición simple.
8. Añadir personalización visual.

Toda nueva función debe responder esta pregunta:

> **¿Ayuda al usuario a saber qué entrenar o a completar mejor su entrenamiento?**

Si la respuesta es no, no debe añadirse a la primera versión.
