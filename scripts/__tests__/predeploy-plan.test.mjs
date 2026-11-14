import { describe, expect, it } from 'vitest';

import { predeploySteps } from '../lib/predeploy-plan.mjs';

describe('plan de pre-despliegue', () => {
  it('sin ADMIN_BOOTSTRAP_EMAIL solo migra', () => {
    expect(predeploySteps({})).toEqual(['scripts/migrate.mjs']);
    expect(predeploySteps({ ADMIN_BOOTSTRAP_EMAIL: '   ' })).toEqual(['scripts/migrate.mjs']);
  });

  it('con ADMIN_BOOTSTRAP_EMAIL migra y luego siembra el administrador', () => {
    expect(predeploySteps({ ADMIN_BOOTSTRAP_EMAIL: 'admin@example.com' })).toEqual([
      'scripts/migrate.mjs',
      'scripts/bootstrap-admin.mjs',
    ]);
  });
});
