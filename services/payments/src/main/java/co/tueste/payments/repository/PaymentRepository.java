package co.tueste.payments.repository;

import co.tueste.payments.domain.CheckoutOrder;
import co.tueste.payments.domain.CheckoutOrderItem;
import co.tueste.payments.domain.ProviderOrder;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class PaymentRepository {
  private final JdbcClient jdbc;

  public PaymentRepository(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  @Transactional(readOnly = true)
  public Optional<CheckoutOrder> findOrder(UUID orderId) {
    return jdbc
        .sql(
            """
            SELECT id, customer_user_id, customer_email, amount, currency, status,
                   idempotency_key, provider_order_id, checkout_url, expires_at
            FROM private.checkout_orders
            WHERE id = :id
            """)
        .param("id", orderId)
        .query((rs, rowNum) -> mapOrder(rs, findItems(orderId)))
        .optional();
  }

  public Optional<CheckoutOrder> findOrderByExternalReference(String externalReference) {
    try {
      return findOrder(UUID.fromString(externalReference));
    } catch (RuntimeException exception) {
      return Optional.empty();
    }
  }

  private List<CheckoutOrderItem> findItems(UUID orderId) {
    return jdbc
        .sql(
            """
            SELECT product_id, title, unit_price, quantity, total_amount
            FROM private.checkout_order_items
            WHERE order_id = :orderId
            ORDER BY created_at, id
            """)
        .param("orderId", orderId)
        .query(
            (rs, rowNum) ->
                new CheckoutOrderItem(
                    rs.getString("product_id"),
                    rs.getString("title"),
                    rs.getLong("unit_price"),
                    rs.getInt("quantity"),
                    rs.getLong("total_amount")))
        .list();
  }

  public boolean consumeJwt(String jti, UUID subject, UUID orderId, Instant expiresAt) {
    try {
      return jdbc
              .sql(
                  """
                  INSERT INTO private.service_jwt_replays
                    (jti, subject, order_id, claims, expires_at)
                  VALUES (:jti, :subject, :orderId, '{}'::jsonb, :expiresAt)
                  ON CONFLICT (jti) DO NOTHING
                  """)
              .param("jti", jti)
              .param("subject", subject)
              .param("orderId", orderId)
              .param("expiresAt", OffsetDateTime.ofInstant(expiresAt, ZoneOffset.UTC))
              .update()
          == 1;
    } catch (DuplicateKeyException exception) {
      return false;
    }
  }

  @Transactional
  public void saveProviderCheckout(UUID orderId, ProviderOrder providerOrder) {
    int updated =
        jdbc
            .sql(
                """
                UPDATE private.checkout_orders
                SET provider_order_id = :providerOrderId,
                    provider_status = :providerStatus,
                    provider_status_detail = :providerStatusDetail,
                    checkout_url = :checkoutUrl,
                    status = 'checkout_created',
                    updated_at = now()
                WHERE id = :orderId
                """)
            .param("providerOrderId", providerOrder.id())
            .param("providerStatus", providerOrder.status())
            .param("providerStatusDetail", providerOrder.statusDetail())
            .param("checkoutUrl", providerOrder.checkoutUrl())
            .param("orderId", orderId)
            .update();
    if (updated != 1) throw new IllegalStateException("No se pudo persistir el checkout.");

    jdbc
        .sql(
            """
            INSERT INTO private.payment_attempts (order_id, amount, provider_status, status)
            SELECT id, amount, :providerStatus, 'created'
            FROM private.checkout_orders
            WHERE id = :orderId
              AND NOT EXISTS (
                SELECT 1 FROM private.payment_attempts WHERE order_id = :orderId
              )
            """)
        .param("providerStatus", providerOrder.status())
        .param("orderId", orderId)
        .update();
  }

  public boolean receiveWebhook(
      String eventId,
      String resourceId,
      String type,
      String action,
      String payloadHash) {
    return jdbc
            .sql(
                """
                INSERT INTO private.payment_events
                  (provider_event_id, resource_id, event_type, action, payload_hash,
                   signature_valid, status)
                VALUES (:eventId, :resourceId, :type, :action, :payloadHash, true, 'received')
                ON CONFLICT (provider, provider_event_id) DO NOTHING
                """)
            .param("eventId", eventId)
            .param("resourceId", resourceId)
            .param("type", type)
            .param("action", action)
            .param("payloadHash", payloadHash)
            .update()
        == 1;
  }

  public void markEventProcessing(String eventId) {
    setEventStatus(eventId, "processing", null, false);
  }

  public void markEventProcessed(String eventId) {
    setEventStatus(eventId, "processed", null, true);
  }

  public void markEventFailed(String eventId, String safeReason) {
    setEventStatus(eventId, "failed", safeReason, true);
  }

  @Transactional
  public void updateOrderFromProvider(ProviderOrder providerOrder, String internalStatus) {
    UUID orderId;
    try {
      orderId = UUID.fromString(providerOrder.externalReference());
    } catch (RuntimeException exception) {
      throw new IllegalArgumentException("Referencia externa de Mercado Pago invalida.");
    }

    String effectiveStatus =
        jdbc
        .sql(
            """
            UPDATE private.checkout_orders
            SET provider_order_id = :providerOrderId,
                provider_status = :providerStatus,
                provider_status_detail = :providerStatusDetail,
                status = CASE
                  WHEN status IN ('refunded', 'charged_back') THEN status
                  WHEN status = 'paid'
                    AND :internalStatus NOT IN ('partially_refunded', 'refunded', 'charged_back')
                    THEN status
                  ELSE :internalStatus
                END,
                paid_at = CASE WHEN :internalStatus = 'paid' AND paid_at IS NULL THEN now() ELSE paid_at END,
                updated_at = now()
            WHERE id = :orderId
            RETURNING status
            """)
        .param("providerOrderId", providerOrder.id())
        .param("providerStatus", providerOrder.status())
        .param("providerStatusDetail", providerOrder.statusDetail())
        .param("internalStatus", internalStatus)
        .param("orderId", orderId)
        .query(String.class)
        .optional()
        .orElseThrow(() -> new IllegalStateException("La orden notificada no existe."));

    String attemptStatus = attemptStatus(effectiveStatus);
    jdbc
        .sql(
            """
            UPDATE private.payment_attempts
            SET provider_status = :providerStatus, status = :attemptStatus, updated_at = now()
            WHERE order_id = :orderId
            """)
        .param("providerStatus", providerOrder.status())
        .param("attemptStatus", attemptStatus)
        .param("orderId", orderId)
        .update();
  }

  private void setEventStatus(
      String eventId, String status, String failureReason, boolean completed) {
    jdbc
        .sql(
            """
            UPDATE private.payment_events
            SET status = :status,
                failure_reason = :failureReason,
                processed_at = CASE WHEN :completed THEN now() ELSE processed_at END
            WHERE provider = 'mercadopago' AND provider_event_id = :eventId
            """)
        .param("status", status)
        .param("failureReason", failureReason)
        .param("completed", completed)
        .param("eventId", eventId)
        .update();
  }

  private CheckoutOrder mapOrder(ResultSet rs, List<CheckoutOrderItem> items) throws SQLException {
    var expires = rs.getObject("expires_at", OffsetDateTime.class);
    return new CheckoutOrder(
        rs.getObject("id", UUID.class),
        rs.getObject("customer_user_id", UUID.class),
        rs.getString("customer_email"),
        rs.getLong("amount"),
        rs.getString("currency"),
        rs.getString("status"),
        rs.getObject("idempotency_key", UUID.class),
        rs.getString("provider_order_id"),
        rs.getString("checkout_url"),
        expires,
        items);
  }

  private String attemptStatus(String orderStatus) {
    return switch (orderStatus) {
      case "paid" -> "approved";
      case "pending", "checkout_created" -> "pending";
      case "canceled", "expired" -> "canceled";
      case "refunded", "partially_refunded" -> "refunded";
      default -> "rejected";
    };
  }
}
