#!/bin/bash
# SeanStash CLI Installation Script
# Installs seanstash command for Ubuntu/Debian systems

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="/usr/local/bin"
CONFIG_DIR="$HOME/.seanstash"
SCRIPT_NAME="seanstash"

echo -e "${BLUE}SeanStash CLI Installation${NC}"
echo "=========================="

# Check if running on Ubuntu/Debian
if ! command -v apt &> /dev/null; then
    echo -e "${RED}Error: This installer is designed for Ubuntu/Debian systems with apt package manager.${NC}"
    exit 1
fi

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}Installing Python 3...${NC}"
    sudo apt update
    sudo apt install -y python3 python3-pip
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo -e "${YELLOW}Installing pip...${NC}"
    sudo apt install -y python3-pip
fi

# Check Python dependencies
echo -e "${YELLOW}Checking Python dependencies...${NC}"
if python3 -c "import requests, configparser" 2>/dev/null; then
    echo -e "${GREEN}✓ Python dependencies already available!${NC}"
else
    echo -e "${YELLOW}Installing Python dependencies...${NC}"
    # Try different methods to handle externally-managed environments
    if [[ -f "requirements.txt" ]]; then
        pip3 install --user -r requirements.txt 2>/dev/null || \
        pip3 install --break-system-packages -r requirements.txt 2>/dev/null || \
        pip3 install --user requests configparser 2>/dev/null || \
        pip3 install --break-system-packages requests configparser 2>/dev/null || {
            echo -e "${RED}Warning: Could not install Python dependencies automatically.${NC}"
            echo -e "${YELLOW}Please install manually: pip3 install --user requests configparser${NC}"
            echo -e "${YELLOW}Or use: pip3 install --break-system-packages requests configparser${NC}"
        }
    else
        pip3 install --user requests configparser 2>/dev/null || \
        pip3 install --break-system-packages requests configparser 2>/dev/null || {
            echo -e "${RED}Warning: Could not install Python dependencies automatically.${NC}"
            echo -e "${YELLOW}Please install manually: pip3 install --user requests configparser${NC}"
        }
    fi
fi

# Copy the main script
echo -e "${YELLOW}Installing seanstash command...${NC}"
if [[ ! -f "seanstash.py" ]]; then
    echo -e "${RED}Error: seanstash.py not found in current directory.${NC}"
    echo "Please run this script from the cli/ directory."
    exit 1
fi

# Make the script executable and copy to bin directory
chmod +x seanstash.py
sudo cp seanstash.py "$INSTALL_DIR/$SCRIPT_NAME"

# Verify installation
if command -v seanstash &> /dev/null; then
    echo -e "${GREEN}✓ SeanStash CLI installed successfully!${NC}"
else
    echo -e "${RED}✗ Installation failed. Please check permissions and try again.${NC}"
    exit 1
fi

# Create config directory
mkdir -p "$CONFIG_DIR"

# Install convenient aliases
echo -e "${YELLOW}Installing convenient aliases...${NC}"
SHELL_RC=""
if [[ "$SHELL" == *"zsh"* ]] || [[ -f "$HOME/.zshrc" ]]; then
    SHELL_RC="$HOME/.zshrc"
elif [[ "$SHELL" == *"bash"* ]] || [[ -f "$HOME/.bashrc" ]]; then
    SHELL_RC="$HOME/.bashrc"
fi

if [[ -n "$SHELL_RC" ]]; then
    # Check if aliases already exist
    if ! grep -q "# SeanStash shortcuts" "$SHELL_RC" 2>/dev/null; then
        echo -e "\n# SeanStash shortcuts" >> "$SHELL_RC"
        echo 'alias ss="seanstash"' >> "$SHELL_RC"
        echo 'alias sss="seanstash status"' >> "$SHELL_RC"
        echo 'alias ssc="seanstash config"' >> "$SHELL_RC"
        echo -e "${GREEN}✓ Added aliases to $SHELL_RC${NC}"
        echo -e "${YELLOW}  Run 'source $SHELL_RC' or restart terminal to use aliases${NC}"
    else
        echo -e "${GREEN}✓ Aliases already installed${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Could not detect shell RC file. Add aliases manually:${NC}"
    echo '  alias ss="seanstash"'
    echo '  alias sss="seanstash status"'
    echo '  alias ssc="seanstash config"'
fi

# Display usage information
echo ""
echo -e "${GREEN}Installation Complete!${NC}"
echo "===================="
echo ""
echo -e "${BLUE}Basic Usage:${NC}"
echo "  seanstash                    # Sync recent commands to SeanStash"
echo "  seanstash config            # Interactive configuration setup"
echo "  seanstash status            # Show current status and connectivity"
echo "  seanstash --dry-run         # Preview what would be sent"
echo "  seanstash --limit 100       # Sync last 100 commands"
echo "  seanstash --force           # Send all commands (ignore sent history)"
echo ""
echo -e "${BLUE}History Selection:${NC}"
echo "  seanstash '!2031'           # Send specific command from history line 2031"
echo "  seanstash '!2031-2033'      # Send command range from lines 2031-2033"
echo "  seanstash '!2031' --force   # Resend specific command (ignore sent history)"
echo ""
echo -e "${BLUE}Super Convenient Aliases:${NC}"
echo "  ss                          # Same as 'seanstash'"
echo "  sss                         # Status check"
echo "  ssc                         # Configuration"
echo ""
echo -e "${BLUE}Configuration:${NC}"
echo "  Config file: $CONFIG_DIR/config.ini"
echo "  History file: $CONFIG_DIR/sent_history.json"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
if [[ -n "$SHELL_RC" ]]; then
    echo "1. Restart terminal or run: source $SHELL_RC (for aliases)"
else
    echo "1. Restart terminal (for aliases if added manually)"
fi
echo "2. Run 'seanstash config' to set up your SeanStash URL"
echo "3. Run 'seanstash --dry-run' to test the configuration"
echo "4. Run 'seanstash' to start syncing your commands"
echo "5. Try history selection: 'seanstash \"!command-number\"' to send specific commands!"
echo ""

# Check if SeanStash is running
echo -e "${BLUE}Checking SeanStash connectivity...${NC}"
if curl -s http://localhost:5000/ &> /dev/null; then
    echo -e "${GREEN}✓ SeanStash is running on localhost:5000${NC}"
else
    echo -e "${YELLOW}⚠ SeanStash not detected on localhost:5000${NC}"
    echo "  Make sure your SeanStash application is running before syncing commands."
fi

echo ""
echo -e "${GREEN}🎉 SeanStash CLI installed successfully!${NC}"
echo -e "${BLUE}Key Features:${NC}"
echo "  • Native Linux command (use 'seanstash' anywhere)"
echo "  • Claude AI background processing for educational snippets"
echo "  • History selection with !number syntax"
echo "  • Super convenient aliases (ss, sss, ssc)"
echo "  • Automatic command enhancement via background processor"
echo ""
echo -e "${GREEN}Happy command stashing! 🚀${NC}" 