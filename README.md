[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/jordan-dalby-bytestash-badge.png)](https://mseep.ai/app/jordan-dalby-bytestash)

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
- AI Integration (MCP): Connect AI assistants such as Claude, OpenAI and Perplexity through a built-in [Model Context Protocol](https://modelcontextprotocol.io) endpoint to search and manage your snippets, authenticated with your existing API key. See [MCP (AI assistants)](#mcp-ai-assistants).

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
      #ALLOWED_HOSTS: localhost,my.domain.com,my.domain.net
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

## Tech Stack
- Frontend: React, Tailwind CSS
- Backend: Node.js, Express
- Containerisation: Docker

## API Documentation
Once the server is running you can explore the API via Swagger UI. Open
`/api-docs` in your browser to view the documentation for all endpoints.

## MCP (AI assistants)
ByteStash exposes a remote [Model Context Protocol](https://modelcontextprotocol.io)
endpoint so AI assistants such as **Claude** (desktop & web), **OpenAI/ChatGPT** and
**Perplexity** can search, read and manage your snippets directly.

- **Endpoint:** `https://<your-host>/mcp` (or `https://<your-host><BASE_PATH>/mcp` when a
  base path is configured). It is served on the same host/port as the app, so nothing extra
  needs to be exposed in your deployment.
- **Transport:** Streamable HTTP.
- **Auth:** the **same API key** used by the REST API. Create one under
  *Settings → API Keys* in the UI, then send it as `Authorization: Bearer <api-key>`
  (or the `x-api-key` header). The MCP tools only ever access snippets owned by that key.

### Available tools
`list_snippets`, `get_snippet`, `create_snippet`, `update_snippet`, `delete_snippet`,
`list_metadata`.

### Connecting clients
- **Claude Desktop** (`claude_desktop_config.json`):
  ```json
  {
    "mcpServers": {
      "bytestash": {
        "type": "http",
        "url": "https://your-host/mcp",
        "headers": { "Authorization": "Bearer YOUR_API_KEY" }
      }
    }
  }
  ```
- **Claude.ai / web & other custom connectors:** add a custom connector pointing at
  `https://your-host/mcp` and supply the `Authorization: Bearer YOUR_API_KEY` header.
- **OpenAI Responses API:** pass it as an MCP tool:
  ```json
  {
    "type": "mcp",
    "server_label": "bytestash",
    "server_url": "https://your-host/mcp",
    "headers": { "Authorization": "Bearer YOUR_API_KEY" }
  }
  ```
- **Perplexity:** add a remote MCP connector with the URL above and the same
  `Authorization` header.

> The endpoint requires HTTPS for remote clients — terminate TLS at your reverse
> proxy/ingress as you already do for the web UI.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any improvements or bug fixes.

### I18n
To add phrases for a new language, follow these steps. Example for `fr` locale:
- Add the locale name to the `Locale` enum in the `client/src/i18n/types.ts` file
- Add the locale name to the `locales` array in the `client/i18next.config.ts` file
- Run translation synchronization: `cd client && npm run i18n:extract`
- Replace all `__TRANSLATE_ME__` lines with the desired phrases
- Create new resources file as `client/src/i18n/resources/fr.ts`
- Update export resources in file `client/src/i18n/resources/index.ts`
- Run the server in development mode: `npm run dev`
- Run the client in development mode: `cd client && npm run start`
