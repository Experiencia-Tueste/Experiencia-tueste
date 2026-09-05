<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Shared project knowledge

- For unfamiliar or cross-cutting work, first read
  `../Documentacion/recuerdos y contexto/00-Inicio/Mapa del proyecto.md`.
- Locate candidate files with
  `python3 "../Documentacion/recuerdos y contexto/_scripts/project_index.py" search "<terms>" --source tueste-app`.
- Generated notes are navigation, not authority. Verify behavior in this worktree's source and tests.
- Never read or index secrets, `.env*` except `.env.example`, dependencies, builds, or caches.
- Para tareas repartidas, usa `../tueste-agent-ops/README.md` y un contrato en `../tueste-agent-ops/tasks/`.
- Respeta el worktree, la rama y las rutas propietarias del contrato.
- Solo el orquestador reconstruye el índice mediante `../tueste-agent-ops/scripts/agent_ops.py with-lock`.
- Do not transfer conclusions from another worktree without checking branch-specific differences.
- For read-only work, report a stale index and search source directly. After implementation changes,
  rebuild it from the parent workspace with `project_index.py build`.
