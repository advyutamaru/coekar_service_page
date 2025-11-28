variable "aws_region" {
  description = "AWS region for main resources"
  type        = string
  default     = "ap-northeast-1"
}

provider "aws" {
  region = var.aws_region
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

