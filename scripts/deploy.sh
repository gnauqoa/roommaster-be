#!/bin/bash


























































































































































































































































































































































































































































































































































































































































































































































**Version:** 1.0.0**Last Updated:** January 2026  ---- Issue Tracker: https://github.com/your-org/roommaster-be/issues- Project Repository: https://github.com/your-org/roommaster-be- Email: support@roommaster.com**Contact:**4. Review Terraform state3. Check GitHub Actions workflow logs2. Review application logs1. Check [Troubleshooting](#troubleshooting) sectionNếu gặp vấn đề:## 🆘 Support---- [Prisma Documentation](https://www.prisma.io/docs/)- [GitHub Actions Documentation](https://docs.github.com/actions)- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)- [Azure Container Apps Documentation](https://learn.microsoft.com/azure/container-apps/)## 📚 Additional Resources---5. **Spot Instances**: Không available cho Container Apps nhưng có thể dùng AKS nếu cần4. **Resource Sizing**: Start nhỏ, scale theo nhu cầu3. **Log Retention**: Giảm retention xuống 7-14 days cho dev2. **Use Basic SKU**: ACR Basic thay vì Premium1. **Scale to Zero**: Set `min_replicas = 0` cho dev/staging### 💡 Cost Optimization Tips| **Grand Total** | | **~$60-90** || PostgreSQL Flexible Server (Basic) | B1ms, 32GB storage | ~$30-40 || **Total (without database)** | | **~$30-50** || Log Analytics | 5GB ingestion/month | ~$10-15 || Container Registry (Basic) | <10GB storage | ~$5 || Container App | 0.5 vCPU, 1GB RAM, avg 1 replica | ~$15-30 ||----------|--------------|-------------------|| Resource | Specification | Monthly Cost (USD) |### 💰 Monthly Cost Breakdown (Southeast Asia Region)## Chi Phí Ước Tính---```  --command "/bin/sh"  --resource-group rg-roommaster-prod \  --name roommaster-api \az containerapp exec \# SSH into container  --revision <revision-name>  --resource-group rg-roommaster-prod \  --name roommaster-api \az containerapp revision show \# Get revision details  --resource-group rg-roommaster-prod  --name roommaster-api \az containerapp revision list \# List all revisions  --resource-group rg-roommaster-prod  --name roommaster-api \az containerapp show \# Get detailed container app info```bash### 🔧 Debug Commands```terraform apply -var="memory_per_replica=2Gi"cd terraform# Increase memory allocation```bash#### 5. **Out of Memory**```terraform force-unlock <LOCK_ID># Force unlock (use lock ID from error message)cd terraform# If terraform apply bị stuck```bash#### 4. **Terraform State Lock**```  --password $(az acr credential show --name acrroomasterprod --query passwords[0].value -o tsv)  --username $(az acr credential show --name acrroomasterprod --query username -o tsv) \  --server acrroomasterprod.azurecr.io \  --resource-group rg-roommaster-prod \  --name roommaster-api \az containerapp registry set \# Update container app với new credentialsaz acr credential show --name acrroomasterprod# Check ACR credentials```bash#### 3. **Image Pull Failed**```> npx prisma db push# Inside container:  --command "/bin/sh"  --resource-group rg-roommaster-prod \  --name roommaster-api \az containerapp exec \# Test connection from container  --resource-group rg-roommaster-prod  --name roommaster-api \az containerapp secret list \# Verify DATABASE_URL secret```bash#### 2. **Database Connection Failed**```    --query "[0].name" -o tsv)    --resource-group rg-roommaster-prod \    --name roommaster-api \  --revision $(az containerapp revision list \  --resource-group rg-roommaster-prod \  --name roommaster-api \az containerapp revision restart \# Restart appcurl https://your-app.azurecontainerapps.io/health# Check if /health endpoint existsaz containerapp logs show --name roommaster-api --resource-group rg-roommaster-prod --follow# Check logs```bash#### 1. **Health Check Failed**### ❌ Common Issues## Troubleshooting---```  --action roommaster-alerts  --description "Alert when error rate is high" \  --condition "avg Requests > 100" \  --scopes /subscriptions/{sub-id}/resourceGroups/rg-roommaster-prod/providers/Microsoft.App/containerApps/roommaster-api \  --resource-group rg-roommaster-prod \  --name "high-error-rate" \az monitor metrics alert create \# Create alert rule (high error rate)  --email-receiver name="admin" email-address="admin@example.com"  --short-name "rm-alert" \  --resource-group rg-roommaster-prod \  --name "roommaster-alerts" \az monitor action-group create \# Create action group (email notification)```bashTạo alert khi có vấn đề:### 🚨 Alerts (Optional)```  --interval PT1H  --end-time 2024-01-01T23:59:59Z \  --start-time 2024-01-01T00:00:00Z \  --metric "Requests" \  --resource /subscriptions/{sub-id}/resourceGroups/rg-roommaster-prod/providers/Microsoft.App/containerApps/roommaster-api \az monitor metrics list \# Get metrics```bash### 📈 Metrics```| render timechart| summarize RequestCount=count() by bin(TimeGenerated, 5m)| where ContainerAppName_s == "roommaster-api"ContainerAppSystemLogs_CL// Request metrics| order by TimeGenerated desc| where Log_s contains "ERROR" or Log_s contains "error"| where ContainerAppName_s == "roommaster-api"ContainerAppConsoleLogs_CL// Error logs only| take 100| order by TimeGenerated desc| where ContainerAppName_s == "roommaster-api"ContainerAppConsoleLogs_CL// All application logs```kusto**Query Examples:**Vào **Azure Portal** → **Log Analytics Workspace** → **Logs**### 🔍 Log Analytics Queries```  --since 1h  --resource-group rg-roommaster-prod \  --name roommaster-api \az containerapp logs show \# Filter by time  --tail 100  --resource-group rg-roommaster-prod \  --name roommaster-api \az containerapp logs show \# Recent logs  --follow  --resource-group rg-roommaster-prod \  --name roommaster-api \az containerapp logs show \# Follow logs (real-time)```bash### 📊 View Application Logs## Monitoring & Logs---```  --max-replicas 20  --min-replicas 2 \  --resource-group rg-roommaster-prod \  --name roommaster-api \az containerapp update \# Via Azure CLI (nhanh hơn)terraform apply -var="min_replicas=2" -var="max_replicas=20"# Via Terraform```bash#### Update Scaling```  -var="jwt_access_expiration_minutes=60"terraform apply \# Update variable trong tfvars hoặc command linecd terraform```bash#### Update Environment Variables```git push origin main# Code changes được deploy tự động qua GitHub Actions```bash#### Update Code### 🔄 Update Deployed Application```./scripts/deploy.sh --env dev```bash3. **Deploy:**```memory_per_replica = "0.5Gi"cpu_per_replica = 0.25max_replicas = 2min_replicas = 0  # Scale to zero khi không dùng# Smaller resources for devlocation     = "Southeast Asia"project_name = "roommaster"environment  = "dev"# terraform/terraform.dev.tfvars```hcl2. **Edit values:**```cp terraform/terraform.tfvars.example terraform/terraform.dev.tfvars```bash1. **Tạo tfvars file:**#### Tạo Environment MớiProject hỗ trợ multiple environments (dev, staging, prod):### 🌍 Multiple Environments## Quản Lý Environment---```terraform output container_app_url# Get app URLterraform apply tfplan# Apply  -out=tfplan  -var="swagger_password=$SWAGGER_PASSWORD" \  -var="jwt_secret=$JWT_SECRET" \  -var="database_url=$DATABASE_URL" \terraform plan \# Plan  -backend-config="key=roommaster.tfstate"  -backend-config="container_name=tfstate" \  -backend-config="storage_account_name=stroommasterstate" \  -backend-config="resource_group_name=rg-terraform-state" \terraform init \# Initializecd terraform```bash#### Step 3: Terraform Deploy```docker push acrroomasterprod.azurecr.io/roommaster:latest# Push imagedocker tag roommaster:latest acrroomasterprod.azurecr.io/roommaster:latest# Tag imageaz acr login --name acrroomasterprod# Login to ACR```bash#### Step 2: Push to ACR```  roommaster:latest  -e NODE_ENV="production" \  -e JWT_SECRET="$JWT_SECRET" \  -e DATABASE_URL="$DATABASE_URL" \docker run -p 3000:3000 \# Test locally (optional)docker build -t roommaster:latest -f Dockerfile .# Build image```bash#### Step 1: Build Docker Image### 📝 Manual Step-by-Step```./scripts/deploy.sh --env prod --skip-build# Deploy without rebuilding image./scripts/deploy.sh --env prod --plan-only# Plan only (dry-run)./scripts/deploy.sh --env prod --init# Initialize backend first time./scripts/deploy.sh --env prod# Full deploymentsource .env.prod# Load environment```bash### 🚀 Deploy Script```EMAIL_FROM="noreply@roommaster.com"SMTP_PASSWORD="your-app-password"SMTP_USERNAME="your-email@gmail.com"SMTP_PORT="587"SMTP_HOST="smtp.gmail.com"# Optional: SMTPTF_STATE_CONTAINER="tfstate"TF_STATE_STORAGE_ACCOUNT="stroommasterstate"TF_STATE_RESOURCE_GROUP="rg-terraform-state"# Terraform Backend (optional cho manual deploy)SWAGGER_PASSWORD="your-secure-swagger-password"# SwaggerJWT_SECRET="your-production-jwt-secret-min-32-characters"# JWTDATABASE_URL="postgresql://user:password@your-db-host:5432/roommaster?schema=public"# Database```bash**.env.prod** template:```nano .env.prod# Edit .env.prod với production valuescp .env.example .env.prod# Create .env file cho productioncd roommaster-begit clone https://github.com/your-org/roommaster-be.git# Clone repository```bash### 🛠️ Setup Environment## Triển Khai Thủ Công---4. Sau khi complete, xem URL được deploy trong Summary   - `terraform-deploy`: Infrastructure deployment   - `build-and-push`: Build Docker image3. Xem real-time logs cho từng job:2. Click vào workflow run đang chạy1. Vào **GitHub Actions** tab### 📊 Monitoring Deployment```# Repository → Actions → Chọn workflow run# 6. Xem logs trên GitHub Actions# → Deploy workflow sẽ chạy tự động# 5. Sau khi approve, merge PR vào main# → PR Checks workflow sẽ chạy tự động# 4. Tạo Pull Request trên GitHubgit push origin feature/my-feature# 3. Push và tạo PRgit commit -m "feat: add new feature"git add .# 2. Commit changesgit checkout -b feature/my-feature# 1. Tạo branch mới```bash### 🚀 Deployment Process- ✅ Health check deployment- 🔧 Terraform plan & apply- 📤 Push to Azure Container Registry- 🏗️ Build Docker imageChạy khi merge vào `main` branch:#### 2. **Deploy** (`.github/workflows/deploy.yml`)- ✅ Validate Terraform- ✅ Build Docker image (không push)- ✅ Run tests- ✅ Format check (Prettier)- ✅ Lint code (ESLint)Chạy khi tạo Pull Request:#### 1. **PR Checks** (`.github/workflows/pr-check.yml`)Project có 2 workflows:### 📝 GitHub Actions Workflows## Triển Khai Tự Động (CI/CD)---| `EMAIL_FROM` | From Email Address || `SMTP_PASSWORD` | SMTP Password || `SMTP_USERNAME` | SMTP Username || `SMTP_PORT` | SMTP Port (587) || `SMTP_HOST` | SMTP Server ||------------|-------|| Secret Name | Mô Tả |### 🔧 Optional Secrets (cho Email)| `TF_STATE_CONTAINER` | Terraform State Container | `tfstate` || `TF_STATE_STORAGE_ACCOUNT` | Terraform State Storage | `stroommasterstate` || `TF_STATE_RESOURCE_GROUP` | Terraform State RG | `rg-terraform-state` || `SWAGGER_PASSWORD` | Swagger UI Password | `admin123!@#` || `JWT_SECRET` | JWT Secret Key | `your-super-secret-jwt-key-min-32-chars` || `DATABASE_URL` | PostgreSQL Connection String | `postgresql://user:pass@host:5432/db?schema=public` || `ACR_PASSWORD` | ACR Admin Password | `***` || `ACR_USERNAME` | ACR Admin Username | `acrroomasterprod` || `ACR_LOGIN_SERVER` | ACR Login Server | `acrroommasterprod.azurecr.io` || `AZURE_TENANT_ID` | Azure Tenant ID | `87654321-4321-4321-4321-210987654321` || `AZURE_SUBSCRIPTION_ID` | Azure Subscription ID | `12345678-1234-1234-1234-123456789012` || `AZURE_CREDENTIALS` | Service Principal JSON (từ bước 1) | `{"clientId":"...","clientSecret":"..."}` ||------------|-------|-------|| Secret Name | Mô Tả | Ví Dụ |### 🔐 Required SecretsVào **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**## Cấu Hình GitHub Secrets---```  --server-name roommaster-db-prodaz postgres flexible-server show-connection-string \# Get connection string  --storage-size 32  --version 15 \  --tier Burstable \  --sku-name Standard_B1ms \  --admin-password "YourStrongPassword123!" \  --admin-user adminuser \  --location southeastasia \  --resource-group rg-roommaster-prod \  --name roommaster-db-prod \az postgres flexible-server create \```bash**Ví dụ tạo Azure PostgreSQL:**- Self-hosted- External PostgreSQL service- Azure Database for PostgreSQLBạn có thể sử dụng:### 3️⃣ Tạo PostgreSQL Database (Nếu chưa có)```  --account-key $ACCOUNT_KEY  --account-name $STORAGE_ACCOUNT \  --name $CONTAINER_NAME \az storage container create \# Tạo Blob Container  --query '[0].value' -o tsv)  --account-name $STORAGE_ACCOUNT \  --resource-group $RESOURCE_GROUP \ACCOUNT_KEY=$(az storage account keys list \# Lấy Storage Account Key  --encryption-services blob  --sku Standard_LRS \  --location $LOCATION \  --resource-group $RESOURCE_GROUP \  --name $STORAGE_ACCOUNT \az storage account create \# Tạo Storage Accountaz group create --name $RESOURCE_GROUP --location $LOCATION# Tạo Resource GroupLOCATION="southeastasia"CONTAINER_NAME="tfstate"STORAGE_ACCOUNT="stroommasterstate"  # Phải unique globally, chỉ lowercase & numbersRESOURCE_GROUP="rg-terraform-state"# Đặt variables```bashTerraform cần một nơi lưu trữ state file để track infrastructure:### 2️⃣ Tạo Terraform State Storage```}  ...  "tenantId": "xxx",  "subscriptionId": "xxx",  "clientSecret": "xxx",  "clientId": "xxx",{# Output sẽ có dạng (LƯU LẠI):  --sdk-auth  --scopes /subscriptions/{subscription-id} \  --role contributor \  --name "roommaster-github-actions" \az ad sp create-for-rbac \# Create Service Principalaz account set --subscription "YOUR_SUBSCRIPTION_ID"# Set subscriptionaz login# Login to Azure```bash### 1️⃣ Tạo Azure Service Principal## Thiết Lập Ban Đầu---    - `AcrPush` cho Azure Container Registry  - `Contributor` trên subscription hoặc resource group- **Service Principal** cho GitHub Actions với roles:- **Azure Subscription** với quyền tạo resources### ☁️ Azure Requirements  ```  git --version  ```bash- **Git**  ```  docker --version  # Verify installation  ```bash- **Docker** v24+  ```  brew install terraform  # macOS    sudo mv terraform /usr/local/bin/  unzip terraform_1.6.0_linux_amd64.zip  wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip  # Linux  ```bash- **Terraform** v1.6+  ```  brew install azure-cli  # macOS    curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash  # Linux  ```bash- **Azure CLI** v2.50+### 💻 Tools Cần Cài Đặt## Yêu Cầu---7. **Health Check** → Verify deployment thành công6. **Container App** → Deploy container mới5. **Terraform Apply** → Cập nhật infrastructure4. **Push to ACR** → Azure Container Registry3. **Docker Build** → Multi-stage build với optimization2. **GitHub Actions** → Tự động build & test1. **Developer Push** → Main branch### 🎯 Deployment Flow```                    └───────────────────────┘                    │  (External/Existing)  │                    │  PostgreSQL Database  │                    ┌───────────────────────┐                                ▼                                │            └──────────────────────────────────────────┘            │  └────────────────────────────────────┘  │            │  │  - Metrics & Monitoring            │  │            │  │  - Application Logs                │  │            │  │  Log Analytics Workspace           │  │            │  ┌────────────────────────────────────┐  │            │                                           │            │  └────────────────────────────────────┘  │            │  │  └──────────────────────────────┘  │  │            │  │  │  - Health Checks             │  │  │            │  │  │  - HTTPS Ingress             │  │  │            │  │  │  - Auto-scaling (1-10)       │  │  │            │  │  │  Container App (API)         │  │  │            │  │  ┌──────────────────────────────┐  │  │            │  │  Container Apps Environment        │  │            │  ┌────────────────────────────────────┐  │            │                ▼                          │            │                │                          │            │  └─────────────┬──────────────────────┘  │            │  │  - Docker Images                   │  │            │  │  Azure Container Registry (ACR)    │  │            │  ┌────────────────────────────────────┐  │            │          Azure Cloud                     │            ┌──────────────────────────────────────────┐                                       ▼                                       │└──────────────────────────────────────┼──────────────────┘│                          └───────────┬────────────┘    ││                          │  - Terraform Apply     │    ││  └─────────────┘         │  - Push to ACR         │    ││  │   Code      │         │  - Build Docker Image  │    ││  │   Source    │────────▶│  GitHub Actions        │    ││  ┌─────────────┐         ┌────────────────────────┐    ││                     GitHub Repository                    │┌─────────────────────────────────────────────────────────┐```### 🏗️ Kiến Trúc Deployment## Tổng Quan---- [Chi Phí Ước Tính](#chi-phí-ước-tính)- [Troubleshooting](#troubleshooting)- [Monitoring & Logs](#monitoring--logs)- [Quản Lý Environment](#quản-lý-environment)- [Triển Khai Thủ Công](#triển-khai-thủ-công)- [Triển Khai Tự Động (CI/CD)](#triển-khai-tự-động-cicd)- [Cấu Hình GitHub Secrets](#cấu-hình-github-secrets)- [Thiết Lập Ban Đầu](#thiết-lập-ban-đầu)- [Yêu Cầu](#yêu-cầu)- [Kiến Trúc Deployment](#kiến-trúc-deployment)- [Tổng Quan](#tổng-quan)## 📋 Mục LụcHướng dẫn chi tiết triển khai RoomMaster Backend lên Azure Container Apps sử dụng Terraform và GitHub Actions.# ===================================
# RoomMaster Manual Deployment Script
# ===================================
# This script provides manual deployment capabilities for RoomMaster API
# to Azure Container Apps using Terraform
#
# Prerequisites:
# - Azure CLI installed and logged in
# - Terraform installed
# - Docker installed (for local builds)
# - Proper Azure permissions
#
# Usage:
#   ./scripts/deploy.sh [OPTIONS]
#
# Options:
#   --env        Environment (dev|staging|prod) [default: prod]
#   --init       Initialize Terraform backend
#   --plan-only  Only run terraform plan
#   --skip-build Skip Docker build
#   --help       Show this help message
# ===================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="prod"
INIT_BACKEND=false
PLAN_ONLY=false
SKIP_BUILD=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TERRAFORM_DIR="$PROJECT_ROOT/terraform"

# ===================================
# Helper Functions
# ===================================

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo ""
}

show_help() {
    cat << EOF
RoomMaster Manual Deployment Script

Usage: $0 [OPTIONS]

Options:
    --env ENV          Environment to deploy (dev|staging|prod) [default: prod]
    --init             Initialize Terraform backend
    --plan-only        Only run terraform plan (no apply)
    --skip-build       Skip Docker image build
    --help             Show this help message

Examples:
    # Full deployment to production
    $0 --env prod

    # Initialize backend and deploy to staging
    $0 --env staging --init

    # Plan only (dry run)
    $0 --env prod --plan-only

    # Deploy without rebuilding image
    $0 --env prod --skip-build

Prerequisites:
    - Azure CLI (az) installed and logged in
    - Terraform installed
    - Docker installed
    - Environment variables or .env file with secrets

EOF
}

# ===================================
# Parse Arguments
# ===================================

while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --init)
            INIT_BACKEND=true
            shift
            ;;
        --plan-only)
            PLAN_ONLY=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# ===================================
# Validate Environment
# ===================================

if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT. Must be dev, staging, or prod."
    exit 1
fi

print_header "RoomMaster Deployment - $ENVIRONMENT"

# ===================================
# Check Prerequisites
# ===================================

print_info "Checking prerequisites..."

# Check Azure CLI
if ! command -v az &> /dev/null; then
    print_error "Azure CLI not found. Please install: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi

# Check Terraform
if ! command -v terraform &> /dev/null; then
    print_error "Terraform not found. Please install: https://www.terraform.io/downloads.html"
    exit 1
fi

# Check Docker (only if not skipping build)
if [ "$SKIP_BUILD" = false ]; then
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Please install: https://docs.docker.com/get-docker/"
        exit 1
    fi
fi

# Check Azure login
if ! az account show &> /dev/null; then
    print_error "Not logged in to Azure. Please run: az login"
    exit 1
fi

AZURE_SUBSCRIPTION=$(az account show --query name -o tsv)
print_success "Azure CLI ready (Subscription: $AZURE_SUBSCRIPTION)"

# ===================================
# Load Environment Variables
# ===================================

print_info "Loading environment variables..."

# Load from .env file if exists
ENV_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"
if [ -f "$ENV_FILE" ]; then
    print_info "Loading from $ENV_FILE"
    set -a
    source "$ENV_FILE"
    set +a
fi

# Validate required variables
REQUIRED_VARS=(
    "DATABASE_URL"
    "JWT_SECRET"
    "SWAGGER_PASSWORD"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    print_error "Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    print_info "Please set them in $ENV_FILE or export them"
    exit 1
fi

print_success "Environment variables loaded"

# ===================================
# Get ACR Details
# ===================================

print_info "Fetching Azure Container Registry details..."

ACR_NAME="acrroommaster${ENVIRONMENT}"
ACR_RG="rg-roommaster-${ENVIRONMENT}"

# Check if ACR exists
if ! az acr show --name "$ACR_NAME" --resource-group "$ACR_RG" &> /dev/null; then
    print_warning "ACR not found. Will be created by Terraform."
    ACR_EXISTS=false
else
    ACR_EXISTS=true
    ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --resource-group "$ACR_RG" --query loginServer -o tsv)
    print_success "ACR found: $ACR_LOGIN_SERVER"
fi

# ===================================
# Build and Push Docker Image
# ===================================

if [ "$SKIP_BUILD" = false ]; then
    print_header "Building Docker Image"
    
    IMAGE_TAG="$(git rev-parse --short HEAD)"
    IMAGE_NAME="roommaster"
    
    if [ "$ACR_EXISTS" = true ]; then
        FULL_IMAGE="$ACR_LOGIN_SERVER/$IMAGE_NAME:$IMAGE_TAG"
        
        print_info "Building image: $FULL_IMAGE"
        docker build -t "$FULL_IMAGE" -f "$PROJECT_ROOT/Dockerfile" "$PROJECT_ROOT"
        
        print_info "Logging in to ACR..."
        az acr login --name "$ACR_NAME"
        
        print_info "Pushing image to ACR..."
        docker push "$FULL_IMAGE"
        
        # Also tag as latest
        docker tag "$FULL_IMAGE" "$ACR_LOGIN_SERVER/$IMAGE_NAME:latest"
        docker push "$ACR_LOGIN_SERVER/$IMAGE_NAME:latest"
        
        print_success "Image pushed: $FULL_IMAGE"
    else
        print_warning "Skipping image build - ACR doesn't exist yet. Run terraform first."
        IMAGE_TAG="latest"
    fi
else
    print_info "Skipping Docker build"
    IMAGE_TAG="latest"
fi

# ===================================
# Terraform Deployment
# ===================================

print_header "Terraform Deployment"

cd "$TERRAFORM_DIR"

# Initialize backend
if [ "$INIT_BACKEND" = true ]; then
    print_info "Initializing Terraform backend..."
    
    # These should be set in environment or .env file
    TF_STATE_RG="${TF_STATE_RESOURCE_GROUP:-rg-terraform-state}"
    TF_STATE_SA="${TF_STATE_STORAGE_ACCOUNT:-stroommasterstate}"
    TF_STATE_CONTAINER="${TF_STATE_CONTAINER:-tfstate}"
    
    terraform init \
        -backend-config="resource_group_name=$TF_STATE_RG" \
        -backend-config="storage_account_name=$TF_STATE_SA" \
        -backend-config="container_name=$TF_STATE_CONTAINER" \
        -backend-config="key=roommaster-${ENVIRONMENT}.tfstate"
    
    print_success "Terraform initialized"
else
    terraform init
fi

# Format check
print_info "Checking Terraform formatting..."
terraform fmt -check || terraform fmt

# Validate
print_info "Validating Terraform configuration..."
terraform validate

# Plan
print_info "Running Terraform plan..."
terraform plan \
    -var="environment=$ENVIRONMENT" \
    -var="database_url=$DATABASE_URL" \
    -var="jwt_secret=$JWT_SECRET" \
    -var="swagger_password=$SWAGGER_PASSWORD" \
    -var="container_image=roommaster:$IMAGE_TAG" \
    -out=tfplan

if [ "$PLAN_ONLY" = true ]; then
    print_success "Plan completed. Exiting (plan-only mode)."
    exit 0
fi

# Apply
print_warning "About to apply Terraform changes..."
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    print_info "Deployment cancelled"
    exit 0
fi

print_info "Applying Terraform..."
terraform apply tfplan

# ===================================
# Get Deployment Info
# ===================================

print_header "Deployment Complete"

APP_URL=$(terraform output -raw container_app_url)
APP_FQDN=$(terraform output -raw container_app_fqdn)

print_success "Application deployed successfully!"
echo ""
echo "📱 Application URL: $APP_URL"
echo "🌐 FQDN: $APP_FQDN"
echo ""

# ===================================
# Health Check
# ===================================

print_info "Running health check..."
sleep 10

HEALTH_URL="$APP_URL/health"
MAX_ATTEMPTS=10
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    print_info "Health check attempt $ATTEMPT/$MAX_ATTEMPTS..."
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Health check passed! Application is running."
        echo ""
        print_info "Useful commands:"
        echo "  - View logs: az containerapp logs show --name roommaster-api --resource-group $ACR_RG --follow"
        echo "  - SSH into container: az containerapp exec --name roommaster-api --resource-group $ACR_RG"
        echo "  - Scale app: az containerapp update --name roommaster-api --resource-group $ACR_RG --min-replicas 2 --max-replicas 10"
        exit 0
    fi
    
    print_warning "Health check returned $HTTP_CODE, waiting..."
    sleep 10
    ATTEMPT=$((ATTEMPT + 1))
done

print_error "Health check failed after $MAX_ATTEMPTS attempts"
print_info "Check application logs: az containerapp logs show --name roommaster-api --resource-group $ACR_RG --follow"
exit 1
