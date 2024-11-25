# ByteStash
<p align="center">
  <img src="https://raw.githubusercontent.com/jordan-dalby/ByteStash/refs/heads/main/client/public/logo192.png" />
</p>

ByteStash is a self-hosted web application designed to store, organise, and manage your code snippets efficiently. With support for creating, editing, and filtering snippets, ByteStash helps you keep track of your code in one secure place.

![ByteStash App](https://raw.githubusercontent.com/jordan-dalby/ByteStash/refs/heads/main/media/app-image.png)

## Features
- Create and Edit Snippets: Easily add new code snippets or update existing ones with an intuitive interface.
- Filter by Language and Content: Quickly find the right snippet by filtering based on programming language or keywords in the content.
- Secure Storage: All snippets are securely stored in a sqlite database, ensuring your code remains safe and accessible only to you.

## Howto
### Unraid
ByteStash is now on the Unraid App Store! Install it from there.

### Other
ByteStash can also be hosted manually via the docker-compose file:
```
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

## Tech Stack
- Frontend: React, Tailwind CSS
- Backend: Node.js, Express
- Containerisation: Docker

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any improvements or bug fixes.
