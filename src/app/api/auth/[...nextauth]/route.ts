import { handlers } from '@/auth';

/**
 * Route handler de Auth.js (App Router). El secret de Google vive solo
 * en el servidor: nunca viaja al bundle cliente.
 */
export const { GET, POST } = handlers;
