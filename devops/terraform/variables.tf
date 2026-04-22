variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "eu-central-1"
}

variable "environment" {
  description = "Deployment environment (staging | production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be 'staging' or 'production'."
  }
}

variable "app_name" {
  description = "Application name used as prefix for all resource names"
  type        = string
  default     = "careermate"
}

# ── VPC ─────────────────────────────────────────────────────────────────────

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of AZs to use for subnets"
  type        = list(string)
  default     = ["eu-central-1a", "eu-central-1b"]
}

# ── EC2 ─────────────────────────────────────────────────────────────────────

variable "ec2_instance_type" {
  description = "EC2 instance type for the application server"
  type        = string
  default     = "t3.medium"
}

variable "ec2_key_pair_name" {
  description = "Name of an existing EC2 key pair for SSH access"
  type        = string
  default     = ""
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed to SSH into the app server"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Restrict in production!
}

# ── RDS ─────────────────────────────────────────────────────────────────────

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "careermate"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "careermate_admin"
  sensitive   = true
}

variable "db_password" {
  description = "PostgreSQL master password (min 16 chars)"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.db_password) >= 16
    error_message = "db_password must be at least 16 characters."
  }
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 20
}

# ── ElastiCache ─────────────────────────────────────────────────────────────

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

# ── S3 ──────────────────────────────────────────────────────────────────────

variable "s3_bucket_name" {
  description = "S3 bucket name for file uploads (must be globally unique)"
  type        = string
  default     = ""
}

# ── App ─────────────────────────────────────────────────────────────────────

variable "app_domain" {
  description = "Primary domain for the application (e.g. careermate.com)"
  type        = string
  default     = ""
}

variable "jwt_secret" {
  description = "JWT signing secret (min 32 chars)"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.jwt_secret) >= 32
    error_message = "jwt_secret must be at least 32 characters."
  }
}

variable "llm_api_key" {
  description = "LLM API key (OpenAI / OpenRouter)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "pinecone_api_key" {
  description = "Pinecone vector DB API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "adzuna_app_id" {
  description = "Adzuna job search API app ID"
  type        = string
  default     = ""
}

variable "adzuna_app_key" {
  description = "Adzuna job search API key"
  type        = string
  sensitive   = true
  default     = ""
}
