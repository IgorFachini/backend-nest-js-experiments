# backend-nest-js-experiments

Simple NestJS backend for study.

## Quick start (Docker Compose)

Prerequisites
- Docker & Docker Compose installed
- (For running tests locally) Node.js 18+ and npm

Environment
- Configure `.env` in the project root. Example values are already provided in `.env` and aligned with `docker-compose.yml` (DB on port 3306, DB_NAME=nest, DB_USER=root, DB_PASS=password).

Run (development)
- Option A — install dependencies on host (recommended for fast dev; container will use host node_modules):
  1. Open cmd.exe in project folder:
     ```
     npm ci
     docker-compose up
     ```
  2. If container already running, restart the app service:
     ```
     docker-compose restart app
     ```

- Option B — let the image install dependencies (image contains node_modules in a volume):
  1. Build and run:
     ```
     docker-compose down -v
     docker-compose up --build
     ```
  2. To force a fresh install without cache:
     ```
     docker-compose build --no-cache
     docker-compose up
     ```

Notes on node_modules and caching
- If you prefer to install deps on host and avoid rebuilding images when adding packages, use Option A.
- If you use Option B, avoid mounting host code in a way that hides the container `node_modules`. If you encounter missing packages inside the container (e.g. `class-transformer`), either install on host (`npm ci`) or rebuild the image.

Database persistence
- The compose file uses a named volume for MySQL (db_data). To keep DB data across restarts, do NOT run:
  ```
  docker-compose down -v
  ```
  (that removes volumes and deletes DB data).
- To back up the DB:
  ```
  docker exec -i mysql_db mysqldump -u root -ppassword nest > backup_nest.sql
  ```
- To restore:
  ```
  docker exec -i mysql_db mysql -u root -ppassword nest < backup_nest.sql
  ```

Run tests (local)
- Unit + integration tests:
  ```
  npm test
  ```
- E2E tests:
  ```
  npm run test:e2e
  ```
- If running tests inside the running container:
  ```
  docker exec -it nestjs_app npm test
  docker exec -it nestjs_app npm run test:e2e
  ```

Troubleshooting
- If Swagger UI at `/api/docs` shows empty schemas, ensure DTOs/controllers have `@ApiProperty()` and `@ApiTags()` (files are updated).
- If container reports missing package right after `docker-compose up --build`, run:
  ```
  docker-compose down -v
  docker-compose up --build
  ```
  or install on host (`npm ci`) and `docker-compose up`.

Useful commands
- Start services in background:
  ```
  docker-compose up -d
  ```
- View logs:
  ```
  docker-compose logs -f app
  ```
- Stop services:
  ```
  docker-compose down
  ```

## CORS Configuration

The server enables CORS globally in `main.ts`.

Environment variable: `CORS_ORIGINS`

Format: comma-separated list of allowed origins.

Example:
```
CORS_ORIGINS=http://localhost:5173,http://localhost:4200
```

Behavior:
- If `CORS_ORIGINS` is set, only those origins are allowed.
- If not set, all origins are allowed (development convenience). For production, set an explicit list.

Headers allowed: `Content-Type, Authorization`

Credentials: enabled (`credentials: true`). If your frontend needs cookies, keep this. If you only use Authorization headers, it's still fine.

If you face a CORS error in the browser:
1. Confirm the frontend origin matches exactly (scheme, host, port) one of the entries in `CORS_ORIGINS`.
2. Ensure no trailing slashes in the origin list.
3. Restart the backend after changing env vars.
