package co.tueste.payments.mercadopago;

public class MercadoPagoException extends RuntimeException {
  private final int providerStatus;

  public MercadoPagoException(String message, int providerStatus) {
    super(message);
    this.providerStatus = providerStatus;
  }

  public int providerStatus() {
    return providerStatus;
  }
}
