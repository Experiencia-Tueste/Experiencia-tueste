import { z } from 'zod';

export const checkoutRequestSchema = z.object({
  clientRequestId: z.string().uuid(),
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1).max(80),
        qty: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(30),
  note: z.string().trim().max(280).optional(),
});

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
