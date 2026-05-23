#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# ByteStash Dev Environment Setup & Launch
# ──────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ──────────────────────────────────────────────
# 1. OS Detection
# ──────────────────────────────────────────────
detect_os() {
    case "$(uname -s)" in
        Linux*)  OS="linux" ;;
        Darwin*) OS="macos" ;;
        CYGWIN*|MINGW*|MSYS*)
            error "Windows is not supported. Please use WSL (Windows Subsystem for Linux)." ;;
        *)
            error "Unsupported operating system: $(uname -s)" ;;
    esac
    info "Detected OS: $OS"
}

# ──────────────────────────────────────────────
# 2. Docker Check
# ──────────────────────────────────────────────
check_docker() {
    if ! command -v docker &>/dev/null; then
        error "Docker is not installed. Please install Docker first: https://docs.docker.com/get-docker/"
    fi

    if ! docker info &>/dev/null; then
        error "Docker daemon is not running. Please start Docker and try again."
    fi

    info "Docker is installed and running."
}

# ──────────────────────────────────────────────
# 3. NVM + Node Check
# ──────────────────────────────────────────────
check_nvm_and_node() {
    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

    if [[ -s "$NVM_DIR/nvm.sh" ]]; then
        source "$NVM_DIR/nvm.sh"
    fi

    if ! command -v nvm &>/dev/null; then
        error "nvm is not installed. Install it from: https://github.com/nvm-sh/nvm#installing-and-updating"
    fi

    info "nvm is installed."

    if ! node --version &>/dev/null; then
        warn "No active Node.js version found. Installing Node 22 via nvm..."
        nvm install 22
    fi

    NODE_MAJOR=$(node --version | sed 's/v\([0-9]*\).*/\1/')
    if [[ "$NODE_MAJOR" -ne 22 ]]; then
        warn "Node.js $(node --version) detected. Switching to Node 22 to match the dev container..."
        nvm install 22
        nvm use 22
    fi

    info "Node.js $(node --version) is active."
}

# ──────────────────────────────────────────────
# 4. Build Dependencies Check (native modules)
# ──────────────────────────────────────────────
check_build_deps() {
    local missing=()

    for cmd in python3 make gcc g++; do
        if ! command -v "$cmd" &>/dev/null; then
            missing+=("$cmd")
        fi
    done

    if [[ ${#missing[@]} -gt 0 ]]; then
        warn "Missing build dependencies: ${missing[*]}"
        echo ""
        if [[ "$OS" == "macos" ]]; then
            echo "  Install Xcode CLI tools:  xcode-select --install"
            echo "  Install Python 3:         brew install python3"
        elif [[ "$OS" == "linux" ]]; then
            echo "  Debian/Ubuntu:  sudo apt install build-essential python3"
            echo "  Fedora/RHEL:    sudo dnf install gcc gcc-c++ make python3"
            echo "  Arch:           sudo pacman -S base-devel python"
        fi
        echo ""
        error "Please install the missing dependencies and re-run this script."
    fi

    info "Build dependencies are available."
}

# ──────────────────────────────────────────────
# 5. Docker Compose Variant Detection
# ──────────────────────────────────────────────
detect_compose() {
    if docker compose version &>/dev/null; then
        COMPOSE="docker compose"
    elif command -v docker-compose &>/dev/null; then
        COMPOSE="docker-compose"
    else
        error "Neither 'docker compose' nor 'docker-compose' is available. Please install Docker Compose."
    fi

    info "Using compose command: $COMPOSE"
}

# ──────────────────────────────────────────────
# 6. Install Dependencies & Launch
# ──────────────────────────────────────────────
install_and_launch() {
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    cd "$SCRIPT_DIR"

    if [[ ! -f "docker-compose-dev.yaml" ]]; then
        error "docker-compose-dev.yaml not found. Run this script from the ByteStash project root."
    fi

    info "Installing client dependencies..."
    npm install --prefix client

    info "Installing server dependencies..."
    npm install --prefix server

    info "Cleaning old containers and volumes..."
    $COMPOSE -f docker-compose-dev.yaml down -v

    info "Starting dev containers..."
    $COMPOSE -f docker-compose-dev.yaml up --build
}

# ──────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────
main() {
    echo ""
    echo "========================================="
    echo "  ByteStash Dev Environment Setup"
    echo "========================================="
    echo ""

    detect_os
    check_docker
    check_nvm_and_node
    check_build_deps
    detect_compose
    install_and_launch
}

main