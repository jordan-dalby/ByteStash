# ByteStash
<p align="center">
  <img src="https://raw.githubusercontent.com/jordan-dalby/ByteStash/refs/heads/main/client/public/logo192.png" />
</p>

ByteStash is a self-hosted web application designed to store, organise, and manage your code snippets efficiently. With support for creating, editing, and filtering snippets, ByteStash helps you keep track of your code in one secure place.

![ByteStash App](https://raw.githubusercontent.com/jordan-dalby/ByteStash/refs/heads/main/media/app-image.png)

## Demo
Check out the [ByteStash demo](https://bytestash-demo.pikapod.net/) powered by PikaPods!  
Username: demo  
Password: demodemo

## Features
- Create and Edit Snippets: Easily add new code snippets or update existing ones with an intuitive interface.
- Filter by Language and Content: Quickly find the right snippet by filtering based on programming language or keywords in the content.
- Secure Storage: All snippets are securely stored in a sqlite database, ensuring your code remains safe and accessible only to you.

## Howto
### Unraid
ByteStash is now on the Unraid App Store! Install it from [there](https://unraid.net/community/apps).

### PikaPods
Also available on [PikaPods](https://www.pikapods.com/) for [1-click install](https://www.pikapods.com/pods?run=bytestash) from $1/month.

### Docker
ByteStash can also be hosted manually via the docker-compose file:
```yaml
services:
  bytestash:
    image: "ghcr.io/jordan-dalby/bytestash:latest"
    restart: always
    volumes:
      - /your/snippet/path:/data/snippets
    ports:
      - "5000:5000"
    environment:
      # See https://github.com/jordan-dalby/ByteStash/wiki/FAQ#environment-variables
      BASE_PATH: ""
      JWT_SECRET: your-secret
      TOKEN_EXPIRY: 24h
      ALLOW_NEW_ACCOUNTS: "true"
      DEBUG: "true"
      DISABLE_ACCOUNTS: "false"
      DISABLE_INTERNAL_ACCOUNTS: "false"

      # See https://github.com/jordan-dalby/ByteStash/wiki/Single-Sign%E2%80%90on-Setup for more info
      OIDC_ENABLED: "false"
      OIDC_DISPLAY_NAME: ""
      OIDC_ISSUER_URL: ""
      OIDC_CLIENT_ID: ""
      OIDC_CLIENT_SECRET: ""
      OIDC_SCOPES: ""
```

## SeanStash CLI

**Terminal command history integration** - Automatically capture and organize your terminal commands as intelligent code snippets with AI enhancement.

### Features
- 🔄 **Auto-sync terminal history** to SeanStash as searchable snippets
- 🧠 **AI Enhancement** - Claude automatically adds educational explanations and smart categorization
- 📍 **History Selection** - Send specific commands using `!number` syntax
- 🛡️ **Smart filtering** excludes sensitive commands (passwords, secrets, tokens)  
- ⚙️ **Configurable** with support for custom exclusion patterns
- 🚀 **Easy installation** with automated setup scripts and convenient aliases
- 🔗 **Shell integration** with immediate history writing support

### Quick Start

1. **Install the CLI:**
   ```bash
   cd cli/
   ./install.sh
   ```

2. **Configure your SeanStash URL:**
   ```bash
   seanstash config
   ```

3. **Enable immediate history writing (zsh users):**
   ```bash
   echo 'setopt INC_APPEND_HISTORY' >> ~/.zshrc
   echo 'setopt SHARE_HISTORY' >> ~/.zshrc
   source ~/.zshrc
   ```

4. **Test and sync:**
   ```bash
   seanstash --dry-run  # Preview what would be sent
   seanstash            # Sync your commands
   ```

### Usage

```bash
# Basic commands (or use aliases: ss, sss, ssc)
seanstash                    # Sync recent commands
seanstash config            # Interactive configuration  
seanstash status            # Show connectivity status

# History selection (NEW!)
seanstash '!2031'           # Send specific command by line number
seanstash '!2031-2033'      # Send range of commands
ss '!2031' --dry-run        # Preview with short alias

# Advanced options
seanstash --dry-run         # Preview without sending
seanstash --limit 100       # Sync last 100 commands
seanstash --force           # Send all commands
```

### AI Enhancement

All CLI snippets are automatically enhanced by Claude AI:
- **Educational explanations** with helpful analogies
- **Smart categorization** and tagging
- **Professional documentation** with examples
- **Best practices** and usage tips
- Runs every ~30 seconds (~$0.007-0.012 per analysis)

📖 **[Full CLI Documentation](cli/README.md)**

## Tech Stack
- Frontend: React, Tailwind CSS
- Backend: Node.js, Express
- CLI: Python 3, cross-shell compatible
- Containerisation: Docker

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any improvements or bug fixes.
