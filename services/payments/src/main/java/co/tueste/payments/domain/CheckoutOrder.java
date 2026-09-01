package co.tueste.payments.domain;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record CheckoutOrder(
    UUID id,
    UUID customerUserId,
    String customerEmail,
    long amount,
    String currency,
    String status,
    UUID idempotencyKey,
    String providerOrderId,
    String checkoutUrl,
    OffsetDateTime expiresAt,
    List<CheckoutOrderItem> items) {}
