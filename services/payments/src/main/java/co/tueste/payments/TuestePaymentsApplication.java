package co.tueste.payments;

import co.tueste.payments.config.PaymentsProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
@EnableConfigurationProperties(PaymentsProperties.class)
public class TuestePaymentsApplication {

  public static void main(String[] args) {
    SpringApplication.run(TuestePaymentsApplication.class, args);
  }
}
