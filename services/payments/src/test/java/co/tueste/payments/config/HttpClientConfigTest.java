package co.tueste.payments.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class HttpClientConfigTest {

  @Test
  void providesRestClientBuilderForMercadoPagoClient() {
    var builder = new HttpClientConfig().restClientBuilder();

    assertThat(builder).isNotNull();
    assertThat(builder.build()).isNotNull();
  }
}
