/**
 * Stub de `server-only` para el entorno de pruebas (vitest).
 *
 * El paquete oficial lanza una excepción si se importa fuera de un
 * Server Component; en pruebas no existe esa separación de paquetes,
 * así que vitest resuelve el alias a este módulo vacío. En producción
 * el import real sigue protegiendo la frontera cliente/servidor
 * (verificada por src/lib/config/__tests__/client-boundary.test.ts).
 */
export {};
