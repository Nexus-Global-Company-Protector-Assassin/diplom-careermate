# CareerMate — Terraform (AWS)

Infrastructure as Code for deploying CareerMate to AWS.

## Resources

| Resource              | Description                               |
|-----------------------|-------------------------------------------|
| `aws_vpc`             | Isolated VPC with public + private subnets |
| `aws_subnet` (×4)     | 2 public (EC2, NAT) + 2 private (RDS, Redis) |
| `aws_internet_gateway`| Internet access for public subnets        |
| `aws_nat_gateway`     | Outbound internet for private subnets      |
| `aws_instance`        | EC2 t3.medium app server (Amazon Linux 2023) |
| `aws_eip`             | Elastic IP for stable app server address  |
| `aws_db_instance`     | RDS PostgreSQL 16 in private subnet        |
| `aws_elasticache_cluster` | Redis 7 for cache & Bull queues       |
| `aws_s3_bucket`       | Encrypted S3 bucket for file uploads      |
| `aws_security_group`  | Separate SGs for app, RDS, Redis          |
| `aws_iam_role`        | EC2 role with S3 read/write permissions   |

## Prerequisites

1. [Terraform ≥ 1.6](https://developer.hashicorp.com/terraform/install)
2. AWS CLI configured: `aws configure`
3. An EC2 key pair created in the target region

## Usage

```bash
cd devops/terraform

# 1. Copy and edit variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# 2. Initialise providers
terraform init

# 3. Preview changes
terraform plan

# 4. Apply
terraform apply

# 5. Get outputs (IPs, connection strings)
terraform output
```

## Sensitive Outputs

Connection strings are marked `sensitive`. To read them:

```bash
terraform output -json db_connection_url
terraform output -json redis_endpoint
```

## State Management

For team use, enable the S3 backend in `main.tf`:

```bash
# Create the state bucket first (one-time, manual)
aws s3 mb s3://careermate-terraform-state --region eu-central-1
aws dynamodb create-table \
  --table-name careermate-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region eu-central-1

# Then uncomment the backend "s3" block in main.tf and run:
terraform init -migrate-state
```

## Teardown

```bash
terraform destroy
```

> ⚠️ In production, `deletion_protection = true` on RDS prevents accidental destroy.
> Disable it first: `terraform apply -var="environment=staging"` or update the resource manually.
