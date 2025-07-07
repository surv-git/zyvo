# Zyvo Podman Compose Cluster

This repository contains a complete Podman Compose setup for deploying a microservices cluster with:

- **Nginx** - Reverse proxy with SSL termination and load balancing
- **Redis** - In-memory cache and session store
- **MongoDB** - Primary database
- **Let's Encrypt** - Automated SSL certificate management
- **4 Web Services** - Application services using local Podman images

## Prerequisites

1. **Podman and Podman Compose** installed on your system
2. **Test Setup**: Uses nginx:alpine containers with custom HTML content (no custom images needed)

## Quick Start

### 1. Configure Your IP Address and Passwords

**In `podman-compose.yml`:**
- The configuration is set for IP address: `44.247.215.244`
- Update passwords:
  - `your-redis-password`
  - `your-mongo-password`

**In `nginx/conf.d/default.conf`:**
- Configured for IP address: `44.247.215.244`

**Note:** SSL/HTTPS is disabled for IP-based deployment since Let's Encrypt doesn't issue certificates for IP addresses. The setup uses HTTP on port 80.

### 2. Ready to Deploy

The setup now uses simple nginx:alpine containers with pre-built HTML content for testing. No custom image building required!

Each service has its own colorful landing page located in:
- `./test-content/main/` - Main landing page with service overview
- `./test-content/service1/` - Service 1 content
- `./test-content/service2/` - Service 2 content  
- `./test-content/service3/` - Service 3 content
- `./test-content/service4/` - Service 4 content

### 3. Start the Cluster

```bash
# Start all services
podman-compose up -d

# Check status
podman-compose ps

# View logs
podman-compose logs -f
```

### 4. Access Your Services

- **Main application**: `http://44.247.215.244`
- **Individual services**:
  - Service 1: `http://44.247.215.244/api/service1/`
  - Service 2: `http://44.247.215.244/api/service2/`
  - Service 3: `http://44.247.215.244/api/service3/`
  - Service 4: `http://44.247.215.244/api/service4/`
- **Health check**: `http://44.247.215.244/health`

**Note:** Services are accessible via HTTP (port 80) since SSL certificates are not available for IP addresses.

### 5. SSL Certificate Setup (Not Available for IP Deployment)

**Important:** Let's Encrypt does not issue SSL certificates for IP addresses. This deployment uses HTTP only.

If you want SSL/HTTPS in the future:
1. Obtain a domain name and point it to your server IP (44.247.215.244)
2. Update the configuration files to use your domain instead of the IP
3. Uncomment the HTTPS server block in `nginx/conf.d/default.conf`
4. Update the certbot service in `podman-compose.yml`

## Management Commands

```bash
# Start all services
podman-compose up -d

# Stop all services
podman-compose down

# View logs for a specific service
podman-compose logs service1

# Scale a service (if needed)
podman-compose up -d --scale service1=3

# Restart a service
podman-compose restart service1

# Update images and restart
podman-compose pull && podman-compose up -d

# Connect to MongoDB
podman exec -it zyvo-mongodb mongosh -u admin -p your-mongo-password

# Connect to Redis
podman exec -it zyvo-redis redis-cli -a your-redis-password
```

## Service Configuration

Each service has the following environment variables available:

- `NODE_ENV=production`
- `REDIS_URL=redis://redis:6379`
- `MONGODB_URL=mongodb://admin:your-mongo-password@mongodb:27017/zyvo?authSource=admin`
- `SERVICE_NAME=serviceX`
- `PORT=3000`

## Load Balancing

Nginx is configured with least-connection load balancing across all 4 services. You can also access individual services directly via their API routes.

## Data Persistence

- **Redis data**: Stored in `redis-data` volume
- **MongoDB data**: Stored in `mongodb-data` volume
- **SSL certificates**: Stored in `./certbot/conf` directory

## Security Features

- SSL/TLS encryption with Let's Encrypt certificates
- Security headers (HSTS, CSP, X-Frame-Options, etc.)
- Password-protected Redis and MongoDB
- Private network for service communication
- Health checks for all services

## Troubleshooting

1. **SSL Certificate Issues**: Check that your domain is properly configured and accessible
2. **Service Connection Issues**: Verify all services are using the correct network configuration
3. **Database Connection Issues**: Check MongoDB and Redis credentials and network connectivity

## Monitoring

Check service health:
```bash
# Overall status
podman-compose ps

# Individual service health
curl http://44.247.215.244/health
curl http://44.247.215.244/api/service1/
```

## Updating Services

To update your service images:

1. Build new versions of your images
2. Run: `podman-compose up -d` (will pull new images and restart changed services)

This setup provides a production-ready foundation for your microservices architecture with proper load balancing, SSL termination, and data persistence.
