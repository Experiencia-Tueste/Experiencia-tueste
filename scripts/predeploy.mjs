#!/usr/bin/env node
/**
 * Pre-despliegue en un solo comando (`node scripts/predeploy.mjs`).
 * ---------------------------------------------------------------------
 * En Railway, encadenar dos comandos con `&&` en el `preDeployCommand` no
 * ejecutó el segundo (comprobado en staging el 2026-11-14), así que el
 * encadenado vive aquí y no depende de un shell. Ejecuta los pasos de
 * `predeploySteps` en orden, cada uno en su propio proceso de Node, y
 * corta al primer fallo para que el despliegue no quede en vivo a medias.
 *
 * Nunca imprime variables de entorno ni secretos.
 */
import { spawnSync } from 'node:child_process';

import { predeploySteps } from './lib/predeploy-plan.mjs';

for (const step of predeploySteps(process.env)) {
  console.log(`[predeploy] ${step}`);
  const result = spawnSync(process.execPath, [step], { stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`[predeploy] falló ${step} (código ${result.status ?? 'sin código'}).`);
    process.exit(result.status ?? 1);
  }
}
console.log('[predeploy] listo.');
