package co.tueste.payments.mercadopago;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ProviderOrderStatusMapperTest {
  private final ProviderOrderStatusMapper mapper = new ProviderOrderStatusMapper();

  @Test
  void mapsAccreditedOrderToPaid() {
    assertThat(mapper.toInternalStatus("processed", "accredited")).isEqualTo("paid");
  }

  @Test
  void keepsActionRequiredPending() {
    assertThat(mapper.toInternalStatus("action_required", "pending_challenge"))
        .isEqualTo("pending");
  }

  @Test
  void mapsRefundAndChargebackStates() {
    assertThat(mapper.toInternalStatus("refunded", "refunded")).isEqualTo("refunded");
    assertThat(mapper.toInternalStatus("charged_back", "reimbursed")).isEqualTo("charged_back");
  }
}
