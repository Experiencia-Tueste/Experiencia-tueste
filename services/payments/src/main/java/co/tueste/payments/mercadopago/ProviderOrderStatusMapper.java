package co.tueste.payments.mercadopago;

import org.springframework.stereotype.Component;

@Component
public class ProviderOrderStatusMapper {

  public String toInternalStatus(String status, String detail) {
    if ("processed".equals(status) && "accredited".equals(detail)) return "paid";
    if ("processed".equals(status) && "partially_refunded".equals(detail)) {
      return "partially_refunded";
    }
    return switch (status) {
      case "created" -> "checkout_created";
      case "processing", "action_required" -> "pending";
      case "canceled" -> "canceled";
      case "expired" -> "expired";
      case "refunded" -> "refunded";
      case "charged_back" -> "charged_back";
      case "failed" -> "failed";
      default -> "pending";
    };
  }
}
