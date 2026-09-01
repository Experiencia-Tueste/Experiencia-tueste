import type { getDb } from './client';

/**
 * Tipo del cliente Drizzle usado por los repositorios: la instancia del
 * pool o la transacción activa (ambas exponen la misma API de consulta).
 */
type DrizzleInstance = ReturnType<typeof getDb>;
type TransactionCallback = Parameters<DrizzleInstance['transaction']>[0];

/** Instancia de Drizzle (pool) o cliente de transacción (tx). */
export type DbClient = DrizzleInstance | Parameters<TransactionCallback>[0];
