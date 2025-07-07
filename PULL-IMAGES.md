# Container Image Setup for Zyvo Cluster

## Pull Required Images

Before starting the cluster, you need to pull the container images that will be used by the services.

### 1. Pull All Required Images

Run these commands to pull all the necessary container images:

```bash
# Pull nginx images (used for reverse proxy and test services)
podman pull docker.io/library/nginx:alpine

# Pull Redis image
podman pull docker.io/library/redis:7-alpine

# Pull MongoDB image  
podman pull docker.io/library/mongo:7

# Pull Certbot image (for SSL certificates)
podman pull docker.io/certbot/certbot:latest
```

**Note**: Podman can often resolve short names automatically, but specifying the full registry path (`docker.io/`) is more explicit and reliable.

### 2. Alternative: Pull All Images at Once

You can also pull all images in one command:

```bash
podman pull docker.io/library/nginx:alpine docker.io/library/redis:7-alpine docker.io/library/mongo:7 docker.io/certbot/certbot:latest
```

Or for shorter commands (Podman will resolve to docker.io automatically):

```bash
podman pull nginx:alpine redis:7-alpine mongo:7 certbot/certbot
```

### 3. Verify Images are Downloaded

Check that all images are available locally:

```bash
podman images
```

You should see output similar to:
```
REPOSITORY                TAG         IMAGE ID      CREATED       SIZE
docker.io/library/nginx   alpine      2bc7edbc3cf2  2 weeks ago   40.7 MB
docker.io/library/redis   7-alpine    3358aea34e8c  3 weeks ago   31.6 MB
docker.io/library/mongo   7           a15b7e8cad6b  2 weeks ago   762 MB
docker.io/certbot/certbot latest      4e5b7e8d9f3a  1 week ago    92.1 MB
```

### 4. Start the Cluster

Once all images are pulled, you can start the cluster:

```bash
# Start all services in detached mode
podman-compose up -d

# Check status
podman-compose ps

# View logs
podman-compose logs -f
```

### 5. Troubleshooting

If you encounter issues:

```bash
# Check if podman-compose is working
podman-compose --version

# Pull images individually with full registry paths if bulk pull fails
podman pull docker.io/library/nginx:alpine
podman pull docker.io/library/redis:7-alpine  
podman pull docker.io/library/mongo:7
podman pull docker.io/certbot/certbot:latest

# Check available storage space
df -h

# Clean up old images if needed (optional)
podman image prune

# If you get registry resolution issues, configure registries
cat /etc/containers/registries.conf
```

### 6. Quick Start Script

You can also create a quick setup script:

```bash
#!/bin/bash
echo "Pulling required container images..."

# Array of images to pull with full registry paths
images=(
    "docker.io/library/nginx:alpine"
    "docker.io/library/redis:7-alpine" 
    "docker.io/library/mongo:7"
    "docker.io/certbot/certbot:latest"
)

# Pull each image
for image in "${images[@]}"; do
    echo "Pulling $image..."
    podman pull "$image"
    if [ $? -eq 0 ]; then
        echo "✅ Successfully pulled $image"
    else
        echo "❌ Failed to pull $image"
        exit 1
    fi
done

echo "🎉 All images pulled successfully!"
echo "You can now run: podman-compose up -d"
```

Save this as `pull-images.sh`, make it executable with `chmod +x pull-images.sh`, and run it with `./pull-images.sh`.

## Image Details

- **nginx:alpine** (~40MB) - Lightweight web server for services and reverse proxy
- **redis:7-alpine** (~32MB) - In-memory cache and session store
- **mongo:7** (~762MB) - Primary database (largest image)
- **certbot/certbot** (~92MB) - SSL certificate management (disabled for IP deployment)

**Total Download Size**: ~926MB

The images will be cached locally after the first download, so subsequent deployments will be much faster.

## Podman Registry Notes

Podman uses different default registries compared to Docker. Here's what you should know:

### Registry Resolution
- **Full paths recommended**: `docker.io/library/nginx:alpine` 
- **Short names work**: `nginx:alpine` (Podman resolves to docker.io automatically)
- **Explicit is better**: Using full registry paths avoids ambiguity

### Default Registries
Podman typically searches these registries in order:
1. `registry.fedoraproject.org`
2. `registry.access.redhat.com` 
3. `docker.io`

### Check Your Registry Configuration
```bash
# View current registry configuration
cat /etc/containers/registries.conf

# Or check user-specific config
cat ~/.config/containers/registries.conf
```

### Alternative Registries
If you prefer other registries, you can also pull from:
```bash
# From Quay.io (Red Hat's registry)
podman pull quay.io/library/nginx:alpine

# From other registries as available
podman pull ghcr.io/library/nginx:alpine
```

For this deployment, we recommend sticking with `docker.io` since all the required images are readily available there.

## Troubleshooting: Privileged Port Issues

### Problem: Cannot bind to ports 80/443
If you see this error:
```
rootlessport cannot expose privileged port 80, you can add 'net.ipv4.ip_unprivileged_port_start=80' to /etc/sysctl.conf (currently 1024), or choose a larger port number (>= 1024)
```

This happens because non-root users cannot bind to privileged ports (< 1024) by default.

### Solution 1: Allow Unprivileged Port Binding (Recommended)

Allow your user to bind to port 80 and 443:

```bash
# Option A: Temporary fix (until reboot)
sudo sysctl net.ipv4.ip_unprivileged_port_start=80

# Option B: Permanent fix
echo 'net.ipv4.ip_unprivileged_port_start=80' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

After running either command, try starting the cluster again:
```bash
podman-compose down
podman-compose up -d
```

### Solution 2: Use Alternative Ports

If you can't modify system settings, update the ports in `podman-compose.yml`:

```yaml
# In the nginx service section, change:
ports:
  - "8080:80"    # Instead of "80:80"
  - "8443:443"   # Instead of "443:443"
```

Then access your services at:
- Main application: `http://44.247.215.244:8080`
- Individual services: `http://44.247.215.244:8080/api/service1/`

### Solution 3: Run with Root (Not Recommended)

```bash
# Only if other solutions don't work
sudo podman-compose up -d
```

### Solution 4: Use Podman with systemd (Advanced)

For production deployments, consider running as a systemd service:

```bash
# Generate systemd unit files
podman-compose --log-level info up -d
podman generate systemd --new --name zyvo-nginx --files

# Enable and start as system service
sudo mv *.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now container-zyvo-nginx.service
```

### Recommended Approach

For development/testing: **Use Solution 1** (allow unprivileged port binding)
For production: **Use Solution 1** or **Solution 4** (systemd service)

### Verify the Fix

After applying any solution, verify the cluster is running:

```bash
# Check container status
podman-compose ps

# Test access
curl http://44.247.215.244/health
# or
curl http://44.247.215.244:8080/health  # if using alternative ports
```
