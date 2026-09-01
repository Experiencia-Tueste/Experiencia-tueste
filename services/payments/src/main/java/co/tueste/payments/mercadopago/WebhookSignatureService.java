package co.tueste.payments.mercadopago;

import co.tueste.payments.config.PaymentsProperties;
import com.mercadopago.exceptions.MPInvalidWebhookSignatureException;
import com.mercadopago.webhook.WebhookSignatureValidator;
import org.springframework.stereotype.Component;

@Component
public class WebhookSignatureService {
  private final String secret;

  public WebhookSignatureService(PaymentsProperties properties) {
    this.secret = properties.mercadoPagoWebhookSecret();
  }

  public boolean isValid(String signature, String requestId, String dataId) {
    if (signature == null || requestId == null || dataId == null) return false;
    try {
      WebhookSignatureValidator.validate(signature, requestId, dataId, secret);
      return true;
    } catch (MPInvalidWebhookSignatureException | IllegalArgumentException exception) {
      return false;
    }
  }
}
