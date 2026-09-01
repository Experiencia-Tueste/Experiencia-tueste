package co.tueste.payments.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "tueste.payments")
public record PaymentsProperties(
    @NotBlank String mercadoPagoApiUrl,
    @NotBlank String mercadoPagoAccessToken,
    @NotBlank String mercadoPagoWebhookSecret,
    @NotBlank String siteUrl,
    @NotBlank String notificationUrl,
    @NotBlank String jwtIssuer,
    @NotBlank String jwtAudience,
    @NotBlank String jwtPublicKey) {}
