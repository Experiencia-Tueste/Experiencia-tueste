import { describe, expect, it } from 'vitest';
import { customerCredentialsSchema } from '../schemas';

describe('credenciales de clientes', () => {
  it('acepta correo normalizado y contraseña de ocho caracteres', () => {
    const result = customerCredentialsSchema.parse({
      email: '  persona@tueste.co ',
      password: '12345678',
    });
    expect(result.email).toBe('persona@tueste.co');
  });

  it('rechaza correos inválidos y contraseñas cortas', () => {
    expect(customerCredentialsSchema.safeParse({ email: 'no', password: '123' }).success).toBe(
      false,
    );
  });
});
