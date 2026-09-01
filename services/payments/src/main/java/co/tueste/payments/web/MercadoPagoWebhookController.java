package co.tueste.payments.web;

import co.tueste.payments.domain.WebhookNotification;
import co.tueste.payments.mercadopago.WebhookSignatureService;
import co.tueste.payments.repository.PaymentRepository;
import co.tueste.payments.service.WebhookProcessor;
import tools.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MercadoPagoWebhookController {
  private final ObjectMapper objectMapper;
  private final WebhookSignatureService signatures;
  private final PaymentRepository repository;
  private final WebhookProcessor processor;

  public MercadoPagoWebhookController(
      ObjectMapper objectMapper,
      WebhookSignatureService signatures,
      PaymentRepository repository,
      WebhookProcessor processor) {
    this.objectMapper = objectMapper;
    this.signatures = signatures;
    this.repository = repository;
    this.processor = processor;
  }

  @PostMapping("/webhooks/mercadopago")
  ResponseEntity<Void> receive(
      @RequestHeader(name = "x-signature", required = false) String signature,
      @RequestHeader(name = "x-request-id", required = false) String requestId,
      @RequestParam(name = "data.id") String dataId,
      @RequestParam(name = "type", required = false, defaultValue = "") String queryType,
      @RequestBody String rawBody) {
    if (!signatures.isValid(signature, requestId, dataId)) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    WebhookNotification notification;
    try {
      notification = objectMapper.readValue(rawBody, WebhookNotification.class);
    } catch (Exception exception) {
      return ResponseEntity.badRequest().build();
    }
    if (notification.data() == null
        || notification.data().id() == null
        || !dataId.equals(notification.data().id())
        || !"order".equals(notification.type())
        || (!queryType.isBlank() && !"order".equals(queryType))) {
      return ResponseEntity.badRequest().build();
    }

    String eventId = notification.id();
    if (eventId == null || eventId.isBlank()) return ResponseEntity.badRequest().build();

    boolean created =
        repository.receiveWebhook(
            eventId,
            dataId,
            notification.type(),
            notification.action(),
            sha256(rawBody));
    if (created) processor.processOrderEvent(eventId, dataId);

    return ResponseEntity.ok().build();
  }

  private String sha256(String value) {
    try {
      byte[] digest =
          MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(digest);
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException("SHA-256 no esta disponible.");
    }
  }
}
