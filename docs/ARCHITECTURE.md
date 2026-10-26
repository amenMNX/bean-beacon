# Bean Beacon: System and Logic Architecture

## 1. Purpose and scope

Bean Beacon is a coffee-shop discovery and management application. It combines a public café directory with:

- search, category and attribute filtering;
- map and Google Maps directions;
- café profiles and community reviews;
- user-submitted café listings with moderation;
- a preference-based recommendation feature;
- JWT authentication;
- Docker-based local/production deployment;
- Prometheus and Grafana observability.

This document describes the implementation currently present in the repository. A few older README sections describe planned or previous integrations, so the source code is treated as authoritative.

## 2. High-level architecture

```text
Browser
  |
  | React 18 + Vite + React Router + TanStack Query
  | fetch() with optional Bearer JWT
  v
Frontend
  | development: Vite :8081
  | production: Nginx :80
  | /api/* reverse-proxied to backend in production
  v
Express API :3000
  |-- JWT/authentication middleware
  |-- controllers and route modules
  |-- Mongoose models
  v
MongoDB :27017

External services:
  - Overpass API: imported café discovery for radius searches
  - Nominatim: address-to-coordinate geocoding for submitted cafés
  - Google Maps JavaScript API / Maps links: browser maps and directions

Observability:
  Backend /metrics -> Prometheus -> Grafana
  cAdvisor and node-exporter -> Prometheus
```

The system is a conventional client/API architecture. The frontend owns presentation state and user interaction. The backend owns authentication, persistence, moderation rules, external data ingestion, review aggregation, and recommendation scoring.

## 3. Repository structure

```text
bean-beacon/
├── bean-beacon-frontend/       React/Vite web client
│   ├── src/pages/              route-level screens
│   ├── src/components/         reusable UI and feature components
│   ├── src/hooks/              React Query/data hooks
│   ├── src/lib/api.ts          API client, auth storage, typed API methods
│   ├── src/data/shops.ts       fallback sample cafés and filter vocabulary
│   └── nginx/default.conf      production static hosting and API proxy
├── bean-beacon-backend/        Express/TypeScript API
│   └── src/
│       ├── routes/              HTTP route declarations
│       ├── controllers/         request/business orchestration
│       ├── services/            external integrations and recommendation logic
│       ├── models/              Mongoose schemas
│       ├── middleware/          JWT, optional auth, admin and errors
│       ├── config/              environment and MongoDB setup
│       └── metrics.ts           Prometheus metrics
├── monitoring/                 Prometheus and Grafana provisioning
├── docs/                       project documentation
├── docker-compose.yml          development stack
├── docker-compose.prod.yml     production stack
└── .gitlab-ci.yml              validation, test, security and image-build pipeline
```

## 4. Frontend architecture

### 4.1 Bootstrap and routing

`src/main.tsx` mounts `App` into the root HTML element. `App.tsx` creates the global providers:

1. React Strict Mode;
2. one TanStack Query client;
3. tooltip and toast providers;
4. browser routing.

The active routes are:

| Route | Screen | Responsibility |
|---|---|---|
| `/` | `Index` | café discovery, filtering, recommendations, list/map views |
| `/manage` | `Manage` | authentication, café submission, user listing management |
| `/cafe/:id` | `CafeProfile` | detailed café information and reviews |
| `/dashboard` | `Dashboard` | admin moderation, review administration and activity |
| `*` | `NotFound` | fallback for unknown routes |

### 4.2 Data access and session handling

`src/lib/api.ts` contains a small typed `fetch` wrapper:

- the API base URL comes from `VITE_API_URL`, defaulting to `/api`;
- JSON is sent for every request;
- the stored JWT is attached as `Authorization: Bearer <token>`;
- API responses are expected to use `{ success, data, error }`;
- failed responses become an `ApiError` with an HTTP status.

The browser stores the JWT and a small user object in `localStorage` under `bean-beacon-token` and `bean-beacon-user`. A local listener set provides login/logout notifications without a React authentication context.

This is simple and effective for the MVP, but localStorage means the token is available to JavaScript and should be treated as an XSS-sensitive design. A hardened production design would consider secure, HttpOnly cookies plus CSRF protection.

### 4.3 Café query and fallback behavior

`useCafes()` uses TanStack Query with the `cafes` key and calls `GET /api/cafes/all`.

- If the API returns cafés, API records are converted into the frontend `CoffeeShop` shape.
- MongoDB GeoJSON coordinates are converted from `[longitude, latitude]` to `lat` and `lng`.
- The UI uses a shared fallback image because this deployment has no photo storage.
- If the API returns an empty list, the six records in `src/data/shops.ts` are shown as sample data and marked `isSample`.

The main page then performs filtering locally. Category matching is normalized for case and accents; search currently matches café names; every selected attribute in each filter group must be present, so attribute filters use AND semantics across selected values.

### 4.4 Maps

The current code uses Google Maps, not Leaflet:

- `CafeMap.tsx` lazy-loads the Google Maps JavaScript API using a Vite environment key;
- it creates markers only for cafés with coordinates;
- marker info windows contain the café name, address, hours and a Google Maps link;
- `CoffeeShopCard` embeds a Google Maps iframe and offers a directions/search link.

The backend still stores GeoJSON coordinates and supports a location-radius API. However, the current home page location button only reads browser geolocation and displays a toast; it does not yet call the backend radius endpoint.

### 4.5 User flows in the client

#### Discovery

```text
Index mounts
  -> useCafes() fetches /api/cafes/all
  -> API records are mapped to CoffeeShop objects
  -> local category/name/attribute filters run
  -> cards or map markers render
  -> user can open a profile, directions, phone link, or reviews
```

#### Add a café

```text
Manage
  -> unauthenticated user sees sign-in/sign-up form
  -> registration/login stores JWT and user metadata
  -> form submits POST /api/cafes
  -> backend geocodes the address if coordinates were not supplied
  -> regular-user listing is pending
  -> query cache is invalidated and the UI refreshes
```

#### Review a café

```text
CafeProfile or card review dialog
  -> GET /api/cafes/:cafeId/ratings
  -> authenticated user submits POST /api/cafes/:cafeId/ratings
  -> backend creates or updates the user's single rating
  -> backend recalculates average and count on Cafe
  -> frontend invalidates reviews and café queries
```

#### Admin moderation

```text
Dashboard
  -> admin JWT is required by backend
  -> fetch all cafés and all reviews in parallel
  -> approve/reject café or delete café/review
  -> invalidate dashboard and café queries
```

## 5. Backend architecture

### 5.1 Startup sequence

`src/index.ts` performs the following sequence:

1. loads environment variables;
2. creates the Express application;
3. enables CORS for the configured frontend origin;
4. enables JSON and URL-encoded request parsing;
5. attaches request metrics middleware;
6. connects to MongoDB and exits if the connection fails;
7. mounts route modules;
8. exposes `/api/health` and `/metrics`;
9. attaches error and 404 handlers;
10. starts listening on the configured port.

The API consistently wraps successful results in `success: true` and `data`, which is the contract consumed by the frontend wrapper.

### 5.2 Middleware and authorization

There are three authentication modes:

- `authMiddleware`: requires and verifies a JWT;
- `optionalAuthMiddleware`: verifies a JWT when present but permits anonymous access;
- `adminMiddleware`: requires an authenticated user whose token role is `admin`.

JWT claims contain `userId`, `email`, and `role`. Passwords are hashed in the Mongoose `User` pre-save hook with bcryptjs. The default expiry is seven days.

The error handler translates Mongoose validation errors and duplicate-key errors into JSON API errors. Route handlers also perform explicit validation and authorization.

### 5.3 HTTP API

| Method | Endpoint | Auth | Logic |
|---|---|---|---|
| POST | `/api/auth/register` | public | validate, create hashed user, issue JWT |
| POST | `/api/auth/login` | public | verify credentials, issue JWT |
| GET | `/api/auth/me` | required | return current user |
| GET | `/api/cafes/all` | optional | approved cafés for public users; own pending/rejected cafés for users; all for admins |
| POST | `/api/cafes` | required | create listing; geocode address when needed |
| PATCH | `/api/cafes/:id/status` | admin | set pending/approved/rejected |
| DELETE | `/api/cafes/:id` | required | owner or admin deletes listing |
| GET | `/api/cafes` | optional | radius discovery; queries MongoDB and may import from Overpass |
| GET | `/api/cafes/search` | optional | text search, optionally ordered geographically |
| GET | `/api/cafes/:id` | optional | return one café |
| POST | `/api/cafes/recommend` | public | validate supplied shops/preferences and return top matches |
| GET | `/api/cafes/:cafeId/ratings` | optional | list reviews |
| POST | `/api/cafes/:cafeId/ratings` | required | create or upsert one user rating |
| PUT | `/api/cafes/:cafeId/ratings/:ratingId` | required | edit own rating |
| DELETE | `/api/cafes/:cafeId/ratings/:ratingId` | owner/admin | delete review and recalculate aggregate |
| GET | `/api/favorites` | required | list current user's favorites |
| POST/DELETE | `/api/favorites/:cafeId` | required | add/remove favorite |
| GET | `/api/favorites/:cafeId/check` | optional | check favorite state |
| GET | `/api/admin/reviews` | admin | return up to 500 reviews |
| GET | `/api/health` | public | liveness response |
| GET | `/metrics` | public/internal | Prometheus metrics |

### 5.4 Persistence model

#### User

Stores email, bcrypt hash, name, role, and timestamps. Email is unique and normalized to lowercase. Password is excluded from normal queries.

#### Café

Stores both imported and user-submitted cafés. The location is GeoJSON Point data with a `2dsphere` index. Important fields include identity, address, contact data, café attributes, rating aggregate, owner, and moderation status.

`osmId` is unique and sparse, allowing imported OpenStreetMap records to be deduplicated without preventing user-submitted records that have no OSM ID.

#### Favorite

Stores `userId` and `cafeId`. A compound unique index guarantees one favorite per user/café pair.

#### Rating

Stores `userId`, `cafeId`, score, review text, author name and timestamps. A compound unique index guarantees one rating per user/café pair. The café's `userRating` and `reviewCount` are denormalized aggregates maintained after add, update and delete operations.

### 5.5 Café discovery and external data

There are two café acquisition paths:

1. `/api/cafes/all` reads the application database and applies publication visibility rules.
2. `/api/cafes?latitude=&longitude=&radius=` first performs a MongoDB geospatial query. If fewer than ten cafés are found, it calls Overpass, stores new OSM cafés, and queries MongoDB again.

Overpass responses are cached in memory for one hour. Imported cafés receive coordinates, name, address fragments, type, Wi-Fi/power flags, website, phone and tags. The cache is process-local, so it is lost on restart and is not shared across replicas.

User-submitted café addresses are geocoded by Nominatim when coordinates are omitted. Geocoding responses are also cached for one hour. The backend sends a configurable user-agent and has a ten-second timeout.

### 5.6 Moderation and visibility logic

Regular users can see:

- every café with `status: approved`;
- their own café submissions regardless of status.

Admins can see every status. A normal user cannot self-approve because `createCafe` ignores a submitted status and assigns `pending`; admins create approved records directly. Imported OSM cafés use the schema's approved default because they have no owner workflow.

## 6. Recommendation logic

Recommendations are deterministic token matching, not machine learning.

For each café, the service calculates three optional match ratios:

- drink preference: café name, category, menu and coffee types; weight 3;
- atmosphere preference: café name, category, atmosphere and amenities; weight 3;
- location preference: café name and address; weight 2.

Text is normalized by removing accents, lowercasing, splitting into tokens, and comparing unique preference tokens with searchable tokens.

```text
score = 3 * drinkMatch
      + 3 * atmosphereMatch
      + 2 * locationMatch
```

Only cafés with a score above zero are retained. Results are sorted by score, then rating, then name, and limited to three. The response includes an explanation listing which preference dimensions matched.

The frontend sends the currently loaded café list to the backend. Therefore, recommendation quality is limited to the list already available in the browser; it is not a separate database search.

## 7. Deployment architecture

### Development Compose stack

`docker-compose.yml` runs:

- MongoDB with persistent `mongo-data`;
- backend with TypeScript watch mode and a source bind mount;
- frontend with Vite development server on port 8081;
- Prometheus on 9090;
- Grafana on 3001;
- cAdvisor on 8082;
- node-exporter on 9100.

Health checks ensure MongoDB is ready before the backend and the backend is healthy before the frontend.

### Production Compose stack

`docker-compose.prod.yml` runs MongoDB, a compiled production backend, and an Nginx-served frontend on port 80. The frontend Nginx configuration:

- serves the Vite build from `/usr/share/nginx/html`;
- falls back to `index.html` for client-side routes;
- proxies `/api/` to the backend service;
- applies static-asset caching headers.

Production requires `JWT_SECRET`. The frontend and backend share an internal Docker bridge network, and MongoDB is persisted in `mongo-prod-data`.

## 8. Observability

The backend exposes Prometheus metrics using `prom-client`:

- default Node.js process metrics use the `bean_beacon_` prefix;
- request duration histogram: `bean_beacon_http_request_duration_seconds`;
- request counter: `bean_beacon_http_requests_total`;
- labels are HTTP method, resolved route and status code.

The middleware records metrics when responses finish. Unmatched paths use the fixed `unmatched` route label to avoid unbounded metric cardinality.

Prometheus scrapes itself, cAdvisor, node-exporter and the backend every 15 seconds. Grafana is provisioned with Prometheus as its default data source, but no dashboards are checked into the repository.

## 9. CI/CD logic

The GitLab pipeline has four stages:

1. **validate**: backend TypeScript build, frontend lint, frontend production build;
2. **test**: backend Vitest suite;
3. **security**: npm audits and Gitleaks secret scan;
4. **build**: production backend and frontend Docker images.

The audit jobs are report-only (`|| true`), while Gitleaks is blocking. The pipeline builds images tagged with the short commit SHA but does not push or deploy them.

## 10. Important implementation gaps and risks

These are observations from the current source, not assumptions:

1. The frontend does not currently call the favorites API, although the backend endpoints and models exist.
2. The home page's location button obtains browser coordinates but does not use them to call `/api/cafes`.
3. The current map integration is Google Maps; README text referring to Leaflet is stale.
4. The frontend uses a fallback image and does not implement café photo storage despite model fields reserved for it.
5. Recommendation input contains café data supplied by the browser. The backend validates its shape but does not independently reload café records, so callers can recommend over client-provided data.
6. The backend has no rate limiting, pagination for most public views, or centralized request schema validation library beyond hand-written checks and Mongoose validation.
7. Rating aggregate updates are read-then-write operations and are not transactional; concurrent reviews could produce a stale aggregate under load.
8. `JWT_SECRET` has a development fallback in application config. Production Compose correctly requires it, but non-Compose deployments must enforce the same rule.
9. Prometheus and Grafana are included in development Compose but not the production Compose file.
10. Existing documentation contains old paths such as `bean-beacon-app-main` and old port assumptions. Use the current directory names and Compose files as the operational reference.

## 11. Recommended reading order for maintainers

1. `docker-compose.yml` and `docker-compose.prod.yml` for service boundaries;
2. `bean-beacon-backend/src/index.ts` for API composition;
3. backend route files, then controllers and models;
4. `bean-beacon-frontend/src/App.tsx` for UI routes;
5. `bean-beacon-frontend/src/lib/api.ts` and `src/hooks/useCafes.ts` for client/API contracts;
6. feature components and pages for user-facing behavior;
7. `monitoring/prometheus.yml`, `src/metrics.ts`, and `.gitlab-ci.yml` for operations.

