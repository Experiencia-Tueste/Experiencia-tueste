package co.tueste.payments.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "tueste.payments")
public record PaymentsProperties(
    @NotBlank String mercadoPagoApiUrl,
    @NotBlank String mercadoPagoAccessToken,
    @NotBlank String mercadoPagoWebhookSecret,
    @Pattern(
            regexp = "^$|^test_payer_[0-9]{1,10}@testuser\\.com$",
            message = "MP_TEST_PAYER_EMAIL debe usar el formato test_payer_<numero>@testuser.com")
        String mercadoPagoTestPayerEmail,
    @NotBlank String siteUrl,
    @NotBlank String notificationUrl,
    @NotBlank String jwtIssuer,
    @NotBlank String jwtAudience,
    @NotBlank String jwtPublicKey) {}
