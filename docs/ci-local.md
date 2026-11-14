# Verificación de calidad y flujo de ramas

> Este archivo conserva su nombre por los enlaces existentes. El «CI local
> temporal» que describía terminó: GitHub Actions volvió a estar activo el
> 2026-11-13 (`.github/workflows/ci.yml`).

## Comando único

Tras un clon limpio o un cambio de dependencias, instalar exactamente el
árbol de `package-lock.json`:

```bash
npm ci
```

Después, en local y en CI se ejecuta lo mismo:

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

## CI en GitHub Actions

El workflow `CI` corre `npm run verify` en cada Pull Request y deja el
check `validate`. `main` y `staging` están protegidas: no aceptan commits
directos y exigen ese check en verde, también para administradores.

## Flujo de ramas

1. Trabajar en una rama `feat/` o `fix/` creada desde `staging`.
2. `npm run verify` en verde antes de subir.
3. Pull Request a `staging`; esperar el check `validate`.
4. Tras el merge, verificar el cambio en staging desplegado (flujo real,
   no solo que compile).
5. Pull Request de `staging` a `main`. `main` es producción.

No inventar resultados ni fechas: cada verificación registrada debe ser
la ejecución real del comando.
