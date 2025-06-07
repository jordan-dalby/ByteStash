# SeanStash User Guide

**SeanStash v1.1.0** - Your intelligent code snippet manager with terminal history integration, AI-powered search, and **Claude AI enhancement** for educational command analysis.

## 📚 Table of Contents

- [Quick Start](#quick-start)
- [Web Interface](#web-interface)
- [Command Line Interface (CLI)](#command-line-interface-cli)
- [API Documentation](#api-documentation)
- [Claude AI Integration](#claude-ai-integration-new)
- [Advanced Features](#advanced-features)
- [Tips & Tricks](#tips--tricks)

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Python 3.7+ (for CLI)
- Web browser for interface

### Installation

1. **Start SeanStash**:
   ```bash
   docker-compose up -d
   ```

2. **Access the interface**: Open http://localhost:5000

3. **Create an account** or login with existing credentials

4. **Install CLI** (recommended):
   ```bash
   cd cli/
   ./install.sh
   ```

5. **Configure immediate history writing** (zsh users):
   ```bash
   echo 'setopt INC_APPEND_HISTORY' >> ~/.zshrc
   echo 'setopt SHARE_HISTORY' >> ~/.zshrc
   source ~/.zshrc
   ```
   
   After installation, you can use `seanstash` anywhere! 🚀

5. **Try Enhanced Mode**:
   ```bash
   # Run a terminal command, then:
ss '!last-command-number'  # Instant Claude analysis!
   ```

## 🌐 Web Interface

### Getting Started

1. **Login/Register**: Create your account at http://localhost:5000
2. **Generate API Key**: Go to Settings → API Keys → Generate New Key
3. **Start creating snippets**: Click "Create New Snippet" or use the Command Palette

### Key Features

#### **🎯 Command Palette (Ctrl+K / Cmd+K)**
- **Fuzzy Search**: Find snippets instantly with partial matches
- **Advanced Syntax**: Use `lang:python`, `cat:kubernetes`, `date:today`
- **Template Library**: Access 15 pre-built templates
- **Tab Modes**: Cycle through All → Snippets → Actions → Templates

#### **📝 Snippet Management**
- **Create**: Rich code editor with syntax highlighting
- **Organize**: Categories and tags for easy filtering
- **Share**: Public/private snippets with secure sharing
- **Lock**: Protect important snippets from accidental changes

#### **🔍 Advanced Search**
- **Language filtering**: `lang:bash`, `lang:javascript`
- **Category filtering**: `cat:kubernetes`, `cat:terminal`
- **Date filtering**: `created:today`, `date:this_week`
- **Content search**: Full-text search across all snippets

### Command Palette Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Open Command Palette |
| `Tab` | Cycle search modes |
| `Enter` | Execute action/open snippet |
| `Esc` | Close palette |

### Search Syntax Examples

```
# Language-based search
lang:python
lang:bash

# Category search
cat:kubernetes
cat:terminal-commands

# Date-based search
created:today
date:this_week
date:last_month

# Combined search
kubernetes lang:yaml
docker cat:devops created:today
```

## 💻 Command Line Interface (CLI)

### Installation

```bash
cd cli/
./install.sh
```

After installation, `seanstash` becomes a **native Linux command** available system-wide! 🚀

### Configuration

```bash
# Interactive setup
seanstash config

# Or edit directly
nano ~/.seanstash/config.ini
```

### Basic Usage

```bash
# Sync recent terminal commands
seanstash

# Preview what would be sent
seanstash --dry-run

# Sync specific number of commands
seanstash --limit 20

# Check status and connectivity
seanstash status

# Force resend all commands
seanstash --force
```

### 🎓 AI-Enhanced History Selection

**Automatic Claude Analysis** - All CLI snippets get enhanced automatically:

```bash
# Send specific command - automatically enhanced by background processor
seanstash '!2031'

# Send range of commands - all enhanced automatically  
seanstash '!2031-2033'

# Use convenient aliases
ss '!2031'           # Short alias for seanstash
ss '!2031-2033'      # Send multiple commands
```

**Benefits of Current System:**
- 🧠 **Automatic Enhancement** - All CLI snippets enhanced by background processor
- 🏷️ **Smart categorization** (kubernetes, database, debugging)  
- 📚 **Educational descriptions** with analogies and examples
- ⚡ **Background processing** (~30 seconds after snippet creation)
- 🎯 **Perfect line matching** with immediate history writing

### History Selection Syntax

```bash
# Specific command from history
seanstash '!2031'

# Range of commands
seanstash '!2031-2033'

# With immediate Claude analysis
seanstash '!2031' --enhance

# Force resend with enhancement
seanstash '!2031' --enhance --force
```

### Super Convenient Aliases

**Auto-installed aliases** for maximum productivity:

```bash
ss                  # Same as 'seanstash' 
sss                 # Status: 'seanstash status'
ssc                 # Config: 'seanstash config'
```

**Perfect Workflow:**
1. Run any terminal command
2. `ss '!history-number'` ← **Send to SeanStash**
3. Background processor automatically enhances with Claude AI (~30s)

### Configuration Options

#### **API Settings**
```ini
[api]
base_url = http://localhost:5000
endpoint = /api/v2/snippets
api_key = your-api-key-here
timeout = 10
```

#### **Smart Filtering**
```ini
[filters]
min_length = 3
exclude_patterns = cd,ls,pwd,exit,clear,history,.*password.*,.*secret.*
include_working_dir = true
include_timestamp = true
```

#### **Behavior Controls**
```ini
[behavior]
auto_send = false
batch_size = 10
dry_run = false
```

### Security Features

- **Sensitive Data Protection**: Automatically excludes passwords, secrets, tokens
- **Customizable Exclusions**: Add your own patterns to filter out sensitive commands
- **Local Deduplication**: Tracks sent commands to avoid duplicates

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api/v2
```

### Authentication
All API requests require an API key in the header:
```http
x-api-key: your-api-key-here
```

### Endpoints

#### **GET /snippets** - List all snippets
```bash
curl -H "x-api-key: KEY" http://localhost:5000/api/v2/snippets
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "title": "Example Snippet",
      "description": "Description here",
      "categories": ["bash", "utilities"],
      "isPublic": false,
      "locked": false,
      "updated_at": "2025-01-15T10:30:45Z",
      "fragments": [
        {
          "id": 456,
          "file_name": "script.sh",
          "code": "echo 'Hello World'",
          "language": "bash",
          "position": 0
        }
      ]
    }
  ],
  "count": 1
}
```

#### **POST /snippets** - Create new snippet
```bash
curl -X POST \
  -H "x-api-key: KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Snippet",
    "description": "Description",
    "categories": ["example"],
    "isPublic": false,
    "locked": false,
    "fragments": [
      {
        "file_name": "example.sh",
        "code": "echo hello",
        "language": "bash",
        "position": 0
      }
    ]
  }' \
  http://localhost:5000/api/v2/snippets
```

#### **GET /snippets/:id** - Get specific snippet
```bash
curl -H "x-api-key: KEY" http://localhost:5000/api/v2/snippets/123
```

#### **PUT /snippets/:id** - Update entire snippet
```bash
curl -X PUT \
  -H "x-api-key: KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title", ...}' \
  http://localhost:5000/api/v2/snippets/123
```

#### **PATCH /snippets/:id** - Partial update
```bash
curl -X PATCH \
  -H "x-api-key: KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "New Title"}' \
  http://localhost:5000/api/v2/snippets/123
```

#### **DELETE /snippets/:id** - Delete snippet
```bash
curl -X DELETE \
  -H "x-api-key: KEY" \
  http://localhost:5000/api/v2/snippets/123
```

### Error Responses

All errors follow a consistent format:
```json
{
  "error": "Validation failed",
  "message": "Request data is invalid",
  "code": "VALIDATION_ERROR",
  "details": {
    "errors": [
      {
        "field": "title",
        "reason": "Title is required"
      }
    ]
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `AUTH_ERROR` | Invalid or missing API key |
| `VALIDATION_ERROR` | Request data validation failed |
| `NOT_FOUND` | Resource not found |
| `INTERNAL_ERROR` | Server error |

## 🤖 Claude AI Integration (NEW!)

### Intelligent Command Analysis

SeanStash integrates **Claude Sonnet 4** for educational command analysis:

#### **How It Works**
1. **Command Detection**: CLI captures terminal commands
2. **Claude Analysis**: AI analyzes commands for educational value
3. **Smart Snippets**: Creates educational snippets with analogies and explanations
4. **Background Processing**: Automatic analysis of new commands (30s delay)
5. **Immediate Mode**: Instant analysis with `--enhance` flag

#### **Enhanced Features**
- 🧠 **Educational Analogies**: Complex commands explained with relatable comparisons
- 🏷️ **Smart Categorization**: Automatic tagging (kubernetes, database, debugging)
- 📚 **Learning Structure**: PRO TIPS → ADVANCED → NINJA techniques
- 💰 **Cost Tracking**: ~$0.007-0.012 per analysis
- 🎯 **Quality Control**: Only creates snippets for valuable commands

#### **Example Enhanced Snippet**
```bash
# Original command:
kubectl exec -it psql-console -- psql -h frontend -p 4567 -d dev

# Claude creates:
Title: "kubectl exec with PostgreSQL"
Description: "Think of this command like opening a direct phone line to your database inside Kubernetes. It's like..."
Categories: ["kubernetes", "database", "postgresql", "debugging"]
Educational content with flag explanations and use cases
```

#### **Background Command Processor**
- **Automatic Analysis**: Monitors new CLI snippets every 30 seconds
- **Smart Filtering**: Only analyzes commands with educational value
- **Cost Optimization**: Caches results to avoid duplicate analysis
- **Usage Tracking**: Monitor AI costs and token usage

#### **Authentication**
Enhanced mode requires JWT authentication:
```bash
# Default demo credentials (configure in production)
Username: [Set during first setup]
Password: [Set during first setup]
```

## 🎨 Advanced Features

### Template Library

SeanStash includes 15 production-ready templates:

#### **Development Templates**
- **React Component**: TypeScript functional component
- **Python Script**: Best practices with error handling
- **Bash Script**: Robust scripting with colors
- **JavaScript Function**: JSDoc documented
- **SQL Query**: Optimized with best practices
- **Express.js Route**: API with middleware
- **CSS Component**: Modern CSS features
- **TypeScript Interface**: Well-documented

#### **Kubernetes Templates**
- **Deployment + Service**: Complete app setup
- **ConfigMap + Secret**: Configuration management
- **Ingress**: HTTP/HTTPS with SSL
- **CronJob**: Scheduled automation
- **PVC + Storage**: Persistent volumes
- **Namespace + RBAC**: Security & access
- **HPA + Monitoring**: Autoscaling & metrics

### Smart Search Features

#### **Fuzzy Search**
- Finds partial matches across titles, descriptions, and code
- Typo-tolerant matching
- Relevance scoring

#### **Advanced Syntax**
```
# Language filtering
lang:python
lang:bash
lang:javascript

# Category filtering
cat:kubernetes
cat:terminal-commands
cat:devops

# File-based filtering
file:script.sh
file:*.py

# Date filtering
created:today
date:this_week
date:last_month
updated:yesterday

# Combined queries
kubernetes lang:yaml cat:devops
docker file:Dockerfile created:today
```

#### **Date Filtering Options**
- `today` / `created:today`
- `this_week` / `date:this_week`
- `this_month` / `date:this_month`
- `last_week` / `date:last_week`
- `last_month` / `date:last_month`
- `last_year` / `date:last_year`

## 💡 Tips & Tricks

### **Web Interface Tips**

1. **Quick Navigation**: Use `Ctrl+K` everywhere for instant search
2. **Tab Cycling**: Press `Tab` in Command Palette to cycle through modes
3. **Keyboard Shortcuts**: Learn the shortcuts for faster workflow
4. **Categories**: Use consistent categorization for better organization
5. **Templates**: Start with templates for common patterns

### **CLI Tips**

1. **Use History Selection**: `ss '!command-number'` for instant Claude analysis
2. **Regular Syncing**: Run `seanstash` after important work sessions
3. **History Selection**: Master `!2031` and `!2031-2033` syntax for specific commands
4. **Dry Run First**: Use `--dry-run` to preview before syncing
5. **Custom Exclusions**: Add sensitive patterns to `exclude_patterns`
6. **Super Aliases**: Use `ss`, `sse`, `sss`, `ssc` for lightning-fast access
7. **Batch Processing**: Adjust `batch_size` for optimal performance

### **AI Enhancement Tips**

1. **Immediate Analysis**: Use `--enhance` for instant educational snippets
2. **Cost Awareness**: Monitor analysis costs (~$0.007-0.012 per command)
3. **Quality Commands**: Enhanced mode works best with complex, educational commands
4. **Background Processing**: Let automatic analysis handle routine syncing
5. **History Mining**: Use `ss` to analyze interesting historical commands

### **API Tips**

1. **Consistent Format**: Always use the v2 API for new integrations
2. **Error Handling**: Check response codes and handle errors gracefully
3. **Rate Limiting**: Respect the API with reasonable request rates
4. **Authentication**: Keep API keys secure and rotate regularly
5. **Validation**: Validate data before sending to avoid errors

### **Search Tips**

1. **Start Broad**: Begin with general terms, then narrow down
2. **Use Syntax**: Leverage `lang:`, `cat:`, `date:` for precise results
3. **Combine Terms**: Mix different search types for powerful queries
4. **Recent First**: Use date filters to find recent work
5. **Save Searches**: Remember effective search patterns

### **Organization Tips**

1. **Consistent Naming**: Use clear, descriptive titles
2. **Good Descriptions**: Include context and use cases
3. **Smart Categories**: Group related snippets logically
4. **Regular Cleanup**: Review and organize periodically
5. **Lock Important**: Protect critical snippets from changes

## 🆘 Troubleshooting

### **Web Interface Issues**
- **Slow loading**: Check Docker container resources
- **Search not working**: Try refreshing the page
- **Login issues**: Check credentials or create new account

### **CLI Issues**
- **Command not found**: Ensure `seanstash` is installed with `./install.sh`
- **401 Errors**: Check API key in `~/.seanstash/config.ini`
- **Connection Failed**: Verify SeanStash is running on localhost:5000
- **No Commands Found**: Check shell history files exist (.zsh_history, .bash_history)
- **History Selection**: Use quotes: `seanstash '!2031'` not `seanstash !2031`
- **Sync Issues**: Try `seanstash --dry-run` to debug

### **AI Enhancement Issues**
- **Enhancement Failed**: Check JWT authentication (admin/admin123)
- **No Enhanced Snippets**: Command might not meet educational threshold
- **Cost Concerns**: Monitor usage, each analysis costs ~$0.007-0.012
- **Background Processor**: Check if Docker container is running properly
- **Analysis Timeout**: Allow 8-15 seconds for Claude processing

### **API Issues**
- **Authentication**: Ensure `x-api-key` header is set correctly
- **Validation**: Check request format against documentation
- **CORS**: API calls must come from authorized origins

## 📞 Support

- **Configuration Issues**: Check `~/.seanstash/config.ini`
- **API Problems**: Review error messages and codes
- **Feature Requests**: Submit through project issues
- **Documentation**: Refer to this guide and API docs

---

**Happy Snippet Management!** 🚀 