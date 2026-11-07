Here are your Bean Beacon fresh-start commands for PowerShell. Save these so you can start the project whenever you need it.

## 1. Start the project in development mode

Open PowerShell in your project folder:

```
cd "$HOME\Desktop\coffee-quest\bean-beacon"
```

Start the development stack:

```
docker compose up -d --build
```

This starts the services defined in `docker-compose.yml`, including the frontend, backend, MongoDB, and monitoring services if configured there.

The current repository uses `bean-beacon-frontend` and `bean-beacon-backend`. The frontend is served on port `8081` by Docker; port `5173` is used when running Vite directly outside Docker.

For the complete current feature and API reference, see [CURRENT_STATUS.md](CURRENT_STATUS.md).

Check the containers:

```
docker ps
```

Open the app:

- Development frontend: [http://localhost:8081](http://localhost:8081?utm_source=chatgpt.com)
- Backend health check: [http://localhost:3000/api/health](http://localhost:3000/api/health?utm_source=chatgpt.com)
- Prometheus: [http://localhost:9090](http://localhost:9090?utm_source=chatgpt.com)
- Grafana: [http://localhost:3001](http://localhost:3001?utm_source=chatgpt.com)

## 2. Start the production version

Use this when you want to run the production build:

```
cd "$HOME\Desktop\coffee-quest\bean-beacon"
docker compose -f docker-compose.prod.yml up -d --build
```

Check status:

```
docker ps
```

Open the production frontend at [http://localhost](http://localhost?utm_source=chatgpt.com).

## 3. Restart after changing code

For development, the frontend and backend use mounted source files, so changes may reload automatically. If needed:

```
docker compose restart frontend backend
```

For production frontend changes, rebuild only the frontend:

```
docker compose -f docker-compose.prod.yml up -d --build frontend
```

For production backend changes:

```
docker compose -f docker-compose.prod.yml up -d --build backend
```

## 4. View logs when something goes wrong

Development:

```
docker compose logs -f --tail 100
```

Production:

```
docker compose -f docker-compose.prod.yml logs -f --tail 100
```

Or inspect a single service:

```
docker compose logs -f backend
docker compose logs -f frontend
```

Press `Ctrl + C` to stop following logs; this does not stop the containers.

## 5. Stop the project safely

Stop development services:

```
docker compose stop
```

Stop production services:

```
docker compose -f docker-compose.prod.yml stop
```

These commands preserve your database and named volumes.

Important: avoid `docker compose down -v` because it can delete persistent database and monitoring data.

## My recommendation

Use development mode while coding, and production mode when testing the deployed build. Since your monitoring containers and production app have been running together, don't use `docker compose up -d --build` on the development stack as a way to restart production. Keep the two workflows separate.
