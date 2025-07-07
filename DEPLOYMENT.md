# Zyvo Podman Compose Cluster

This repository contains a complete Podman Compose setup for deploying a microservices cluster with:

- **Nginx** - Reverse proxy with SSL termination and load balancing
- **Redis** - In-memory cache and session store
- **MongoDB** - Primary database
- **Let's Encrypt** - Automated SSL certificate management
- **4 Web Services** - Application services using local Podman images

## Prerequisites

1. **Podman and Podman Compose** installed on your system
2. **Local Podman images** built for your services:
   - `localhost/zyvo-service1:latest`
   - `localhost/zyvo-service2:latest`
   - `localhost/zyvo-service3:latest`
   - `localhost/zyvo-service4:latest`

## Quick Start

### 1. Configure Your Domain and Email

Before starting, update the following in the configuration files:

**In `podman-compose.yml`:**
- Replace `your-email@domain.com` with your actual email
- Replace `your-domain.com` with your actual domain
- Update passwords:
  - `your-redis-password`
  - `your-mongo-password`

**In `nginx/conf.d/default.conf`:**
- Replace `your-domain.com` with your actual domain

### 2. Build Your Service Images (Example for testing)

For testing, you can create simple web service images:

```bash
# Create a simple test service
mkdir -p test-service
cat > test-service/Dockerfile << EOF
FROM node:18-alpine
WORKDIR /app
RUN npm init -y && npm install express
COPY server.js .
EXPOSE 3000
CMD ["node", "server.js"]
EOF

cat > test-service/server.js << EOF
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || 'unknown';

app.get('/', (req, res) => {
    res.json({ 
        service: SERVICE_NAME, 
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(\`\${SERVICE_NAME} running on port \${PORT}\`);
});
EOF

# Build images for all services
for i in {1..4}; do
    podman build -t localhost/zyvo-service$i:latest test-service/
done
```

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

- **Main application**: `https://your-domain.com`
- **Individual services**:
  - Service 1: `https://your-domain.com/api/service1/`
  - Service 2: `https://your-domain.com/api/service2/`
  - Service 3: `https://your-domain.com/api/service3/`
  - Service 4: `https://your-domain.com/api/service4/`
- **Health check**: `https://your-domain.com/health`

### 5. SSL Certificate Setup

The Let's Encrypt certificate will be automatically requested on first run. Make sure:

1. Your domain points to your server's IP address
2. Ports 80 and 443 are accessible from the internet
3. You've updated the email and domain in the configuration

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
curl https://your-domain.com/health
curl https://your-domain.com/api/service1/
```

## Updating Services

To update your service images:

1. Build new versions of your images
2. Run: `podman-compose up -d` (will pull new images and restart changed services)

This setup provides a production-ready foundation for your microservices architecture with proper load balancing, SSL termination, and data persistence.
