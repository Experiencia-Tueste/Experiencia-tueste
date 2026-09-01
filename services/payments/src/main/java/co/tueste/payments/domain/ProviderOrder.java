package co.tueste.payments.domain;

public record ProviderOrder(
    String id,
    String externalReference,
    String status,
    String statusDetail,
    String checkoutUrl,
    String totalAmount) {}
