package co.tueste.payments.web;

import co.tueste.payments.mercadopago.MercadoPagoException;
import co.tueste.payments.service.PaymentConflictException;
import co.tueste.payments.service.PaymentNotFoundException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

  @ExceptionHandler(PaymentNotFoundException.class)
  ResponseEntity<Map<String, String>> notFound(PaymentNotFoundException exception) {
    return response(HttpStatus.NOT_FOUND, exception.getMessage());
  }

  @ExceptionHandler(PaymentConflictException.class)
  ResponseEntity<Map<String, String>> conflict(PaymentConflictException exception) {
    return response(HttpStatus.CONFLICT, exception.getMessage());
  }

  @ExceptionHandler(AccessDeniedException.class)
  ResponseEntity<Map<String, String>> forbidden() {
    return response(HttpStatus.FORBIDDEN, "Operacion no autorizada.");
  }

  @ExceptionHandler(MercadoPagoException.class)
  ResponseEntity<Map<String, String>> providerUnavailable() {
    return response(HttpStatus.BAD_GATEWAY, "Mercado Pago no esta disponible en este momento.");
  }

  @ExceptionHandler({IllegalArgumentException.class, MethodArgumentNotValidException.class})
  ResponseEntity<Map<String, String>> badRequest() {
    return response(HttpStatus.BAD_REQUEST, "Solicitud de pago invalida.");
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<Map<String, String>> unexpected() {
    return response(HttpStatus.INTERNAL_SERVER_ERROR, "Error seguro al procesar la operacion.");
  }

  private ResponseEntity<Map<String, String>> response(HttpStatus status, String message) {
    return ResponseEntity.status(status).body(Map.of("message", message));
  }
}
