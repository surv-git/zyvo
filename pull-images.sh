#!/bin/bash

echo "🚀 Zyvo Cluster - Container Image Setup"
echo "======================================="

# Array of images to pull
images=(
    "nginx:alpine"
    "redis:7-alpine" 
    "mongo:7"
    "certbot/certbot"
)

echo "📦 Pulling required container images..."
echo ""

# Pull each image
for image in "${images[@]}"; do
    echo "⬇️  Pulling $image..."
    podman pull "$image"
    if [ $? -eq 0 ]; then
        echo "✅ Successfully pulled $image"
    else
        echo "❌ Failed to pull $image"
        echo "💡 Try running: podman pull docker.io/library/$image"
        exit 1
    fi
    echo ""
done

echo "🎉 All images pulled successfully!"
echo ""
echo "📋 Verifying images..."
podman images | grep -E "(nginx|redis|mongo|certbot)"
echo ""
echo "🚀 Ready to deploy! Run the following command:"
echo "   podman-compose up -d"
echo ""
echo "🌐 Once running, access your cluster at:"
echo "   http://44.247.215.244"
