package co.tueste.payments.mercadopago;

import co.tueste.payments.config.PaymentsProperties;
import co.tueste.payments.domain.CheckoutOrder;
import co.tueste.payments.domain.CheckoutOrderItem;
import co.tueste.payments.domain.ProviderOrder;
import tools.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Component
public class MercadoPagoClient {
  private final RestClient client;
  private final PaymentsProperties properties;

  public MercadoPagoClient(RestClient.Builder builder, PaymentsProperties properties) {
    this.properties = properties;
    this.client =
        builder
            .baseUrl(properties.mercadoPagoApiUrl())
            .defaultHeader("Authorization", "Bearer " + properties.mercadoPagoAccessToken())
            .defaultHeader("Accept", MediaType.APPLICATION_JSON_VALUE)
            .build();
  }

  public ProviderOrder createCheckoutOrder(CheckoutOrder order) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("type", "online");
    body.put("processing_mode", "manual");
    body.put("capture_mode", "automatic_async");
    body.put("total_amount", amount(order.amount()));
    body.put("external_reference", order.id().toString());
    body.put("description", "Pedido Tueste " + order.id());
    body.put("expiration_time", "P1D");
    body.put("payer", Map.of("email", payerEmail(order)));
    body.put("items", order.items().stream().map(this::itemBody).toList());
    body.put(
        "config",
        Map.of(
            "notification_url", properties.notificationUrl(),
            "online",
                Map.of(
                    "success_url", resultUrl(order, "success"),
                    "failure_url", resultUrl(order, "failure"),
                    "pending_url", resultUrl(order, "pending"),
                    "auto_return", "approved")));

    try {
      JsonNode response =
          client
              .post()
              .uri("/v1/orders")
              .contentType(MediaType.APPLICATION_JSON)
              .header("X-Idempotency-Key", order.idempotencyKey().toString())
              .body(body)
              .retrieve()
              .body(JsonNode.class);
      return parseOrder(response, true);
    } catch (RestClientResponseException exception) {
      throw new MercadoPagoException(
          "Mercado Pago rechazo la creacion de la order.", exception.getStatusCode().value());
    } catch (RuntimeException exception) {
      if (exception instanceof MercadoPagoException mercadoPagoException) {
        throw mercadoPagoException;
      }
      throw new MercadoPagoException("No fue posible conectar con Mercado Pago.", 502);
    }
  }

  public ProviderOrder getOrder(String providerOrderId) {
    try {
      JsonNode response =
          client
              .get()
              .uri("/v1/orders/{id}", providerOrderId)
              .retrieve()
              .body(JsonNode.class);
      return parseOrder(response, false);
    } catch (RestClientResponseException exception) {
      throw new MercadoPagoException(
          "Mercado Pago rechazo la consulta de la order.", exception.getStatusCode().value());
    } catch (RuntimeException exception) {
      if (exception instanceof MercadoPagoException mercadoPagoException) {
        throw mercadoPagoException;
      }
      throw new MercadoPagoException("No fue posible consultar Mercado Pago.", 502);
    }
  }

  private Map<String, Object> itemBody(CheckoutOrderItem item) {
    return Map.of(
        "title", item.title(),
        "quantity", item.quantity(),
        "unit_measure", "unit",
        "unit_price", amount(item.unitPrice()),
        "total_amount", amount(item.totalAmount()),
        "external_code", item.productId());
  }

  private String resultUrl(CheckoutOrder order, String result) {
    String base = properties.siteUrl().replaceAll("/$", "");
    return base + "/cuenta/pagos/resultado?order=" + order.id() + "&result=" + result;
  }

  String payerEmail(CheckoutOrder order) {
    String testPayerEmail = properties.mercadoPagoTestPayerEmail();
    return testPayerEmail == null || testPayerEmail.isBlank()
        ? order.customerEmail()
        : testPayerEmail;
  }

  private String amount(long value) {
    return BigDecimal.valueOf(value).setScale(2, RoundingMode.UNNECESSARY).toPlainString();
  }

  private ProviderOrder parseOrder(JsonNode response, boolean checkoutRequired) {
    if (response == null || !response.isObject()) {
      throw new MercadoPagoException("Mercado Pago devolvio una respuesta vacia.", 502);
    }
    String id = requiredText(response, "id");
    String externalReference = requiredText(response, "external_reference");
    String status = requiredText(response, "status");
    String statusDetail = response.path("status_detail").asText("");
    String checkoutUrl = response.path("checkout_url").asText("");
    if (checkoutRequired && !checkoutUrl.startsWith("https://")) {
      throw new MercadoPagoException("Mercado Pago no devolvio checkout_url.", 502);
    }
    return new ProviderOrder(
        id,
        externalReference,
        status,
        statusDetail,
        checkoutUrl,
        response.path("total_amount").asText(""));
  }

  private String requiredText(JsonNode node, String field) {
    String value = node.path(field).asText("");
    if (value.isBlank()) {
      throw new MercadoPagoException("Respuesta de Mercado Pago incompleta.", 502);
    }
    return value;
  }
}
