#!/bin/bash

# VyaparMitra Production Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

# Configuration
APP_NAME="vyaparmitra"
DOCKER_IMAGE="ghcr.io/uday68/vyaparmitra"
BACKUP_DIR="/var/backups/vyaparmitra"
LOG_FILE="/var/log/vyaparmitra/deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running"
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check if required directories exist
    sudo mkdir -p "$BACKUP_DIR" "$(dirname "$LOG_FILE")"
    sudo chown -R $USER:$USER "$BACKUP_DIR" "$(dirname "$LOG_FILE")"
    
    log "Prerequisites check completed"
}

# Backup current deployment
backup_current() {
    log "Creating backup of current deployment..."
    
    local backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/backup_$backup_timestamp"
    
    mkdir -p "$backup_path"
    
    # Backup database
    if docker-compose ps | grep -q postgres; then
        info "Backing up PostgreSQL database..."
        docker-compose exec -T postgres pg_dump -U vyapar_user vyapar_mitra_prod > "$backup_path/postgres_backup.sql"
    fi
    
    if docker-compose ps | grep -q mongodb; then
        info "Backing up MongoDB database..."
        docker-compose exec -T mongodb mongodump --db vyapar_mitra_prod --archive > "$backup_path/mongodb_backup.archive"
    fi
    
    # Backup configuration files
    cp -r .env* "$backup_path/" 2>/dev/null || true
    cp docker-compose.production.yml "$backup_path/" 2>/dev/null || true
    
    # Backup uploaded files
    if [ -d "./uploads" ]; then
        cp -r ./uploads "$backup_path/"
    fi
    
    log "Backup created at $backup_path"
    echo "$backup_path" > "$BACKUP_DIR/latest_backup.txt"
}

# Pull latest Docker images
pull_images() {
    log "Pulling latest Docker images..."
    
    # Get the latest tag from environment or use 'latest'
    local image_tag=${DEPLOY_TAG:-latest}
    
    docker pull "$DOCKER_IMAGE:$image_tag" || error "Failed to pull Docker image"
    
    log "Docker images pulled successfully"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Start only the database services first
    docker-compose -f docker-compose.production.yml up -d postgres mongodb redis
    
    # Wait for databases to be ready
    info "Waiting for databases to be ready..."
    sleep 30
    
    # Run migrations
    docker-compose -f docker-compose.production.yml run --rm app npm run migrate:up || error "Database migration failed"
    
    log "Database migrations completed"
}

# Deploy application
deploy_app() {
    log "Deploying application..."
    
    # Stop current services gracefully
    if docker-compose -f docker-compose.production.yml ps | grep -q Up; then
        info "Stopping current services..."
        docker-compose -f docker-compose.production.yml down --timeout 30
    fi
    
    # Start all services
    docker-compose -f docker-compose.production.yml up -d
    
    log "Application deployed successfully"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        info "Health check attempt $attempt/$max_attempts"
        
        if curl -f -s http://localhost:4000/api/health > /dev/null; then
            log "Health check passed"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
}

# Smoke tests
run_smoke_tests() {
    log "Running smoke tests..."
    
    # Test API endpoints
    local endpoints=(
        "/api/health"
        "/api/products?page=1&limit=5"
        "/api/voice/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        info "Testing endpoint: $endpoint"
        if ! curl -f -s "http://localhost:4000$endpoint" > /dev/null; then
            warn "Smoke test failed for endpoint: $endpoint"
        fi
    done
    
    log "Smoke tests completed"
}

# Cleanup old images and containers
cleanup() {
    log "Cleaning up old Docker images and containers..."
    
    # Remove unused images (keep last 3 versions)
    docker images "$DOCKER_IMAGE" --format "table {{.Tag}}\t{{.ID}}" | tail -n +4 | awk '{print $2}' | xargs -r docker rmi || true
    
    # Remove unused containers
    docker container prune -f || true
    
    # Remove unused volumes (be careful with this)
    # docker volume prune -f || true
    
    log "Cleanup completed"
}

# Rollback function
rollback() {
    error_msg="$1"
    warn "Deployment failed: $error_msg"
    warn "Initiating rollback..."
    
    if [ -f "$BACKUP_DIR/latest_backup.txt" ]; then
        local backup_path=$(cat "$BACKUP_DIR/latest_backup.txt")
        
        if [ -d "$backup_path" ]; then
            info "Rolling back to backup: $backup_path"
            
            # Stop current services
            docker-compose -f docker-compose.production.yml down --timeout 30
            
            # Restore configuration
            cp "$backup_path"/.env* . 2>/dev/null || true
            cp "$backup_path"/docker-compose.production.yml . 2>/dev/null || true
            
            # Restore databases
            if [ -f "$backup_path/postgres_backup.sql" ]; then
                docker-compose -f docker-compose.production.yml up -d postgres
                sleep 30
                docker-compose -f docker-compose.production.yml exec -T postgres psql -U vyapar_user -d vyapar_mitra_prod < "$backup_path/postgres_backup.sql"
            fi
            
            if [ -f "$backup_path/mongodb_backup.archive" ]; then
                docker-compose -f docker-compose.production.yml up -d mongodb
                sleep 30
                docker-compose -f docker-compose.production.yml exec -T mongodb mongorestore --db vyapar_mitra_prod --archive < "$backup_path/mongodb_backup.archive"
            fi
            
            # Start services
            docker-compose -f docker-compose.production.yml up -d
            
            log "Rollback completed"
        else
            error "Backup directory not found: $backup_path"
        fi
    else
        error "No backup information found for rollback"
    fi
}

# Main deployment function
main() {
    log "Starting VyaparMitra deployment..."
    
    # Set trap for error handling
    trap 'rollback "Deployment script failed"' ERR
    
    check_root
    check_prerequisites
    backup_current
    pull_images
    run_migrations
    deploy_app
    health_check
    run_smoke_tests
    cleanup
    
    log "Deployment completed successfully!"
    
    # Send notification (if configured)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data '{"text":"🚀 VyaparMitra deployment completed successfully!"}' \
            "$SLACK_WEBHOOK_URL" || true
    fi
}

# Script usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -t, --tag TAG  Deploy specific image tag (default: latest)"
    echo "  -r, --rollback Rollback to previous deployment"
    echo ""
    echo "Environment variables:"
    echo "  DEPLOY_TAG         Docker image tag to deploy"
    echo "  SLACK_WEBHOOK_URL  Slack webhook for notifications"
}

# Handle command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -t|--tag)
            DEPLOY_TAG="$2"
            shift 2
            ;;
        -r|--rollback)
            rollback "Manual rollback requested"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Run main function
main