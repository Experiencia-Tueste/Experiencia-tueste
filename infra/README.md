# Infraestructura AWS — blueprint reproducible (sin aprovisionar)

Este directorio contiene la base de **infraestructura como código** para
la arquitectura objetivo. Nada de lo aquí escrito se ha ejecutado: no
hay recursos creados, no hay credenciales usadas y no hay dominios
conectados.

## Arquitectura objetivo

```text
Route 53
→ CloudFront + AWS WAF + Shield Standard
→ Application Load Balancer (privado, origen de CloudFront)
→ ECS Fargate (contenedor Next.js desde ECR)
→ AWS Secrets Manager + CloudWatch
```

- **CloudFront es el único punto público.** ECS/ALB nunca se exponen
  directamente a internet (el ALB vive en subredes privadas y solo
  acepta tráfico del security group de CloudFront/ALB autorizado).
- **ACM para CloudFront** debe emitirse en `us-east-1`
  (región requerida por CloudFront para certificados), aunque el resto
  de la infraestructura viva en otra región.
- **WAF arranca en modo observación** (COUNT) antes de aplicar
  bloqueos agresivos; luego se promueve a BLOCK por regla.
- **HSTS sigue pendiente** hasta que el dominio HTTPS funcione
  correctamente en CloudFront.
- **Sin `.tfvars` reales en Git**: solo existen archivos `.example`.

## Decisiones asumidas

| Decisión              | Valor asumido                                                                | Nota                                        |
| --------------------- | ---------------------------------------------------------------------------- | ------------------------------------------- |
| Tooling               | OpenTofu (sintaxis compatible con Terraform)                                 | Pendiente de validar con el equipo          |
| Región                | `us-east-1` (variable, default temporal)                                     | **Pendiente de confirmar**                  |
| Cuenta AWS            | Una cuenta por ambiente (staging/prod) o cuenta única con separación por VPC | **Pendiente**                               |
| Dominio               | `tueste.co` (placeholder)                                                    | **Pendiente de comprar**                    |
| Ambiente staging      | Existente, mismo blueprint con `environment=staging`                         | Necesario antes de producción               |
| NAT Gateway           | 1 por zona de disponibilidad (para tareas Fargate con salida)                | Coste a validar; alternativa: VPC endpoints |
| Límites WAF iniciales | Rate-based: 2000 req/5min por IP (staging) — **a validar**                   | Solo observación al inicio                  |
| Logs                  | CloudWatch Logs, retención 30 días (variable)                                | **Pendiente de confirmar**                  |
| Acceso                | GitHub Actions por OIDC (sin access keys permanentes)                        | Roles IAM con mínimo privilegio             |

## Decisiones pendientes (antes del primer `apply`)

1. Región definitiva y cuenta(s) AWS.
2. Dominio real y validación DNS en Route 53.
3. Límites WAF definitivos y reglas administradas elegidas.
4. Política de retención de logs y presupuesto/alarmas.
5. Responsables de acceso (quién puede ejecutar apply y en qué ambiente).
6. Costo aceptado de NAT Gateway vs. uso de VPC endpoints.

## Recursos que se crearán al ejecutar (resumen)

- **ECR** — repositorio de imágenes del contenedor Next.js.
- **VPC** — subredes públicas (para ALB/NAT) y privadas (ECS), security
  groups mínimos.
- **ECS Fargate** — servicio + task definition, health check `GET /`,
  sin exposición directa.
- **ALB** — privado, listener HTTPS con certificado ACM.
- **CloudFront** — distribución con origen ALB, cacheo de estáticos y
  cabeceras de seguridad heredadas de la app.
- **WAF global** — asociada a CloudFront, reglas administradas + rate
  limiting (inicialmente en COUNT).
- **Route 53** — zona y registros apuntando a CloudFront.
- **ACM** — certificado (en `us-east-1` para CloudFront).
- **Secrets Manager** — secretos reales (Supabase, Shopify si aplica);
  nunca en variables ni en la imagen.
- **CloudWatch** — log groups, métricas y alarmas base.
- **IAM** — roles de ejecución de Fargate, despliegue por OIDC de
  GitHub Actions (sin access keys de larga duración).

## Cómo se aplicará (futuro)

```bash
# 1. Copiar variables de ejemplo y completarlas LOCALMENTE (nunca en Git)
cp environments/staging/terraform.tfvars.example environments/staging/terraform.tfvars

# 2. Inicializar (descarga providers; requiere credenciales AWS)
cd infra
tofu init

# 3. Planificar (revisar TODO el diff antes de aplicar)
tofu plan -var-file=environments/staging/terraform.tfvars

# 4. Aplicar (solo tras revisión; nunca en esta fase)
tofu apply -var-file=environments/staging/terraform.tfvars
```

## Notas de seguridad

- Los secretos se inyectan en Fargate desde Secrets Manager; la imagen
  no contiene secretos (ver `Dockerfile` y `README.md` de la app).
- El backend de estado (S3 + DynamoDB para lock) se documentará al
  definir la cuenta: por ahora no hay bloque `backend`.
- Nunca subir `terraform.tfvars`, `.auto.tfvars` ni salidas de `plan`
  con valores reales. El lockfile `.terraform.lock.hcl` SÍ debe
  versionarse una vez generado por `tofu init` (fija las versiones de
  los providers).

## Comunicación CloudFront → ALB (a implementar más adelante)

- CloudFront usará **VPC Origin** para comunicarse con el ALB privado.
- El ALB permitirá tráfico únicamente mediante el mecanismo oficial de
  CloudFront VPC Origin o su security group administrado (no abrir el
  ALB a internet ni a rangos IP genéricos).
- Estos recursos no se implementan todavía: requieren OpenTofu/Terraform
  instalado y la cuenta AWS definitiva.
