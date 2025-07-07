# Port Permission Issue - Quick Fix Guide

## The Problem
```
rootlessport cannot expose privileged port 80, you can add 'net.ipv4.ip_unprivileged_port_start=80' to /etc/sysctl.conf (currently 1024), or choose a larger port number (>= 1024)
```

This error occurs because Podman running in rootless mode cannot bind to privileged ports (< 1024) like ports 80 and 443.

## Quick Solutions

### Option 1: Fix Port Permissions (Recommended)
```bash
# Run the automated fix script
./fix-ports.sh

# Or manually:
sudo sysctl net.ipv4.ip_unprivileged_port_start=80
echo 'net.ipv4.ip_unprivileged_port_start=80' | sudo tee -a /etc/sysctl.conf
```

Then restart your cluster:
```bash
podman-compose down
podman-compose up -d
```

Access at: `http://44.247.215.244`

### Option 2: Use Alternative Ports
```bash
# Use the alternative compose file with ports 8080/8443
podman-compose -f podman-compose-alt-ports.yml up -d
```

Access at: `http://44.247.215.244:8080`

### Option 3: Run as Root (Not Recommended)
```bash
sudo podman-compose up -d
```

## Files Available

- `podman-compose.yml` - Standard version (ports 80/443)
- `podman-compose-alt-ports.yml` - Alternative ports version (8080/8443)
- `fix-ports.sh` - Automated port permission fix script
- `PULL-IMAGES.md` - Complete troubleshooting guide

## Verification

After applying any fix:
```bash
# Check container status
podman-compose ps

# Test access (adjust port as needed)
curl http://44.247.215.244/health
curl http://44.247.215.244:8080/health  # if using alt ports
```

## Production Recommendation

For production environments, use **Option 1** (fix port permissions) as it allows standard HTTP/HTTPS ports and better integration with load balancers and DNS.
