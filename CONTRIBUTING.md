# Contribución al repositorio

## Reglas para el código
Para garantizar la consistencia en todo el código fuente, ten en cuenta estas reglas mientras trabajas:
- Todas las funcionalidades o bug fixes deben ser testeados uno o más specs (unit-test)
- Todos los métodos de la API deben ser documentados
- Se recomienda seguir [Guia de Estilo de Javascript de Google](https://google.github.io/styleguide/jsguide.html)

## Directrices para commits
Se tiene recomendaciones muy precisas sobre el formato de los commits de git. Esto conduce a mensajes más legibles que son fáciles de seguir cuando se mira a través del historial del proyecto.

### Formato de mensaje de commits
Cada mensaje de confirmación consta de una cabecera, un cuerpo y un pie de página. La cabecera tiene un formato especial que incluye un tipo, un ámbito y un asunto:

```
<type>[<repo>](<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```
El **encabezado** es obligatorio, el **scope** del encabezado es obligatorio con algunas excepciones.

Ninguna línea del mensaje de confirmación puede tener más de 100 caracteres. Esto permite que el mensaje sea más fácil de leer en GitHub, así como en varias herramientas git.

Ejemplos:

```
docs(readme): documenta los nuevas rutas
```
```
feat(api): agrega la funcionalida de login
```
```
fix(frontend): soluciona bug  de frontend

The version in our package.json gets copied to the one we publish, and users need the latest of these.
```

### Reversión
Si la confirmación revierte una confirmación anterior, debe comenzar con `revert: ` seguido de la cabecera de la confirmación revertida. En el cuerpo debe decir: `Esto revierte la confirmación <hash>.`, donde el hash es el SHA de la confirmación que se revierte.

### Tipos (type)
Debe ser uno de los siguientes

* **feat**: Una nueva característica.
* **fix**: Una corrección de bug.
* **docs**: Cambios solo en la documentación.
* **style**: Cambios que no afectan el significado del código (espacios en blanco, formateo, punto y coma faltante, etc.).
* **refactor**: Un cambio de código que no arregla un bug ni agrega una característica.
* **perf**: Un cambio de código que mejora el rendimiento.
* **test**: Añadir pruebas faltantes o corregir pruebas existentes.
* **chore**: Cambios a la configuración del build o herramientas auxiliares y librerías como documentación de generación.

### Scope
El scope o ámbito debe ser el nombre del módulo afectado (tal y como lo percibe la persona que lee el registro de cambios generado a partir de los git commits).

La siguiente es la lista de scope admitidos:
- frontend
- api

### Referencia para contribuciones
Mas información: 
- [Angular Commits Message Guidelines](https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines)