package co.tueste.payments.domain;

public record WebhookNotification(String id, String action, String type, WebhookData data) {
  public record WebhookData(String id) {}
}
