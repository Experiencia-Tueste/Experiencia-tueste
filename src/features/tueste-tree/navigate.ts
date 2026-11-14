/**
 * Navegación completa del navegador (fuera del router de Next), aislada
 * en un módulo para poder sustituirla en pruebas. Se usa para salir a la
 * tienda Tueste Co y para volver a la puerta de inicio de sesión.
 */
export function goTo(url: string): void {
  window.location.assign(url);
}
