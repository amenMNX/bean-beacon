# Bean Beacon — Final Project Documentation

## 1. Project overview

Bean Beacon is a full-stack web platform for discovering cafés and selecting a place that matches a user's location, activities, and preferences.

The application brings together:

- nearby café discovery;
- interactive map visualization;
- search and category filtering;
- Wi-Fi, power outlet, atmosphere, and work-friendly attributes;
- user registration and authentication;
- favorites;
- ratings and reviews;
- café recommendations;
- café submission and management;
- administrator moderation;
- containerized development and production environments;
- automated validation through GitLab CI/CD;
- monitoring with Prometheus, Grafana, and Uptime Kuma.

Bean Beacon is designed as a practical service for coffee lovers, remote workers, students, visitors, café managers, and administrators.

## 2. Project objectives

The project has four main objectives:

1. Help users find cafés around their current location.
2. Give users meaningful information for choosing a café.
3. Create a community space for favorites, ratings, and reviews.
4. Provide a maintainable, containerized, and observable software platform.

The user journey is simple:

```text
Open Bean Beacon
      ↓
Allow location access
      ↓
Discover nearby cafés
      ↓
Search and filter results
      ↓
Open a café profile
      ↓
Save, rate, review, or recommend
```

## 3. Users and roles

### Visitor

A visitor can:

- view available cafés;
- search by name or address;
- explore café locations on the map;
- filter cafés by category and attributes;
- read café details and published reviews.

### Registered user

A registered user can:

- create an account and sign in;
- save cafés as favorites;
- add ratings and reviews;
- update or remove personal reviews;
- receive preference-based recommendations.

### Café manager

A café manager can:

- submit a café;
- provide its address and contact details;
- add a photo;
- update the information of managed cafés;
- consult the cafés associated with the account.

### Administrator

An administrator can:

- review and moderate café submissions;
- approve or reject listings;
- edit or delete café records;
- moderate reviews;
- manage users and roles;
- consult platform activity and summary information.

## 4. Main features

### Café discovery

The application uses the user's location to search for nearby cafés. Results include distance information and can combine records already stored in MongoDB with real-world café data obtained from OpenStreetMap services.

### Search and filtering

Users can search by café name or address and filter results by:

- category;
- distance;
- rating;
- Wi-Fi availability;
- power outlets;
- atmosphere;
- work-friendly characteristics.

### Interactive map

The frontend displays café locations and the user's location on an interactive map. Café cards and profiles provide address information and directions links.

### Café profiles

A café profile presents:

- name;
- address;
- phone number;
- opening information when available;
- image;
- amenities;
- atmosphere;
- coffee types;
- ratings and reviews;
- favorite status.

### Authentication

The backend provides JWT-based authentication. Passwords are hashed with bcrypt, protected API operations require a valid token, and administrator operations require the appropriate role.

### Favorites

Authenticated users can save cafés to a personal favorites list and remove them whenever they choose.

### Ratings and reviews

Users can rate cafés from one to five stars and add written reviews. Review data is associated with the café and author and contributes to the displayed community rating.

### Recommendations

The recommendation feature compares user preferences such as drink type, atmosphere, and location with café attributes. It returns matching cafés together with an explanation of the match.

### Café management

Authenticated managers can submit cafés, upload photos, edit their own information, and manage their listings. Administrators have access to platform-wide moderation.

## 5. Technology stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite, TypeScript |
| UI | Tailwind CSS, shadcn/ui, Lucide icons |
| Routing | React Router |
| Data fetching | TanStack Query |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs |
| External data | OpenStreetMap, Overpass API, Nominatim |
| Containers | Docker, Docker Compose |
| CI/CD | GitLab CI/CD and GitLab Runner |
| Monitoring | Prometheus, Grafana, Uptime Kuma |
| Metrics | prom-client |
| Tests | Vitest |
| Code quality | ESLint, TypeScript compiler, npm audit, Gitleaks |

## 6. System architecture

```text
Browser
   │
   ▼
React + Vite frontend
   │ REST API requests
   ▼
Express + TypeScript backend
   │
   ├── Authentication and authorization
   ├── Café discovery and search
   ├── Favorites and reviews
   ├── Recommendations
   ├── Administration
   └── Prometheus metrics
   │
   ▼
MongoDB database

External integrations:
Overpass API  → real café discovery
Nominatim     → address geocoding
OpenStreetMap → map data and tiles

Monitoring:
Backend /metrics → Prometheus → Grafana
Backend /api/health → Uptime Kuma
Docker metrics → cAdvisor and node-exporter
```

### Runtime services

| Service | Development address | Responsibility |
|---|---|---|
| Frontend | http://localhost:8081 | User interface |
| Backend API | http://localhost:3000 | REST API and business logic |
| MongoDB | localhost:27017 | Persistent application data |
| Prometheus | http://localhost:9090 | Metrics collection |
| Grafana | http://localhost:3001 | Metrics dashboards |
| Uptime Kuma | http://localhost:3002 | Availability monitoring |

## 7. Repository structure

```text
bean-beacon/
├── bean-beacon-frontend/
│   ├── src/pages/              application screens
│   ├── src/components/         reusable UI components
│   ├── src/hooks/              data and UI hooks
│   ├── src/lib/api.ts          frontend API client
│   └── nginx/default.conf      production web server configuration
├── bean-beacon-backend/
│   ├── src/routes/             API route definitions
│   ├── src/controllers/        application operations
│   ├── src/services/           external services and recommendations
│   ├── src/models/             MongoDB models
│   ├── src/middleware/         authentication and error handling
│   └── src/metrics.ts          Prometheus metrics
├── monitoring/
│   ├── prometheus.yml
│   └── grafana/provisioning/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .gitlab-ci.yml
├── deploy.py
├── demo.ps1
└── docs/
```

## 8. Application routes

### Frontend routes

| Route | Screen |
|---|---|
| `/` | Café discovery, filters, map, and recommendations |
| `/manage` | Café submission and manager tools |
| `/cafe/:id` | Café profile and reviews |
| `/dashboard` | Administration dashboard |
| `*` | Not-found screen |

### Backend route groups

| Route group | Purpose |
|---|---|
| `/api/auth` | Registration, login, and current user |
| `/api/cafes` | Discovery, search, profiles, recommendations, and management |
| `/api/cafes/:cafeId/ratings` | Café ratings and reviews |
| `/api/favorites` | User favorites |
| `/api/admin` | Administration and moderation |
| `/api/health` | API health check |
| `/metrics` | Prometheus metrics |

## 9. Data model

The backend uses Mongoose models for:

- **User** — identity, credentials, role, and profile information;
- **Cafe** — café details, location, amenities, photos, ownership, and approval status;
- **Favorite** — relationship between a user and a café;
- **Rating** — score, review text, author, and café relationship.

Café locations use GeoJSON coordinates and a geospatial index to support nearby searches.

## 10. Getting started

### Prerequisites

Install:

- Docker Desktop with Docker Compose;
- Git;
- Node.js and npm;
- Python and pyinfra for the automated local deployment command.

Verify the tools:

```powershell
docker --version
docker compose version
git --version
node --version
npm --version
```

### Development environment

From the repository root:

```powershell
cd "C:\Users\msi\Desktop\coffee-quest\bean-beacon"
docker compose config --quiet
docker compose up -d --build
```

Check the services:

```powershell
docker compose ps
```

Test the API:

```powershell
Invoke-RestMethod "http://localhost:3000/api/health"
```

Expected response:

```json
{
  "success": true,
  "message": "Bean Beacon API is running"
}
```

Open the application at:

```text
http://localhost:8081
```

## 11. Production deployment

Set a production JWT secret:

```powershell
$env:JWT_SECRET = "replace-with-a-long-random-secret"
```

Start the production stack:

```powershell
docker compose -f docker-compose.prod.yml up -d --build
```

The production frontend is available at:

```text
http://localhost
```

The production API is available through the frontend reverse proxy:

```text
http://localhost/api/health
```

The same deployment can be launched with pyinfra:

```powershell
pyinfra @local deploy.py
```

## 12. CI/CD workflow

Bean Beacon uses a trunk-based Git workflow:

```text
Feature branch
      ↓
Commit and push
      ↓
Merge Request
      ↓
Code review
      ↓
Merge into main
      ↓
GitLab CI/CD pipeline
```

The GitLab Runner uses the tag:

```text
bean-beacon
```

The pipeline contains four stages:

1. **Validate**
   - backend TypeScript build;
   - frontend lint;
   - frontend type checking;
   - frontend production build.

2. **Test**
   - backend unit tests with Vitest.

3. **Security**
   - backend dependency audit;
   - frontend dependency audit;
   - Gitleaks secret detection.

4. **Build**
   - backend Docker image;
   - frontend Docker image.

The pipeline file is:

```text
.gitlab-ci.yml
```

## 13. Monitoring and supervision

### Prometheus

Prometheus collects metrics from the backend endpoint:

```text
http://localhost:3000/metrics
```

Open the Prometheus interface at:

```text
http://localhost:9090
```

### Grafana

Grafana displays dashboards based on Prometheus data:

```text
http://localhost:3001
```

The Grafana data is stored in the Docker volume `grafana_data`.

### Uptime Kuma

Open:

```text
http://localhost:3002
```

Create an HTTP monitor with:

```text
Name: Bean Beacon API
URL: http://backend:3000/api/health
Interval: 60 seconds
Retries: 2
```

The internal Docker service name `backend` allows Uptime Kuma to monitor the API from inside the Compose network.

### Container metrics

- cAdvisor provides Docker container metrics.
- node-exporter provides host metrics.
- Prometheus collects both metric sources.
- Grafana presents the data through dashboards.

## 14. Validation commands

Backend:

```powershell
cd bean-beacon-backend
npm ci
npm run build
npm test -- run
```

Frontend:

```powershell
cd ..\bean-beacon-frontend
npm ci
npm run lint
npm run typecheck
npm run build
cd ..
```

Full demonstration:

```powershell
.\demo.ps1
```

The demonstration script checks the API health endpoint, runs backend tests, and starts the production Compose stack.

## 15. Security and data protection

Bean Beacon uses:

- JWT authentication for protected sessions;
- bcrypt password hashing;
- role-based authorization for administrators;
- environment variables for configuration and secrets;
- Docker volumes for persistent data;
- dependency audits in the GitLab pipeline;
- Gitleaks secret detection;
- CORS configuration for the frontend origin;
- protected API routes and centralized error handling.

Sensitive values such as JWT secrets and database credentials are configured through environment variables.

## 16. Project deliverables

| Deliverable | Location |
|---|---|
| Frontend application | `bean-beacon-frontend` |
| Backend API | `bean-beacon-backend` |
| Development Compose | `docker-compose.yml` |
| Production Compose | `docker-compose.prod.yml` |
| GitLab pipeline | `.gitlab-ci.yml` |
| Deployment automation | `deploy.py` |
| Demonstration script | `demo.ps1` |
| API health check | `/api/health` |
| Metrics endpoint | `/metrics` |
| Prometheus configuration | `monitoring/prometheus.yml` |
| Application documentation | `docs/FINAL_PROJECT_DOCUMENTATION.md` |

## 17. Demonstration sequence

For a final presentation:

1. Open the project repository and explain the architecture.
2. Start the development environment with Docker Compose.
3. Open the Bean Beacon frontend.
4. Demonstrate café discovery, filtering, profiles, favorites, reviews, and recommendations.
5. Show the API health endpoint.
6. Show the GitLab pipeline stages.
7. Open Prometheus and Grafana.
8. Show the Uptime Kuma monitor.
9. Start the production stack.
10. Present the final deliverables and documentation.

Bean Beacon combines a useful user-facing application with a complete software delivery workflow: structured development, automated validation, containerized deployment, and continuous observability.

