package co.tueste.payments.domain;

import java.util.UUID;

public record CheckoutSession(UUID orderId, String status, String checkoutUrl) {}
