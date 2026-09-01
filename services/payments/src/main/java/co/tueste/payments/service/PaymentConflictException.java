package co.tueste.payments.service;

public class PaymentConflictException extends RuntimeException {
  public PaymentConflictException(String message) {
    super(message);
  }
}
