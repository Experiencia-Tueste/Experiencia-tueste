package co.tueste.payments.service;

import co.tueste.payments.mercadopago.MercadoPagoClient;
import co.tueste.payments.mercadopago.ProviderOrderStatusMapper;
import co.tueste.payments.repository.PaymentRepository;
import java.math.BigDecimal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class WebhookProcessor {
  private static final Logger log = LoggerFactory.getLogger(WebhookProcessor.class);

  private final PaymentRepository repository;
  private final MercadoPagoClient mercadoPago;
  private final ProviderOrderStatusMapper statusMapper;

  public WebhookProcessor(
      PaymentRepository repository,
      MercadoPagoClient mercadoPago,
      ProviderOrderStatusMapper statusMapper) {
    this.repository = repository;
    this.mercadoPago = mercadoPago;
    this.statusMapper = statusMapper;
  }

  @Async
  public void processOrderEvent(String eventId, String providerOrderId) {
    try {
      repository.markEventProcessing(eventId);
      var providerOrder = mercadoPago.getOrder(providerOrderId);
      var order =
          repository
              .findOrderByExternalReference(providerOrder.externalReference())
              .orElseThrow(() -> new IllegalArgumentException("Orden interna no encontrada."));
      if (BigDecimal.valueOf(order.amount()).compareTo(new BigDecimal(providerOrder.totalAmount()))
          != 0) {
        throw new IllegalArgumentException("El monto notificado no coincide con la orden.");
      }
      String internalStatus =
          statusMapper.toInternalStatus(providerOrder.status(), providerOrder.statusDetail());
      repository.updateOrderFromProvider(providerOrder, internalStatus);
      repository.markEventProcessed(eventId);
    } catch (RuntimeException exception) {
      repository.markEventFailed(eventId, "No fue posible sincronizar la order.");
      log.error("Fallo la sincronizacion del evento de pago {}.", eventId);
    }
  }
}
