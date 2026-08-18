# ─────────────────────────────────────────────────────────────────────
# Variables del blueprint. Valores reales NUNCA en Git: se definen en
# terraform.tfvars (local, ignorado).
# ─────────────────────────────────────────────────────────────────────

variable "aws_region" {
  description = "Región AWS principal (pendiente de confirmar)."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Nombre corto del proyecto (prefijos de recursos)."
  type        = string
  default     = "tueste"
}

variable "environment" {
  description = "Ambiente: staging o production."
  type        = string
  default     = "staging"

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment debe ser 'staging' o 'production'."
  }
}

variable "domain_name" {
  description = "Dominio público (opcional; se habilita Route 53/ACM solo si se define)."
  type        = string
  default     = ""
}

variable "site_url" {
  description = "URL pública del sitio (canonical/metadata de la app)."
  type        = string
  default     = "http://localhost:3000"
}

variable "image_tag" {
  description = "Tag de la imagen ECR a desplegar (p. ej. sha del commit)."
  type        = string
  default     = "latest"
}

variable "waf_rate_limit" {
  description = "Límite inicial de rate-based rule (COUNT al principio). A VALIDAR en staging."
  type        = number
  default     = 2000
}

variable "vpc_cidr" {
  description = "CIDR de la VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "log_retention_days" {
  description = "Retención de CloudWatch Logs (pendiente de confirmar)."
  type        = number
  default     = 30
}
