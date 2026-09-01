package co.tueste.payments.domain;

public record CheckoutOrderItem(
    String productId, String title, long unitPrice, int quantity, long totalAmount) {}
