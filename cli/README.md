# SeanStash CLI

Terminal command history integration for SeanStash - automatically capture and organize your terminal commands as intelligent code snippets.

## 🚀 Quick Start

### Prerequisites

**For accurate history line matching (recommended for zsh users):**
```bash
# Add to ~/.zshrc for immediate history writing
echo 'setopt INC_APPEND_HISTORY' >> ~/.zshrc
echo 'setopt SHARE_HISTORY' >> ~/.zshrc
source ~/.zshrc
```

### Installation

1. **Navigate to the CLI directory:**
   ```bash
   cd cli/
   ```

2. **Run the installation script:**
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

3. **Configure SeanStash URL:**
   ```bash
   seanstash config
   ```

4. **Test the connection:**
   ```bash
   seanstash status
   ```

5. **Sync your commands:**
   ```bash
   seanstash --dry-run  # Preview first
   seanstash            # Actually sync
   ```

## 📋 Commands

### Basic Usage
```bash
# Sync recent commands to SeanStash
seanstash

# Interactive configuration
seanstash config

# Show status and connectivity
seanstash status
```

### History Selection (New!)
```bash
# Send specific command by history line number
seanstash '!2031'

# Send range of commands
seanstash '!2031-2033'

# Preview specific command without sending
seanstash '!2031' --dry-run

# Force resend specific command (ignore sent history)
seanstash '!2031' --force
```

### Super Convenient Aliases
```bash
# Short aliases for frequent use
ss                    # Same as 'seanstash'
sss                   # Status check
ssc                   # Configuration

# Examples with aliases
ss '!2031'           # Send specific command
ss '!2031-2033'      # Send command range
ss --limit 50        # Sync last 50 commands
```

### Advanced Options
```bash
# Preview what would be sent (dry run)
seanstash --dry-run

# Sync last 100 commands instead of default 50
seanstash --limit 100

# Force send all commands (ignore sent history)
seanstash --force

# Combine options
seanstash --dry-run --limit 20
```

## ⚙️ Configuration

Configuration is stored in `~/.seanstash/config.ini`:

### API Settings
- **base_url**: SeanStash server URL (default: `http://localhost:5000`)
- **endpoint**: API endpoint for snippets (default: `/api/snippets`)
- **timeout**: Request timeout in seconds (default: `10`)
- **api_key**: Optional API key for authentication

### Filtering Options
- **min_length**: Minimum command length to capture (default: `3`)
- **exclude_patterns**: Comma-separated regex patterns to exclude
- **include_working_dir**: Include current directory in metadata (default: `true`)
- **include_timestamp**: Include timestamp in metadata (default: `true`)

### Default Exclusions
The following command patterns are excluded by default:
- Exact matches: `cd`, `ls`, `pwd`, `exit`, `clear`, `history`
- Commands containing: `password`, `secret`, `token`

**Note**: Exclusion patterns use regex. Simple commands like `cd`, `ls` are excluded exactly (not in file paths), while patterns like `history` in file paths (e.g., `~/.zsh_history`) are allowed.

### Behavior Settings
- **auto_send**: Enable automatic sending (default: `false`)
- **batch_size**: Number of commands to send per batch (default: `10`)
- **dry_run**: Always preview without sending (default: `false`)

## 🔧 Configuration Examples

### Basic Setup
```bash
seanstash config
# Follow prompts to set:
# - SeanStash URL: http://localhost:5000
# - API Key: (optional)
# - Auto-send: false
```

### Advanced Configuration
Edit `~/.seanstash/config.ini` directly:

```ini
[api]
base_url = https://seanstash.yourdomain.com
endpoint = /api/snippets
timeout = 15
api_key = your-api-key-here

[filters]
min_length = 5
exclude_patterns = cd,ls,pwd,exit,clear,history,vim,nano,sudo su,.*password.*,.*secret.*,.*token.*,rm -rf
include_working_dir = true
include_timestamp = true

[behavior]
auto_send = false
batch_size = 5
dry_run = false
```

## 🛡️ Security Features

### Command Filtering
- **Sensitive Data Protection**: Automatically excludes commands with passwords, secrets, tokens
- **Customizable Patterns**: Add your own exclusion patterns
- **Length Filtering**: Skip trivial commands (cd, ls, etc.)

### Data Privacy
- **Local History Tracking**: Tracks sent commands locally to avoid duplicates
- **Hash-based Deduplication**: Uses MD5 hashes for efficient duplicate detection
- **No Persistent Storage**: Commands are processed and sent immediately

### Network Security
- **Configurable Timeouts**: Prevent hanging requests
- **HTTPS Support**: Full support for secure connections
- **Optional Authentication**: API key support for secured deployments

## 📊 How It Works

1. **History Collection**: Reads from multiple shell history files:
   - `~/.bash_history`
   - `~/.zsh_history`
   - `~/.history`
   - Current session history via `history` command

2. **Smart Filtering**: Applies configurable filters to exclude:
   - Short/trivial commands
   - Sensitive information patterns
   - Previously sent commands

3. **API Integration**: Formats commands as SeanStash snippets with:
   - Command as content
   - Bash/shell language detection
   - Metadata (timestamp, working directory, source)
   - Automatic categorization as "terminal-commands"

4. **AI Enhancement**: Background processor automatically enhances CLI snippets:
   - Educational explanations and analogies
   - Smart categorization
   - Professional documentation
   - Code examples and best practices
   - Runs every ~30 seconds (cost: ~$0.007-0.012 per analysis)

5. **Deduplication**: Tracks sent commands locally to prevent spam

## 🔄 Automated Setup

### Shell Hook Integration (Optional)

For automatic command capture, add to your shell profile:

**For Bash** (`~/.bashrc`):
```bash
# SeanStash auto-capture (optional)
seanstash_auto_capture() {
    if command -v seanstash >/dev/null 2>&1; then
        seanstash --limit 1 >/dev/null 2>&1 &
    fi
}

# Run after each command (optional - can be resource intensive)
# PROMPT_COMMAND="$PROMPT_COMMAND; seanstash_auto_capture"
```

**For Zsh** (`~/.zshrc`):
```bash
# SeanStash auto-capture (optional)
seanstash_auto_capture() {
    if command -v seanstash >/dev/null 2>&1; then
        seanstash --limit 1 >/dev/null 2>&1 &
    fi
}

# Run after each command (optional - can be resource intensive)
# precmd_functions+=(seanstash_auto_capture)
```

### Cron Integration

For periodic syncing, add to crontab:
```bash
# Sync commands every 15 minutes
*/15 * * * * /usr/local/bin/seanstash >/dev/null 2>&1

# Sync commands hourly
0 * * * * /usr/local/bin/seanstash >/dev/null 2>&1
```

## 🐛 Troubleshooting

### Connection Issues
```bash
# Check SeanStash connectivity
seanstash status

# Test with curl
curl http://localhost:5000/api/health
```

### Permission Issues
```bash
# If installation fails, ensure proper permissions
sudo chown $USER:$USER ~/.seanstash/
sudo chmod 755 /usr/local/bin/seanstash
```

### History Not Found
```bash
# Check if history files exist
ls -la ~/.bash_history ~/.zsh_history ~/.history

# Ensure history is being saved in your shell
echo $HISTFILE
```

### Debug Mode
```bash
# Run with maximum verbosity
seanstash --dry-run --limit 10

# Check configuration
cat ~/.seanstash/config.ini

# Check sent history
cat ~/.seanstash/sent_history.json
```

## 📁 File Locations

- **Executable**: `/usr/local/bin/seanstash`
- **Config Directory**: `~/.seanstash/`
- **Configuration**: `~/.seanstash/config.ini`
- **Sent History**: `~/.seanstash/sent_history.json`

## 🔗 Integration with SeanStash

Commands are sent to SeanStash as snippets with:

```json
{
  "title": "Terminal Command: your-command-here...",
  "description": "Command executed on 2024-01-15",
  "content": "your-actual-command",
  "language": "bash",
  "category": "terminal-commands",
  "tags": ["terminal", "cli", "command"],
  "metadata": {
    "source": "seanstash-cli",
    "working_dir": "/path/to/directory",
    "timestamp": "2024-01-15T10:30:45.123456",
    "hash": "abc123def456"
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the same license as SeanStash.

---

**Happy Command Stashing!** 🚀 