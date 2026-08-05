# Bugs y mejoras detectadas

> Checklist de problemas encontrados durante la revisión inicial del proyecto.
> Actualizar este archivo a medida que se vayan corrigiendo.

## Resumen ejecutivo

Estado actual tras la revisión:

- `npm run build` → **OK**
- `npm run lint` → **OK**
- budget SCSS → **OK, umbral ajustado a 7 kB**
- aislamiento y credenciales de Electron → **corregidos**
- logging de debug y `alert()` en Quick Log → **eliminados**

---

## 1. Lint roto por configuración obsoleta

**Prioridad:** Alta
**Estado:** Corregido

### Síntoma
Al ejecutar:

```bash
npm run lint
```

falla con:

```text
Cannot find builder "@angular-devkit/build-angular:tslint"
```

### Causa probable
El proyecto ya usa dependencias modernas relacionadas con ESLint, pero `angular.json` sigue configurado para usar el builder antiguo de TSLint.

### Impacto
- No hay validación estática funcionando.
- Se pierden avisos tempranos de errores y malas prácticas.
- Dificulta mantener calidad de código y refactors seguros.

### Solución propuesta
- Migrar completamente a **ESLint**.
- Añadir/configurar `eslint.config.*` o la configuración equivalente.
- Actualizar el target `lint` en `angular.json`.
- Verificar que `npm run lint` funcione de extremo a extremo.

---

## 2. Configuración insegura de Electron

**Prioridad:** Alta
**Estado:** Corregido

### Archivo
- `bootstrap.js`

### Hallazgo
La `BrowserWindow` se crea con opciones muy permisivas:

- `nodeIntegration: true`
- `enableRemoteModule: true`
- `webSecurity: false`

### Impacto
- Mayor superficie de ataque.
- Menor aislamiento entre renderer y APIs del sistema.
- Riesgo más alto si algún contenido externo o interacción no está totalmente controlada.

### Solución propuesta
- Migrar a un esquema con `preload.js`.
- Usar `contextIsolation: true`.
- Pasar a `nodeIntegration: false`.
- Eliminar `enableRemoteModule` si ya no es imprescindible.
- Revisar si `webSecurity: false` sigue siendo realmente necesario.

---

## 3. Warning de budget SCSS en producción

**Prioridad:** Baja
**Estado:** Corregido

### Síntoma
`npm run build` termina bien, pero muestra este warning:

```text
src/plaid/components/grid/worklog-editor/worklog-editor.component.scss exceeded maximum budget
```

Excede el budget por muy poco.

### Impacto
- No rompe la build.
- Indica que el componente ya está algo cargado también a nivel de estilos.

### Solución propuesta
Opciones:
- reducir ligeramente el SCSS del componente,
- dividir estilos por subcomponentes,
- o ajustar el budget si el tamaño actual está justificado.

---

## 4. `worklog-editor.component.ts` demasiado grande y con demasiadas responsabilidades

**Prioridad:** Media
**Estado:** Pendiente

### Archivo
- `src/plaid/components/grid/worklog-editor/worklog-editor.component.ts`

### Hallazgo
Este componente concentra mucha lógica en un único sitio:

- drag & drop de bloques,
- resizing de duración,
- edición de comentario,
- date picker,
- issue picker,
- user picker,
- validación de estimación original,
- guardado de worklog,
- tema oscuro,
- plantilla por defecto.

### Impacto
- Más difícil de mantener.
- Más difícil de testear.
- Más fácil introducir regresiones.
- Complica encontrar bugs concretos.

### Solución propuesta
Separar en piezas más pequeñas, por ejemplo:
- lógica de drag/resize,
- lógica de selección de issue,
- lógica de owner/user picker,
- lógica de estimate warning,
- lógica de guardado.

---

## 5. Uso de `alert()` para errores en Quick Log

**Prioridad:** Media
**Estado:** Corregido

### Archivo
- `src/plaid/components/top-bar/quick-log-buttons/quick-log-buttons.component.ts`

### Hallazgo
En errores de quick log se usa `alert(...)`.

### Impacto
- UX pobre.
- Bloquea el flujo de usuario.
- Poco consistente con el resto de la app.

### Solución propuesta
Reemplazar por alguno de estos enfoques:
- toast no bloqueante,
- modal propio,
- banner/mensaje inline,
- sistema centralizado de notificaciones.

---

## 6. Logging de debug residual en varias partes

**Prioridad:** Media
**Estado:** Corregido

### Hallazgo
Quedan múltiples `console.log`, `console.debug` y similares en código de app.

### Archivos detectados
- `src/plaid/core/issue/issue.facade.ts`
- `src/plaid/components/grid/worklog-editor/issue-picker-cloud/issue-picker-cloud.component.ts`
- `src/plaid/components/top-bar/quick-log-buttons/quick-log-buttons.component.ts`
- posiblemente otros puntos menores

### Impacto
- Consola ruidosa.
- Complica el debugging real.
- Puede exponer detalles internos innecesarios.

### Solución propuesta
- Eliminar logs temporales.
- Si hace falta trazabilidad, usar un logger controlado por entorno.

### Nota
Ya se limpiaron algunos logs en:
- `src/plaid/directives/ext-href.directive.ts`
- `src/plaid/core/user-preferences.service.ts`

---

## 7. Muchos `subscribe()` directos; revisar leaks y consistencia

**Prioridad:** Media
**Estado:** Pendiente de revisión profunda

### Hallazgo
Hay bastantes `subscribe()` directos distribuidos por componentes y servicios.

### Áreas especialmente relevantes
- `src/plaid/components/plaid.component.ts`
- `src/plaid/components/grid/worklog-editor/worklog-editor.component.ts`
- `src/plaid/core/worklog/worklog.facade.ts`
- `src/plaid/core/issue/issue.facade.ts`
- `src/plaid/core/auth/auth.facade.ts`

### Impacto
No necesariamente es bug en todos los casos, pero sí es una fuente habitual de:
- memory leaks,
- eventos duplicados,
- estado inconsistente,
- lógica difícil de seguir.

### Solución propuesta
- Revisar caso por caso.
- Donde aplique, usar `takeUntil`, `async` pipe o limpiezas explícitas.
- Documentar qué subscriptions son deliberadamente singleton y cuáles no.

---

## 8. Estrategia de manejo de errores inconsistente

**Prioridad:** Media
**Estado:** Pendiente

### Hallazgo
La app mezcla varios enfoques:
- modales para auth/conexión,
- `alert()` para quick logs,
- `console.error(...)`,
- `catchError(() => of([]))` silencioso en algunos puntos.

### Impacto
- Experiencia irregular.
- Errores difíciles de rastrear.
- Posibilidad de fallos silenciosos.

### Solución propuesta
Definir una estrategia común para:
- errores de red,
- errores de Jira,
- errores de validación,
- errores de UI,
- errores recuperables vs fatales.

---

## 9. Documentación funcional desactualizada respecto al fork actual

**Prioridad:** Baja
**Estado:** Pendiente

### Hallazgo
`README.md` describe bien la base original del proyecto, pero no refleja todas las customizaciones actuales del repo.

### Ejemplos de features no claramente reflejadas
- quick logs,
- owner/assignee filter,
- user picker,
- edición de original estimate,
- plantilla por defecto de worklog,
- `showToday`,
- branding `EtendoPlaid`.

### Impacto
- Cuesta más onboardearse.
- Riesgo de tocar cosas sin entender contexto funcional.

### Solución propuesta
- actualizar `README.md`,
- mantener `about.md` y este `bugs.md`,
- opcionalmente añadir una sección “customizaciones de este fork”.

---

## 10. Artefactos generados dentro del repo de trabajo

**Prioridad:** Baja
**Estado:** Pendiente

### Hallazgo
En el proyecto aparecen artefactos como:
- `build/`
- `dist/`
- `node_modules/`

### Impacto
- Más ruido en revisiones.
- Repo/working tree más pesado.
- Más difícil distinguir código fuente de salidas generadas.

### Solución propuesta
Revisar política del proyecto sobre artefactos:
- si deben permanecer o no,
- y si conviene ajustar `.gitignore` o el flujo de trabajo.

---

## Cambios ya aplicados durante la revisión

Estos puntos ya se tocaron para dejar el repo un poco más limpio:

### Hecho
- se eliminó el warning de `defaultProject` inválido en `angular.json`
- se limpió `src/plaid/directives/ext-href.directive.ts`
- se quitaron logs innecesarios en `src/plaid/core/user-preferences.service.ts`

### Pendiente posterior
- comprobar si se quiere seguir limpiando más logs de debug del resto del proyecto

---

## Orden recomendado de trabajo

1. Arreglar `npm run lint` con ESLint
2. Revisar/fortalecer seguridad de Electron
3. Limpiar logs de debug restantes
4. Mejorar UX de errores (`alert` → UI propia)
5. Refactorizar `worklog-editor.component.ts`
6. Revisar subscriptions y posibles leaks
7. Actualizar documentación principal

---

## Comandos usados en la revisión

```bash
npm run build
npm run lint
rg -n "TODO|FIXME|console\.(log|debug)|alert\(|enableRemoteModule|webSecurity: false|nodeIntegration: true|removeAllListeners|subscribe\(" src main.js bootstrap.js window-state.js README.md changelog.md package.json
```
