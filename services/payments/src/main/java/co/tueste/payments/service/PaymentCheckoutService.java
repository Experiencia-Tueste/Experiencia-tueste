package co.tueste.payments.service;

import co.tueste.payments.domain.CheckoutSession;
import co.tueste.payments.mercadopago.MercadoPagoClient;
import co.tueste.payments.repository.PaymentRepository;
import java.math.BigDecimal;
import java.util.Set;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@Service
public class PaymentCheckoutService {
  private static final Set<String> RETRYABLE_STATES = Set.of("draft", "failed");

  private final PaymentRepository repository;
  private final MercadoPagoClient mercadoPago;

  public PaymentCheckoutService(PaymentRepository repository, MercadoPagoClient mercadoPago) {
    this.repository = repository;
    this.mercadoPago = mercadoPago;
  }

  public CheckoutSession start(UUID orderId, Jwt jwt) {
    UUID subject = parseUuid(jwt.getSubject(), "sub");
    String claimOrderId = jwt.getClaimAsString("order_id");
    if (!orderId.toString().equals(claimOrderId)) {
      throw new AccessDeniedException("La order no corresponde al token.");
    }

    var order =
        repository
            .findOrder(orderId)
            .orElseThrow(() -> new PaymentNotFoundException("Orden no encontrada."));
    if (!order.customerUserId().equals(subject)) {
      throw new AccessDeniedException("La order no pertenece al sujeto autenticado.");
    }
    if (order.checkoutUrl() != null && !order.checkoutUrl().isBlank()) {
      return new CheckoutSession(order.id(), order.status(), order.checkoutUrl());
    }
    if (!RETRYABLE_STATES.contains(order.status())) {
      throw new PaymentConflictException("La orden ya no admite iniciar un checkout.");
    }

    String jti = jwt.getId();
    if (jti == null
        || jwt.getExpiresAt() == null
        || !repository.consumeJwt(jti, subject, orderId, jwt.getExpiresAt())) {
      throw new PaymentConflictException("El token interno ya fue utilizado.");
    }

    var providerOrder = mercadoPago.createCheckoutOrder(order);
    if (!order.id().toString().equals(providerOrder.externalReference())) {
      throw new IllegalStateException("Mercado Pago devolvio una referencia inesperada.");
    }
    verifyAmount(order.amount(), providerOrder.totalAmount());
    repository.saveProviderCheckout(orderId, providerOrder);
    return new CheckoutSession(orderId, "checkout_created", providerOrder.checkoutUrl());
  }

  private void verifyAmount(long expected, String providerAmount) {
    try {
      if (BigDecimal.valueOf(expected).compareTo(new BigDecimal(providerAmount)) != 0) {
        throw new IllegalStateException("Mercado Pago devolvio un monto inesperado.");
      }
    } catch (NumberFormatException exception) {
      throw new IllegalStateException("Mercado Pago devolvio un monto invalido.");
    }
  }

  private UUID parseUuid(String value, String claim) {
    try {
      return UUID.fromString(value);
    } catch (RuntimeException exception) {
      throw new AccessDeniedException("Claim " + claim + " invalido.");
    }
  }
}
