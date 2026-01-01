# Terraform Infrastructure for RoomMaster Backend

This directory contains Terraform configuration for deploying RoomMaster Backend to Azure Container Apps.

## 📁 File Structure

```
terraform/
├── providers.tf              # Azure provider configuration & backend
├── variables.tf              # Input variables definitions
├── outputs.tf               # Output values (URLs, resource IDs)
├── main.tf                  # Core infrastructure (RG, ACR, Log Analytics)
├── container-app.tf         # Container App specific configuration
├── terraform.tfvars.example # Example variable values
├── .gitignore              # Ignored files
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

- Azure CLI logged in: `az login`
- Terraform v1.6+ installed
- Backend storage created (see main DEPLOYMENT.md)

### First Time Initialization

```bash
cd terraform

# Initialize with backend configuration
terraform init \
  -backend-config="resource_group_name=rg-terraform-state" \
  -backend-config="storage_account_name=stroommasterstate" \
  -backend-config="container_name=tfstate" \
  -backend-config="key=roommaster.tfstate"
```

### Deploy

```bash
# Create terraform.tfvars from example
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars

# Plan
terraform plan \
  -var="database_url=$DATABASE_URL" \
  -var="jwt_secret=$JWT_SECRET" \
  -var="swagger_password=$SWAGGER_PASSWORD"

# Apply
terraform apply
```

## 📝 Required Variables

Variables that MUST be provided (no defaults):

| Variable       | Description                  | Example                               |
| -------------- | ---------------------------- | ------------------------------------- |
| `database_url` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `jwt_secret`   | JWT signing secret           | `your-secret-key-min-32-chars`        |

## 🔧 Optional Variables

See `terraform.tfvars.example` for all available variables.

Common ones to customize:

```hcl
# Environment
environment = "prod"  # dev, staging, prod
location = "Southeast Asia"

# Scaling
min_replicas = 1
max_replicas = 10

# Resources
cpu_per_replica = 0.5
memory_per_replica = "1Gi"

# SMTP (optional)
smtp_host = "smtp.gmail.com"
smtp_username = "your-email@gmail.com"
smtp_password = "your-password"
```

## 📤 Outputs

After successful apply:

```bash
# Get all outputs
terraform output

# Get specific output
terraform output container_app_url
terraform output acr_login_server

# Use in scripts
APP_URL=$(terraform output -raw container_app_url)
curl $APP_URL/health
```

## 🏗️ Resources Created

This Terraform configuration creates:

1. **Resource Group** (`rg-roommaster-{env}`)

   - Container for all resources

2. **Container Registry** (`acrroommaster{env}`)

   - Stores Docker images
   - Admin access enabled

3. **Log Analytics Workspace** (`log-roommaster-{env}`)

   - Centralized logging
   - 30 days retention

4. **Container Apps Environment** (`cae-roommaster-{env}`)

   - Managed Kubernetes environment
   - Integrated with Log Analytics

5. **Container App** (`roommaster-api`)
   - Your application container
   - Auto-scaling (1-10 replicas)
   - HTTPS ingress
   - Health probes

## 🔐 Secrets Management

Secrets are stored in Container App configuration:

- `acr-password` - ACR access
- `database-url` - Database connection
- `jwt-secret` - JWT signing key
- `swagger-password` - Swagger UI access
- `smtp-password` - Email (if configured)

View secrets:

```bash
az containerapp secret list \
  --name roommaster-api \
  --resource-group rg-roommaster-prod
```

## 🔄 Update Infrastructure

### Change Configuration

```bash
# Edit terraform.tfvars or use -var flags
terraform plan -var="min_replicas=2"
terraform apply -var="min_replicas=2"
```

### Update Container Image

```bash
# Image tag is usually managed by CI/CD
terraform apply -var="container_image=roommaster:v1.2.3"
```

### Update Secrets

```bash
# Update via Terraform
terraform apply -var="jwt_secret=new-secret"

# Or via Azure CLI (faster)
az containerapp secret set \
  --name roommaster-api \
  --resource-group rg-roommaster-prod \
  --secrets jwt-secret="new-secret"
```

## 🗑️ Destroy Infrastructure

```bash
# Preview what will be destroyed
terraform plan -destroy

# Destroy everything (CAREFUL!)
terraform destroy
```

## 📊 State Management

Terraform state is stored remotely in Azure Storage:

```bash
# View current state
terraform show

# List resources in state
terraform state list

# Get specific resource
terraform state show azurerm_container_app.main

# Refresh state from Azure
terraform refresh
```

## 🐛 Troubleshooting

### State Lock

```bash
# If terraform is locked
terraform force-unlock <LOCK_ID>
```

### Provider Issues

```bash
# Re-initialize providers
terraform init -upgrade
```

### State Drift

```bash
# Check for drift
terraform plan -refresh-only

# Import existing resource
terraform import azurerm_container_app.main /subscriptions/{sub-id}/resourceGroups/{rg}/providers/Microsoft.App/containerApps/{name}
```

### Validate Configuration

```bash
# Format code
terraform fmt

# Validate syntax
terraform validate

# Show plan in JSON
terraform show -json tfplan | jq
```

## 📚 Documentation

- Full deployment guide: `../docs/DEPLOYMENT.md`
- Quick reference: `../docs/DEPLOYMENT_QUICK_REFERENCE.md`
- Setup summary: `../docs/DEPLOYMENT_SETUP_SUMMARY.md`

## 🔗 Useful Commands

```bash
# Plan with detailed output
terraform plan -out=tfplan

# Apply without confirmation
terraform apply -auto-approve tfplan

# Target specific resource
terraform apply -target=azurerm_container_app.main

# Import existing resource
terraform import azurerm_resource_group.main /subscriptions/{sub-id}/resourceGroups/{name}

# Taint resource (force recreation)
terraform taint azurerm_container_app.main

# Get resource graph
terraform graph | dot -Tpng > graph.png
```

## 🎯 Best Practices

1. **Always use remote backend** - State stored in Azure Storage
2. **Use tfvars files** - Don't hardcode secrets
3. **Review plans** - Always check `terraform plan` before apply
4. **Version control** - Commit Terraform files (not tfvars with secrets)
5. **Environment separation** - Use workspaces or separate state files
6. **Consistent naming** - Follow Azure naming conventions

## 💡 Tips

- Use `terraform plan` before any apply
- Keep tfvars files out of git (in .gitignore)
- Use variables for everything that might change
- Document custom configurations
- Test in dev environment first

---

**Terraform Version:** >= 1.6.0  
**Provider Version:** hashicorp/azurerm ~> 3.85.0
