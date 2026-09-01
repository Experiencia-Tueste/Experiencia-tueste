import { z } from 'zod';

export const customerCredentialsSchema = z.object({
  email: z.string().trim().email('Escribe un correo válido.').max(254),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(128),
});

export type CustomerCredentials = z.infer<typeof customerCredentialsSchema>;
