package co.tueste.payments.mercadopago;

import static org.assertj.core.api.Assertions.assertThat;

import co.tueste.payments.config.PaymentsProperties;
import co.tueste.payments.domain.CheckoutOrder;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

class MercadoPagoClientTest {

  @Test
  void usesSyntheticPayerOnlyWhenTestModeIsConfigured() {
    var order = order("cliente@tueste.co");

    assertThat(client("test_payer_1@testuser.com").payerEmail(order))
        .isEqualTo("test_payer_1@testuser.com");
    assertThat(client("").payerEmail(order)).isEqualTo("cliente@tueste.co");
  }

  private MercadoPagoClient client(String testPayerEmail) {
    var properties =
        new PaymentsProperties(
            "https://api.mercadopago.com",
            "token",
            "secret",
            testPayerEmail,
            "https://tueste.test",
            "https://payments.test/webhooks/mercadopago",
            "issuer",
            "audience",
            "public-key");
    return new MercadoPagoClient(RestClient.builder(), properties);
  }

  private CheckoutOrder order(String email) {
    return new CheckoutOrder(
        UUID.randomUUID(),
        UUID.randomUUID(),
        email,
        72000,
        "COP",
        "draft",
        UUID.randomUUID(),
        null,
        null,
        null,
        List.of());
  }
}
