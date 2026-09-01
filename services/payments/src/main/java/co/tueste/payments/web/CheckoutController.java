package co.tueste.payments.web;

import co.tueste.payments.domain.CheckoutSession;
import co.tueste.payments.service.PaymentCheckoutService;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/v1/checkout")
public class CheckoutController {
  private final PaymentCheckoutService service;

  public CheckoutController(PaymentCheckoutService service) {
    this.service = service;
  }

  @PostMapping("/orders/{orderId}")
  @PreAuthorize("hasAuthority('SCOPE_payments:create')")
  CheckoutSession startCheckout(
      @PathVariable UUID orderId, @AuthenticationPrincipal Jwt principal) {
    return service.start(orderId, principal);
  }
}
