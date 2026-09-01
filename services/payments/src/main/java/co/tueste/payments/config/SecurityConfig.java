package co.tueste.payments.config;

import java.security.KeyFactory;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtAudienceValidator;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

  @Bean
  SecurityFilterChain paymentSecurity(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())
        .cors(cors -> cors.disable())
        .sessionManagement(
            sessions -> sessions.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            requests ->
                requests
                    .requestMatchers("/actuator/health", "/webhooks/mercadopago")
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .oauth2ResourceServer(resourceServer -> resourceServer.jwt(Customizer.withDefaults()))
        .build();
  }

  @Bean
  JwtDecoder jwtDecoder(PaymentsProperties properties) {
    var decoder = NimbusJwtDecoder.withPublicKey(readPublicKey(properties.jwtPublicKey())).build();
    OAuth2TokenValidator<Jwt> issuer =
        JwtValidators.createDefaultWithIssuer(properties.jwtIssuer());
    OAuth2TokenValidator<Jwt> audience = new JwtAudienceValidator(properties.jwtAudience());
    OAuth2TokenValidator<Jwt> jti =
        new JwtClaimValidator<String>("jti", value -> value != null && !value.isBlank());
    OAuth2TokenValidator<Jwt> order =
        new JwtClaimValidator<String>("order_id", value -> value != null && !value.isBlank());
    decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(issuer, audience, jti, order));
    return decoder;
  }

  private RSAPublicKey readPublicKey(String pem) {
    try {
      String normalized =
          pem.replace("\\n", "\n")
              .replace("-----BEGIN PUBLIC KEY-----", "")
              .replace("-----END PUBLIC KEY-----", "")
              .replaceAll("\\s", "");
      byte[] bytes = Base64.getDecoder().decode(normalized);
      return (RSAPublicKey)
          KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(bytes));
    } catch (Exception exception) {
      throw new IllegalStateException("PAYMENTS_JWT_PUBLIC_KEY no es una clave RSA publica valida.");
    }
  }
}
