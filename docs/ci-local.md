# CI local temporal — verificación manual de calidad

## Propósito y carácter temporal

El repositorio es privado y la cuenta de GitHub tiene **GitHub Actions
bloqueado por facturación**: el workflow `CI` falla antes de iniciar el
runner (no por el código). Mientras se resuelve ese bloqueo externo, la
verificación de calidad se ejecuta **localmente** con un único comando.

Este proceso es **temporal y documentado**: el workflow original no se
borra, solo se mueve fuera de `.github/workflows/` para que GitHub no lo
ejecute (`.github/workflows-disabled/ci.yml.disabled`). Se restaurará
cuando Actions vuelva a estar disponible.

## Requisito previo

Tras un clon limpio o un cambio de dependencias, instalar exactamente el
árbol de `package-lock.json`:

```bash
npm ci
```

## Comando obligatorio

```bash
npm run verify
```

Encadena, en orden, los cinco pasos de calidad (detiene al primer fallo):

| Paso      | Comando                | Qué valida                                    |
| --------- | ---------------------- | --------------------------------------------- |
| Lint      | `npm run lint`         | Reglas de estilo y buenas prácticas de ESLint |
| Formato   | `npm run format:check` | Prettier: todo el código formateado           |
| Typecheck | `npm run typecheck`    | TypeScript sin errores (`tsc --noEmit`)       |
| Tests     | `npm test`             | Suite de Vitest completa (jsdom + node)       |
| Build     | `npm run build`        | Build de producción de Next.js (SSR/SSG)      |

## Protocolo antes de fusionar a `main`

1. Partir de `develop` limpio (`git status` sin cambios pendientes).
2. Ejecutar `npm run verify` — debe terminar en verde.
3. Registrar **fecha, commit SHA y resultado** en la descripción o un
   comentario del Pull Request.
4. Revisar visualmente la experiencia (hero, Barista, Origen,
   Lanzamientos, Tienda, Mercado, modo día/noche, 375 px).
5. Solo entonces aprobar y fusionar el PR.

> El hosting futuro será **Latinoamérica Hosting H1**. H1 es el hosting
> de despliegue, no un reemplazo automático del CI: la verificación
> seguirá siendo `npm run verify` (local o en el CI cuando se reactive).

## Cómo reactivar GitHub Actions

Cuando el bloqueo de facturación esté resuelto:

1. Mover el archivo de vuelta:
   `git mv .github/workflows-disabled/ci.yml.disabled .github/workflows/ci.yml`
2. Eliminar la nota temporal del inicio del archivo (los comentarios
   «CI LOCAL TEMPORAL — WORKFLOW DESACTIVADO»).
3. Reactivar el workflow que fue desactivado manualmente (mover el
   archivo no basta: si el workflow sigue en estado `disabled_manually`,
   GitHub no lo ejecutará aunque vuelva a estar en
   `.github/workflows/ci.yml`):

   ```bash
   gh workflow enable CI --repo tovarsantiagopalacio-debug/Tueste.web
   ```

4. Commitear y subir a `develop`.
5. Confirmar que los checks del PR vuelven a ejecutarse y quedan **en
   verde** antes de fusionar.

No inventar resultados ni fechas: cada verificación registrada debe ser
la ejecución real del comando.
