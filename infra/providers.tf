terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend de estado remoto (S3 + DynamoDB para lock) pendiente de la
  # cuenta AWS definitiva. Sin bloque backend, el estado sería local y
  # NO debe usarse para nada real.
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Proyecto  = var.project_name
      Ambiente  = var.environment
      Gestionado = "opentofu"
    }
  }
}

# El certificado de CloudFront debe vivir en us-east-1 aunque el resto
# de recursos estén en otra región.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}
