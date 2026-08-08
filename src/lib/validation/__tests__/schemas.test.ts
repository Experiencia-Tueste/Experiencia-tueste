import { describe, expect, it } from 'vitest';
import { memberRegistrationSchema } from '../schemas';

const base = {
  name: 'Ana Torres',
  email: 'ana@tueste.co',
};

describe('memberRegistrationSchema', () => {
  it('acepta un registro con consentimientos aceptados', () => {
    const result = memberRegistrationSchema.safeParse({
      ...base,
      consents: { terms: true, privacy: true },
    });
    expect(result.success).toBe(true);
  });

  it('rechaza un registro sin consentimientos', () => {
    const result = memberRegistrationSchema.safeParse(base);
    expect(result.success).toBe(false);
  });

  it('rechaza terms en false', () => {
    const result = memberRegistrationSchema.safeParse({
      ...base,
      consents: { terms: false, privacy: true },
    });
    expect(result.success).toBe(false);
  });

  it('rechaza privacy en false', () => {
    const result = memberRegistrationSchema.safeParse({
      ...base,
      consents: { terms: true, privacy: false },
    });
    expect(result.success).toBe(false);
  });

  it('rechaza consents parciales (falta privacy)', () => {
    const result = memberRegistrationSchema.safeParse({
      ...base,
      consents: { terms: true },
    });
    expect(result.success).toBe(false);
  });
});
