package co.tueste.payments.mercadopago;

import static org.assertj.core.api.Assertions.assertThat;

import co.tueste.payments.config.PaymentsProperties;
import org.junit.jupiter.api.Test;

class WebhookSignatureServiceTest {
  private final WebhookSignatureService service =
      new WebhookSignatureService(
          new PaymentsProperties(
              "https://api.mercadopago.com",
              "token",
              "secret",
              "",
              "https://tueste.test",
              "https://payments.test/webhooks/mercadopago",
              "issuer",
              "audience",
              "public-key"));

  @Test
  void rejectsMissingOrMalformedSignature() {
    assertThat(service.isValid(null, "request", "ORD-1")).isFalse();
    assertThat(service.isValid("not-a-signature", "request", "ORD-1")).isFalse();
  }
}
