/**
 * Plan del pre-despliegue: qué scripts corren, en orden, antes de que un
 * despliegue quede en vivo. Lógica pura para poder probarla sin procesos.
 *
 * - Las migraciones corren siempre.
 * - El bootstrap del panel (roles + primer administrador) corre solo si
 *   `ADMIN_BOOTSTRAP_EMAIL` está definida: es idempotente, pero exige ese
 *   correo y no debe romper el despliegue de un entorno que no lo define.
 *
 * @param {Record<string, string | undefined>} env
 * @returns {string[]} rutas de scripts relativas a la raíz de la app
 */
export function predeploySteps(env) {
  const steps = ['scripts/migrate.mjs'];
  if ((env.ADMIN_BOOTSTRAP_EMAIL ?? '').trim() !== '') {
    steps.push('scripts/bootstrap-admin.mjs');
  }
  return steps;
}
