# About this project

> Leer este archivo primero cuando volvamos a trabajar en el repo.

## Resumen rápido

Este proyecto es **Plaid**, una app de escritorio hecha con **Electron + Angular** para ver y gestionar el **worklog de Jira** en formato calendario/timeline.

Originalmente el proyecto era un editor personal de worklogs de Jira, pero este repo ya tiene varias ampliaciones propias sobre la base original.

## Qué hace la app

- Login contra Jira con credenciales cifradas por Electron `safeStorage` (y `localStorage` solo en modo navegador).
- Carga los worklogs del usuario autenticado desde la API REST de Jira v3.
- Muestra los worklogs en una grilla/calendario por día.
- Permite:
  - refrescar worklogs,
  - añadir worklogs,
  - editar worklogs,
  - borrar worklogs,
  - moverlos y redimensionarlos visualmente,
  - elegir issues sugeridos o favoritos,
  - usar quick logs rápidos.

## Stack técnico

- **Frontend:** Angular 21
- **Desktop shell:** Electron 43
- **Lenguaje:** TypeScript
- **Build Angular:** `@angular-devkit/build-angular`
- **Packaging desktop:** `electron-builder`
- **Actualizaciones:** `electron-updater`

## Identidad actual del proyecto

Según `package.json`:

- paquete: `plaid`
- producto: `EtendoPlaid`
- versión: `3.2.9`
- descripción: `Personal Jira worklog editor`

Ojo: el `README.md` todavía describe bastante la app original pública, pero el repo actual incluye cambios más nuevos que no están del todo documentados ahí.

## Arquitectura general

### Entrada / arranque

- `main.js` → arranque Electron normal
- `main-dev.js` → arranque Electron en desarrollo
- `bootstrap.js` → crea una ventana aislada, configura auto-update y carga Angular mediante un preload con IPC restringido
- `window-state.js` → persiste tamaño, posición y estado maximizado de la ventana

### App Angular

- `src/main.ts` → bootstrap Angular
- `src/plaid/plaid.module.ts` → módulo principal y registro de componentes
- `src/plaid/components/plaid.component.ts` → contenedor principal de la app

### Capas principales

#### Estado / negocio

- `src/plaid/core/auth/*` → autenticación, estado auth e interceptor HTTP
- `src/plaid/core/worklog/*` → carga, alta, edición y borrado de worklogs
- `src/plaid/core/issue/*` → búsqueda de issues, favoritos y sugerencias
- `src/plaid/core/user/*` → búsqueda de usuarios Jira
- `src/plaid/core/app-state.service.ts` → estado global visible de la UI
- `src/plaid/core/user-preferences.service.ts` → preferencias persistidas en `localStorage`
- `src/plaid/core/system-preferences.service.ts` → tema oscuro/sistema
- `src/plaid/core/quick-log.service.ts` → lógica de quick logs

#### UI

- `src/plaid/components/top-bar/*` → barra superior, settings, auth, refresh, quick logs, rango de fechas, zoom
- `src/plaid/components/grid/*` → calendario, paneles de worklog, editor visual, marcador de hora actual
- `src/plaid/components/connection-issue-resolver/*` → modales de login, error y reconexión

## Flujo funcional importante

### 1. Autenticación

- El `AuthInterceptor` añade el header `Authorization` y antepone la URL base de Jira a rutas relativas.
- En Electron, las credenciales se cifran y solo el proceso principal realiza las peticiones a Jira; el renderer nunca recibe el token. En navegador se conserva el fallback de `localStorage` para desarrollo.
- Si Jira responde con 401/403 o hay error de conexión, la app abre modales de login/reconexión/error.

Archivos clave:

- `src/plaid/core/auth/auth.interceptor.ts`
- `src/plaid/core/auth/auth.facade.ts`
- `src/plaid/core/auth/auth.state.ts`
- `src/plaid/core/auth/auth.api.ts`

### 2. Carga de worklogs

- La app busca issues con worklogs del usuario en el rango visible.
- Luego trae los worklogs de cada issue.
- Finalmente filtra por autor y por fecha dentro del rango.
- Hay refresh manual y refresh periódico configurable.

Archivo clave:

- `src/plaid/core/worklog/worklog.facade.ts`

### 3. Edición visual del worklog

El editor permite:

- arrastrar el bloque para mover fecha/hora,
- cambiar duración estirando arriba/abajo,
- editar comentario,
- cambiar issue,
- asignar filtro por owner/assignee al elegir issue,
- avisar si la issue no tiene **estimación original**,
- actualizar esa estimación desde el editor.

Archivo más importante aquí:

- `src/plaid/components/grid/worklog-editor/worklog-editor.component.ts`

### 4. Sugerencias y favoritos de issues

- Si no se indica assignee, se sugieren issues del usuario actual excluyendo estados cerrados.
- Si se indica assignee, se buscan tareas asignadas a ese usuario.
- Los favoritos se guardan por URL de Jira en `localStorage`.
- Las sugerencias se agrupan por estado para mostrarlas mejor.

Archivos clave:

- `src/plaid/core/issue/issue.facade.ts`
- `src/plaid/components/grid/worklog-editor/issue-picker-cloud/issue-picker-cloud.component.ts`

### 5. Quick logs

Hay funcionalidad extra para registrar rápidamente dos tipos de anotaciones:

- **next day tasks**
- **problems**

Se configuran desde settings:

- mensaje por defecto,
- activado/desactivado,
- task code destino,
- hora por defecto.

La implementación actual crea worklogs de **1 minuto** en la tarea configurada; requiere una clave de issue Jira válida configurada.

Archivos clave:

- `src/plaid/core/quick-log.service.ts`
- `src/plaid/components/top-bar/quick-log-buttons/*`

### 6. Preferencias persistidas

Se guardan en `localStorage` cosas como:

- horario laboral,
- días visibles,
- ocultar fin de semana,
- intervalo de refresh,
- tema,
- modo `showToday`,
- favoritos,
- quick log config,
- plantilla por defecto del comentario del worklog.

Archivo clave:

- `src/plaid/core/user-preferences.service.ts`

## Cambios/customizaciones visibles en este repo

Respecto a la idea original del README, este repo ya tiene varias extensiones relevantes:

- migración/uso de **Jira REST API v3** (`/rest/api/3/...`),
- conversión de comentarios a **ADF** para Jira Cloud,
- **quick log buttons**,
- configuración de mensajes y task codes para quick logs,
- filtro por **owner/assignee** en el selector de issues,
- **user picker** para elegir usuario,
- validación y edición de **original estimate** de la issue,
- opción `showToday`,
- plantilla por defecto para comentarios de worklog,
- producto empaquetado como **EtendoPlaid**.

## Archivos especialmente importantes

Si en el futuro hay que tocar comportamiento, empezar por aquí:

- `package.json`
- `README.md`
- `src/plaid/plaid.module.ts`
- `src/plaid/components/plaid.component.ts`
- `src/plaid/core/auth/auth.interceptor.ts`
- `src/plaid/core/auth/auth.facade.ts`
- `src/plaid/core/worklog/worklog.facade.ts`
- `src/plaid/core/worklog/worklog.api.ts`
- `src/plaid/core/issue/issue.facade.ts`
- `src/plaid/core/issue/issue.api.ts`
- `src/plaid/core/user-preferences.service.ts`
- `src/plaid/core/quick-log.service.ts`
- `src/plaid/components/grid/worklog-editor/worklog-editor.component.ts`

## Comandos útiles

Instalación:

```bash
npm install
```

Angular dev server:

```bash
npm run serve-dev
```

Electron en desarrollo:

```bash
npm run start-dev
```

Build producción Angular:

```bash
npm run build
```

Ejecutar Electron con build local:

```bash
npm run start
```

Empaquetar app:

```bash
npm run package
```

Lint:

```bash
npm run lint
```

## Cosas a tener en cuenta

- El repo contiene `build/`, `dist/` y `node_modules/`, así que hay artefactos generados dentro del proyecto.
- `README.md` y `changelog.md` no reflejan necesariamente todas las customizaciones recientes.
- Hay bastante lógica apoyada en `localStorage`.
- Electron está configurado con opciones permisivas (`nodeIntegration: true`, `webSecurity: false`, `enableRemoteModule: true`), algo importante si más adelante se revisa seguridad.
- En `bootstrap.js` se elimina el header `User-Agent` por compatibilidad con Jira.
- El proyecto parece pensado principalmente para **Jira Cloud / API v3**, aunque conserva ideas heredadas de versiones anteriores.

## Estado del repo al revisar

- No vi cambios de código sin commitear aparte de `.pi/` sin trackear.
- Existe salida compilada en `build/` y paquetes en `dist/`.

## Cómo usar este archivo la próxima vez

Cuando volvamos a trabajar en este repo, conviene leer primero:

1. `about.md`
2. `package.json`
3. el/los archivos del área a tocar

Así se recupera rápido el contexto del proyecto sin volver a auditar todo desde cero.
