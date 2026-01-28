#!/usr/bin/env bash

set -e

# Check OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     OS_TYPE="linux" ;;
    Darwin*)    OS_TYPE="macos" ;;
    *)
        echo "❌ Unsupported OS: ${OS}"
        exit 1
        ;;
esac

echo "📱 ОС: ${OS_TYPE}"

# Check docker
if ! command -v docker >/dev/null 2>&1; then
    echo "❌ Docker not install"
    exit 1
fi

CMD=""

if docker compose version >/dev/null 2>&1; then
    CMD="docker compose"
    echo "🔧 Usage: docker compose (plugin)"
elif command -v docker-compose >/dev/null 2>&1; then
    CMD="docker-compose"
    echo "🔧 Usage: docker-compose (util)"
else
    echo "❌ Docker Compose not install!"
    echo ""
    echo "Install depending on the system:"
    echo "  Ubuntu (Docker-cli):    sudo apt install docker-compose-plugin"
    echo "  MacOS (Colima):         brew install colima docker docker-compose docker-buildx"
    echo "  Or:                     Docker Desktop"
    exit 1
fi

${CMD:?} -f docker-compose.yaml "$@"
