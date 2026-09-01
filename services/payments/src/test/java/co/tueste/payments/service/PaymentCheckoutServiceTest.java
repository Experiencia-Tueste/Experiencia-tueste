package co.tueste.payments.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import co.tueste.payments.domain.CheckoutOrder;
import co.tueste.payments.domain.ProviderOrder;
import co.tueste.payments.mercadopago.MercadoPagoClient;
import co.tueste.payments.repository.PaymentRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

class PaymentCheckoutServiceTest {
  private final PaymentRepository repository = mock(PaymentRepository.class);
  private final MercadoPagoClient mercadoPago = mock(MercadoPagoClient.class);
  private final PaymentCheckoutService service = new PaymentCheckoutService(repository, mercadoPago);

  @Test
  void createsCheckoutOnlyAfterTokenAndAmountValidation() {
    UUID userId = UUID.randomUUID();
    UUID orderId = UUID.randomUUID();
    CheckoutOrder order = order(orderId, userId, 185000, "draft", null);
    ProviderOrder provider =
        new ProviderOrder("ORD-1", orderId.toString(), "created", "created", "https://mp.test", "185000.00");
    when(repository.findOrder(orderId)).thenReturn(Optional.of(order));
    when(repository.consumeJwt("jti-1", userId, orderId, Instant.ofEpochSecond(2000)))
        .thenReturn(true);
    when(mercadoPago.createCheckoutOrder(order)).thenReturn(provider);

    var session = service.start(orderId, jwt(userId, orderId));

    assertThat(session.checkoutUrl()).isEqualTo("https://mp.test");
    verify(repository).saveProviderCheckout(orderId, provider);
  }

  @Test
  void rejectsProviderAmountMismatch() {
    UUID userId = UUID.randomUUID();
    UUID orderId = UUID.randomUUID();
    CheckoutOrder order = order(orderId, userId, 185000, "draft", null);
    when(repository.findOrder(orderId)).thenReturn(Optional.of(order));
    when(repository.consumeJwt("jti-1", userId, orderId, Instant.ofEpochSecond(2000)))
        .thenReturn(true);
    when(mercadoPago.createCheckoutOrder(order))
        .thenReturn(new ProviderOrder("ORD-1", orderId.toString(), "created", "", "https://mp.test", "1.00"));

    assertThatThrownBy(() -> service.start(orderId, jwt(userId, orderId)))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("monto inesperado");
  }

  @Test
  void rejectsOrderFromAnotherSubject() {
    UUID orderId = UUID.randomUUID();
    when(repository.findOrder(orderId))
        .thenReturn(Optional.of(order(orderId, UUID.randomUUID(), 185000, "draft", null)));

    assertThatThrownBy(() -> service.start(orderId, jwt(UUID.randomUUID(), orderId)))
        .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
  }

  private CheckoutOrder order(UUID orderId, UUID userId, long amount, String status, String url) {
    return new CheckoutOrder(
        orderId, userId, "cliente@tueste.co", amount, "COP", status, UUID.randomUUID(), null, url, null, List.of());
  }

  private Jwt jwt(UUID userId, UUID orderId) {
    return new Jwt(
        "token",
        Instant.ofEpochSecond(1000),
        Instant.ofEpochSecond(2000),
        Map.of("alg", "RS256"),
        Map.of("sub", userId.toString(), "order_id", orderId.toString(), "jti", "jti-1"));
  }
}
