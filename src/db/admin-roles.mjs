/**
 * Metadatos canónicos de los seis roles del panel — fuente única de
 * nombres y descripciones, compartida por el seed (TS) y el bootstrap
 * (Node .mjs). Las claves y capacidades viven en permissions.ts; aquí
 * solo los datos editoriales de presentación.
 */
export const ADMIN_ROLES_META = [
  {
    key: 'owner',
    name: 'Owner',
    description: 'Configuración sensible, usuarios, roles, auditoría y todos los módulos.',
  },
  {
    key: 'admin',
    name: 'Administrador',
    description: 'Operación completa de módulos autorizados y publicación de contenido.',
  },
  {
    key: 'editor',
    name: 'Editor',
    description: 'Crear, editar y preparar contenido, lanzamientos, eventos y activos.',
  },
  {
    key: 'operador',
    name: 'Operador',
    description:
      'Atender solicitudes, actualizar Tree/mercado/radio y consultar operaciones asignadas.',
  },
  {
    key: 'moderador',
    name: 'Moderador',
    description: 'Revisar y moderar comunidad.',
  },
  {
    key: 'lector',
    name: 'Lector',
    description: 'Consulta de métricas y datos explícitamente asignados.',
  },
];
