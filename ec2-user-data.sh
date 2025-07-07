#!/bin/bash

# EC2 User Data Script
# This script updates packages and installs Python3, Podman, and Podman Compose
# Compatible with Amazon Linux 2, Ubuntu, and other major Linux distributions

set -e  # Exit on any error

# Log all output to a file for debugging
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "Starting EC2 User Data Script - $(date)"

# Detect the OS distribution
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    echo "Cannot detect OS distribution"
    exit 1
fi

echo "Detected OS: $OS $VER"

# Function to update packages based on distribution
update_packages() {
    echo "Updating packages..."
    if [[ "$OS" == *"Amazon Linux"* ]]; then
        yum update -y
    elif [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        apt-get update -y
        apt-get upgrade -y
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]] || [[ "$OS" == *"AlmaLinux"* ]]; then
        if command -v dnf &> /dev/null; then
            dnf update -y
        else
            yum update -y
        fi
    else
        echo "Unsupported OS for automatic package updates: $OS"
        exit 1
    fi
    echo "Package update completed"
}

# Function to install Python3
install_python3() {
    echo "Installing Python3..."
    if [[ "$OS" == *"Amazon Linux"* ]]; then
        yum install -y python3 python3-pip
    elif [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        apt-get install -y python3 python3-pip python3-venv python3-full pipx
        # Configure pipx for system-wide access
        pipx ensurepath
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]] || [[ "$OS" == *"AlmaLinux"* ]]; then
        if command -v dnf &> /dev/null; then
            dnf install -y python3 python3-pip
        else
            yum install -y python3 python3-pip
        fi
    fi
    
    # Verify Python3 installation
    python3 --version
    pip3 --version
    if command -v pipx &> /dev/null; then
        pipx --version
    fi
    echo "Python3 installation completed"
}

# Function to install Git CLI
install_git() {
    echo "Installing Git CLI..."
    if [[ "$OS" == *"Amazon Linux"* ]]; then
        yum install -y git
    elif [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        apt-get install -y git
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]] || [[ "$OS" == *"AlmaLinux"* ]]; then
        if command -v dnf &> /dev/null; then
            dnf install -y git
        else
            yum install -y git
        fi
    fi
    
    # Verify Git installation
    git --version
    echo "Git CLI installation completed"
}

# Function to install Podman
install_podman() {
    echo "Installing Podman..."
    if [[ "$OS" == *"Amazon Linux"* ]]; then
        yum install -y podman
    elif [[ "$OS" == *"Ubuntu"* ]]; then
        # For Ubuntu, we need to add the repository for recent versions
        apt-get install -y software-properties-common
        if [[ "$VER" == "20.04" ]] || [[ "$VER" == "22.04" ]] || [[ "$VER" == "24.04" ]]; then
            apt-get update -y
            apt-get install -y podman
        else
            # For older Ubuntu versions, add the Kubic repository
            echo "deb https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/xUbuntu_${VER}/ /" > /etc/apt/sources.list.d/devel:kubic:libcontainers:stable.list
            curl -L "https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/xUbuntu_${VER}/Release.key" | apt-key add -
            apt-get update -y
            apt-get install -y podman
        fi
    elif [[ "$OS" == *"Debian"* ]]; then
        apt-get install -y podman
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]] || [[ "$OS" == *"AlmaLinux"* ]]; then
        if command -v dnf &> /dev/null; then
            dnf install -y podman
        else
            yum install -y podman
        fi
    fi
    
    # Verify Podman installation
    podman --version
    echo "Podman installation completed"
}

# Function to install Podman Compose
install_podman_compose() {
    echo "Installing Podman Compose..."
    
    # Try to install from package manager first
    if [[ "$OS" == *"Ubuntu"* ]] && [[ "$VER" == "22.04" || "$VER" == "24.04" ]]; then
        # For newer Ubuntu versions, try apt first
        if apt-cache show podman-compose &> /dev/null; then
            apt-get install -y podman-compose
            echo "Installed podman-compose from apt"
        else
            # Use pipx for isolated installation
            apt-get install -y pipx python3-full
            pipx install podman-compose
            # Make pipx binaries available system-wide
            ln -sf /root/.local/bin/podman-compose /usr/local/bin/podman-compose
            echo "Installed podman-compose via pipx"
        fi
    elif [[ "$OS" == *"Debian"* ]]; then
        # For Debian, try apt first, fallback to pipx
        if apt-cache show podman-compose &> /dev/null; then
            apt-get install -y podman-compose
            echo "Installed podman-compose from apt"
        else
            apt-get install -y pipx python3-full
            pipx install podman-compose
            ln -sf /root/.local/bin/podman-compose /usr/local/bin/podman-compose
            echo "Installed podman-compose via pipx"
        fi
    else
        # For other distributions (Amazon Linux, CentOS, RHEL, etc.)
        # These typically don't have the externally-managed-environment restriction
        if command -v pip3 &> /dev/null; then
            # Try pip3 with --break-system-packages flag as fallback
            pip3 install podman-compose 2>/dev/null || pip3 install --break-system-packages podman-compose
            echo "Installed podman-compose via pip3"
        else
            echo "Warning: pip3 not available, trying alternative installation"
            # Alternative: download and install manually
            curl -o /usr/local/bin/podman-compose https://raw.githubusercontent.com/containers/podman-compose/devel/podman_compose.py
            chmod +x /usr/local/bin/podman-compose
            echo "Installed podman-compose manually"
        fi
    fi
    
    # Verify installation
    if command -v podman-compose &> /dev/null; then
        podman-compose --version
        echo "Podman Compose installation completed successfully"
    else
        echo "Warning: podman-compose installation may have failed"
        echo "You may need to install it manually after boot"
    fi
}

# Function to configure Podman for the ec2-user (Amazon Linux) or ubuntu user
configure_podman() {
    echo "Configuring Podman..."
    
    # Determine the main user
    if [[ "$OS" == *"Amazon Linux"* ]]; then
        MAIN_USER="ec2-user"
    elif [[ "$OS" == *"Ubuntu"* ]]; then
        MAIN_USER="ubuntu"
    else
        MAIN_USER="ec2-user"  # Default fallback
    fi
    
    # Enable lingering for the user (allows user services to run without being logged in)
    if command -v loginctl &> /dev/null; then
        loginctl enable-linger $MAIN_USER
    fi
    
    # Create user's podman directories
    sudo -u $MAIN_USER mkdir -p /home/$MAIN_USER/.config/containers
    
    echo "Podman configuration completed for user: $MAIN_USER"
}

# Main execution
main() {
    echo "=== Starting EC2 Instance Setup ==="
    
    update_packages
    install_python3
    install_git
    install_podman
    install_podman_compose
    configure_podman
    
    echo "=== EC2 Instance Setup Completed Successfully ==="
    echo "Installation Summary:"
    echo "- Python3: $(python3 --version)"
    echo "- Pip3: $(pip3 --version)"
    echo "- Git: $(git --version)"
    echo "- Podman: $(podman --version)"
    echo "- Podman Compose: $(podman-compose --version)"
    echo ""
    echo "Log file available at: /var/log/user-data.log"
    echo "Setup completed at: $(date)"
}

# Run the main function
main
