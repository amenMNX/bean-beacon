# Bean Beacon — Current System Guide

This document describes the current implementation in the repository.

## Project structure

- `bean-beacon-backend` — Express, TypeScript, Mongoose API
- `bean-beacon-frontend` — React, Vite, TypeScript, Leaflet UI
- MongoDB — café, user, favorite, and review data
- Docker Compose — local development and monitoring stack

## Start locally with Docker

From the repository root:

```powershell
docker compose up -d --build
```

Open:

- Application: `http://localhost:8081`
- API health: `http://localhost:3000/api/health`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001`

Useful commands:

```powershell
docker compose ps
docker compose logs --tail 100 backend
docker compose logs --tail 100 frontend
docker compose restart backend frontend
docker compose stop
```

## Café discovery

1. The browser requests the user’s location.
2. The frontend calls `/api/cafes?latitude=...&longitude=...&radius=20`.
3. MongoDB is searched first using the `location` `2dsphere` index.
4. Overpass/OpenStreetMap is queried when more cafés are needed.
5. New cafés are imported only when they have a name, valid Tunisia coordinates, and an OpenStreetMap café tag.
6. Results are filtered to Tunisia, sorted by numeric distance, and returned with `distanceKm`.

The frontend uses Leaflet with OpenStreetMap tiles. Café markers use coffee-cup icons. Google Maps is not used as the café data source.

## Adding and editing cafés

Managers use `/manage` to:

- Add a café with a full address or Google Maps URL.
- Upload a café photo.
- Search their cafés by name or address.
- Edit their own café name, address, phone, latitude, and longitude.
- Delete their own café.

Full Google Maps URLs and redirected `maps.app.goo.gl` links are supported. Coordinates are stored as GeoJSON `[longitude, latitude]`.

Admins can edit every café and approve or reject listings from `/admin`.

## Admin space

`/admin` is protected by the admin role and provides:

- Café approval, rejection, editing, and deletion.
- Café search by name or address.
- Review moderation.
- User listing, creation, profile editing, role changes, and optional password reset.
- Activity and summary statistics.

Passwords are never returned by the API. Admin role changes require signing in again so the JWT contains the new role.

## API routes

Public/discovery routes:

- `GET /api/health`
- `GET /api/cafes?latitude=<lat>&longitude=<lng>&radius=20`
- `GET /api/cafes/all`
- `GET /api/cafes/:id`
- `GET /api/cafes/search?query=<text>`

Authenticated café routes:

- `POST /api/cafes`
- `PATCH /api/cafes/:id` — owner or admin edit
- `DELETE /api/cafes/:id` — owner or admin delete
- `POST /api/cafes/:id/photo`
- `POST /api/cafes/:cafeId/ratings`
- `DELETE /api/cafes/:cafeId/ratings/:ratingId`

Admin routes:

- `GET /api/admin/reviews`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:id`
- `PATCH /api/admin/cafes/:id`
- `PATCH /api/cafes/:id/status`

## Verification commands

```powershell
cd bean-beacon-backend
npm run build
npm test -- run

cd ..\bean-beacon-frontend
npm run lint
npm run typecheck
npm run build
```

Security checks:

```powershell
cd ..
docker run --rm -v "${PWD}:/path" zricethezav/gitleaks:latest detect --source="/path" --verbose --redact
```

## Production security checklist

- Use a unique production `JWT_SECRET`; never use the Docker development default.
- Keep `.env` files, passwords, tokens, and uploaded files out of Git.
- Use HTTPS for frontend, API, and uploads.
- Set `FRONTEND_URL` to the real production origin.
- Restrict MongoDB network access and create a least-privilege database user.
- Keep café uploads on persistent storage and validate file type and size.
- Review admin accounts regularly and rotate exposed development passwords.
- Monitor Overpass/Nominatim failures and apply request limits before public launch.
- Back up MongoDB and test restoration.
