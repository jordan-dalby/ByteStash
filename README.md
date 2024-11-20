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
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      # e.g. write /bytestash for a domain such as my.domain/bytestash, leave blank in every other case
      - BASE_PATH=
      # Either provide JWT_SECRET directly or use JWT_SECRET_FILE for Docker secrets
      #- JWT_SECRET_FILE=/run/secrets/jwt
      - JWT_SECRET=your-secret
      # how long the token lasts, examples: "2 days", "10h", "7d", "1m", "60s"
      - TOKEN_EXPIRY=24h
      # is this bytestash instance open to new accounts being created?
      - ALLOW_NEW_ACCOUNTS=true
      # Should debug mode be enabled? Essentially enables logging, in most cases leave this as false
      - DEBUG=false
    volumes:
      - ./data:/data/snippets
# Uncomment to use docker secrets
#    secrets:
#      - jwt

#secrets:
#  jwt:
#    file: ./secrets/jwt.txt
```

## Tech Stack
- Frontend: React, Tailwind CSS
- Backend: Node.js, Express
- Containerisation: Docker

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any improvements or bug fixes.
