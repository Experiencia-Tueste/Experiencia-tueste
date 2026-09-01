export const PAYMENT_STATUS = {
  draft: { label: 'Preparando pago', tone: 'neutral' },
  checkout_created: { label: 'Esperando pago', tone: 'pending' },
  pending: { label: 'Pago en revisión', tone: 'pending' },
  paid: { label: 'Pago aprobado', tone: 'success' },
  failed: { label: 'Pago rechazado', tone: 'danger' },
  canceled: { label: 'Pago cancelado', tone: 'danger' },
  expired: { label: 'Pago vencido', tone: 'danger' },
  partially_refunded: { label: 'Reembolso parcial', tone: 'pending' },
  refunded: { label: 'Pago reembolsado', tone: 'neutral' },
  charged_back: { label: 'Contracargo', tone: 'danger' },
} as const;

export function paymentStatus(status: string) {
  return (
    PAYMENT_STATUS[status as keyof typeof PAYMENT_STATUS] ?? {
      label: 'Estado por confirmar',
      tone: 'neutral',
    }
  );
}
