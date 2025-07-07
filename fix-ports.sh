#!/bin/bash

echo "🔧 Zyvo Cluster - Port Permission Fix"
echo "====================================="

echo "🔍 Checking current unprivileged port start..."
current_port=$(sysctl net.ipv4.ip_unprivileged_port_start | cut -d' ' -f3)
echo "Current unprivileged port start: $current_port"

if [ "$current_port" -le 80 ]; then
    echo "✅ Ports 80/443 are already available for unprivileged users"
else
    echo "❌ Ports 80/443 require privileged access"
    echo ""
    echo "🛠️  Applying fix..."
    
    # Check if we have sudo access
    if sudo -n true 2>/dev/null; then
        echo "📝 Setting unprivileged port start to 80..."
        
        # Apply temporary fix
        sudo sysctl net.ipv4.ip_unprivileged_port_start=80
        
        # Apply permanent fix
        if ! grep -q "net.ipv4.ip_unprivileged_port_start=80" /etc/sysctl.conf; then
            echo 'net.ipv4.ip_unprivileged_port_start=80' | sudo tee -a /etc/sysctl.conf
            echo "✅ Permanent fix applied to /etc/sysctl.conf"
        else
            echo "✅ Permanent fix already exists in /etc/sysctl.conf"
        fi
        
        # Reload sysctl
        sudo sysctl -p >/dev/null 2>&1
        
        echo "🎉 Port permissions fixed!"
        echo ""
        echo "🚀 You can now run:"
        echo "   podman-compose down"
        echo "   podman-compose up -d"
        
    else
        echo "❌ sudo access required to fix port permissions"
        echo ""
        echo "💡 Manual options:"
        echo "   1. Run: sudo sysctl net.ipv4.ip_unprivileged_port_start=80"
        echo "   2. Or use alternative ports (8080:80, 8443:443) in podman-compose.yml"
        echo "   3. Or run with: sudo podman-compose up -d"
    fi
fi

echo ""
echo "🔍 Final check..."
final_port=$(sysctl net.ipv4.ip_unprivileged_port_start | cut -d' ' -f3)
echo "Unprivileged port start is now: $final_port"

if [ "$final_port" -le 80 ]; then
    echo "✅ Ready to run cluster on ports 80/443"
else
    echo "⚠️  Still need to address port permissions"
fi
