# Bean Beacon — Complete Code Walkthrough

This is a source-oriented explanation of the repository as it currently exists. Line numbers refer to the files in this checkout. The important application code is explained line by line or in contiguous logical line blocks; generated UI primitives, lockfiles, binary assets, and third-party package internals are catalogued separately because their lines implement library wrappers rather than Bean Beacon business logic.

## How to read this document

The project has four layers:

1. **Browser application** — React pages and components.
2. **API** — Express routes, middleware, controllers, and services.
3. **Persistence/integrations** — MongoDB, Overpass, Nominatim, and Google Maps.
4. **Operations** — Docker, CI, Prometheus, and Grafana.

The most important runtime path is:

```text
main.tsx -> App.tsx -> page -> component/hook -> lib/api.ts
                                      |
                                      v
                         Express route -> controller -> model/service -> MongoDB/external API
```

## 1. Root-level files

### `README.md`

The root README is an overview and onboarding document. It lists the product features, intended technology stack, quick-start commands, project structure, endpoint summary, security notes, deployment suggestions, and environment variables. It is useful for orientation, but some sections are stale: it mentions Leaflet while the current map implementation uses Google Maps, and it contains old directory names such as `bean-beacon-app-main`. The code and Compose files are the current source of truth.

### `.env.production`

This contains production frontend environment values. Vite exposes only variables prefixed with `VITE_` to browser code, so this file must never contain secrets intended only for the backend.

### `.gitignore`

Defines files Git should not track, normally including dependencies, build output, environment files, and local tooling artifacts. Its purpose is repository hygiene rather than runtime behavior.

### `.gitattributes`

Controls Git behavior such as text normalization. This is especially useful when contributors use different operating systems and line-ending conventions.

### `served-favicon.ico`

Binary favicon copied or served at the repository level. It has no application logic.

### `setup.sh`

The setup helper checks for Node/npm, installs frontend and backend dependencies, and prepares local environment files. It is aimed at Unix-like shells; the Docker Compose workflow is the more portable path for this Windows checkout.

## 2. Backend package and build files

### `bean-beacon-backend/package.json`

- `name`, `version`, and `description` identify the API package.
- `type: "module"` enables native ES modules.
- `main` points at the TypeScript entry during development metadata; production actually starts `dist/index.js`.
- `dev` runs `tsx watch src/index.ts`, so TypeScript is executed directly and restarted on edits.
- `build` runs `tsc`, producing JavaScript in the TypeScript compiler output directory.
- `start` runs the compiled server.
- `test` invokes Vitest.
- Runtime dependencies provide HTTP handling (`express`, `cors`), persistence (`mongoose`), authentication (`jsonwebtoken`, `bcryptjs`), HTTP clients (`axios`), caching (`node-cache`), validation (`express-validator`), configuration (`dotenv`), and metrics (`prom-client`).
- Development dependencies provide TypeScript types, the TypeScript compiler, `tsx`, and Vitest.

### `bean-beacon-backend/tsconfig.json`

Compiler settings define TypeScript source roots, output behavior, module resolution, strictness, and included files. The backend uses `.js` suffixes in imports because the emitted ES modules need resolvable JavaScript filenames after compilation.

### `bean-beacon-backend/Dockerfile`

- The first stage uses Node 22 Alpine as a build image.
- `WORKDIR /app` makes `/app` the project root inside the image.
- Package manifests are copied first so dependency installation can be cached.
- `npm ci` installs the lockfile exactly.
- TypeScript configuration and source are copied, then `npm run build` emits `dist`.
- The production stage starts from a clean Node 22 Alpine image.
- Only production dependencies are installed with `npm ci --omit=dev`.
- The compiled `dist` directory is copied from the build stage.
- Port 3000 is documented and `npm start` launches the compiled server.

### `bean-beacon-backend/Dockerfile.dev`

Uses Node 20 Alpine, installs all dependencies, copies the working tree, exposes port 3000, and runs the hot-reloading `dev` script. Compose bind-mounts the backend directory over `/app` for live editing.

## 3. Backend startup and configuration

### `bean-beacon-backend/src/config/index.ts`

```text
Lines 1–10: build one `config` object from environment variables.
```

- `port` parses `PORT`, defaulting to 3000.
- `nodeEnv` defaults to development.
- `frontendUrl` controls CORS.
- `jwtSecret` and `jwtExpire` control token signing and lifetime.
- `overpassApiUrl` and `nominatimApiUrl` select external API endpoints.
- `nominatimUserAgent` identifies geocoding requests.

The final two exports are convenience booleans used when code needs environment-specific behavior. Production should always override the development JWT fallback.

### `bean-beacon-backend/src/config/database.ts`

- Imports Mongoose.
- Defines an async `connectDB` function.
- Reads `MONGODB_URI`, defaulting to local MongoDB.
- Calls `mongoose.connect` and logs success.
- Logs the error and terminates the process if the database cannot be reached.
- Exports the connection function for startup.

The application intentionally fails fast: serving an API without its database would produce misleading partial failures.

### `bean-beacon-backend/src/index.ts`

Lines 1–8 import Express, CORS, dotenv, database/config helpers, middleware, metrics, and route modules.

Lines 10–11 create the Express app.

Lines 13–19 install CORS, JSON parsing, URL-encoded parsing, and the metrics middleware. CORS allows the configured frontend origin and credentials.

Line 22 awaits MongoDB before accepting traffic.

Lines 25–30 mount the API routers:

- `/api/auth` for registration, login, and current-user lookup;
- `/api/cafes` for discovery, listings, profiles, and recommendations;
- nested `/api/cafes/:cafeId/ratings` for reviews;
- `/api/favorites` for saved cafés;
- `/api/admin` for admin-only review data.

Lines 33–35 expose a public liveness endpoint.

Lines 38–40 expose Prometheus metrics outside `/api`; this avoids the production Nginx API proxy rule and makes the infrastructure endpoint explicit.

Lines 43–48 install centralized errors and a JSON 404 response.

Lines 51–57 start the listener and log the effective ports and URLs.

The default export is useful for tests or tools that import the Express app without necessarily using the listener.

### `bean-beacon-backend/src/metrics.ts`

- Creates a dedicated Prometheus registry.
- Registers default Node/process metrics with the `bean_beacon_` prefix.
- Defines a request-duration histogram with method, route, and status labels.
- Defines a request counter with the same labels.
- `metricsMiddleware` captures a high-resolution start time and registers a response `finish` callback.
- The callback resolves the matched Express route, using `unmatched` for 404/unknown paths to prevent unbounded label cardinality.
- Duration is converted from nanoseconds to seconds and observed in the histogram.
- The request counter is incremented.
- `metricsHandler` sets Prometheus content type and writes the registry output.

## 4. Backend middleware

### `bean-beacon-backend/src/middleware/auth.ts`

Lines 1–4 import JWT, Express request types, the authentication payload type, and configuration.

Lines 6–12 augment Express's `Request` type so controllers can safely access `req.user`.

`authMiddleware`:

- reads the second part of the `Authorization` header (`Bearer token`);
- rejects missing tokens with HTTP 401;
- verifies the token against the configured secret;
- stores decoded claims on `req.user`;
- rejects invalid or expired tokens with HTTP 401.

`optionalAuthMiddleware` follows the same token parsing and verification but continues anonymously when no token exists or verification fails. This supports public listings while still allowing the API to personalize visibility for logged-in users.

`adminMiddleware` checks that a verified user has role `admin`; otherwise it returns HTTP 403.

`errorHandler` logs errors and maps two Mongoose cases specially:

- validation errors become HTTP 400 with combined field messages;
- duplicate-key errors become HTTP 400 naming the conflicting field.

All other errors use their status if present, otherwise 500.

## 5. Backend types and models

### `bean-beacon-backend/src/types/index.ts`

This file defines the compile-time contracts shared by controllers and Mongoose models:

- `AuthPayload` describes JWT claims and optional issued/expiry timestamps.
- `CafeLocation` documents GeoJSON Point coordinates in `[longitude, latitude]` order.
- `UserDocument`, `CafeDocument`, `FavoriteDocument`, and `RatingDocument` describe persisted records.
- `OverpassCafe` describes the normalized subset extracted from Overpass responses.
- `ApiResponse<T>` describes the API envelope.

The types distinguish imported cafés (`osmId`) from user-submitted cafés (`createdBy`, status, free-form menu/hours and tags).

### `src/models/User.ts`

- Defines a Mongoose schema for email, password, name, and role.
- Email is required, unique, lowercased, and checked with a regular expression.
- Password is required, at least six characters, and excluded from normal queries with `select: false`.
- Role is restricted to `user` or `admin` and defaults to `user`.
- A pre-save hook skips hashing when the password is unchanged.
- Otherwise it creates a ten-round bcrypt salt and replaces the plain password with its hash.
- `matchPassword` compares a supplied password to the stored hash.
- Exports the `User` model.

### `src/models/Cafe.ts`

- Defines optional sparse-unique `osmId`; sparse allows many user cafés without an OSM identifier.
- Stores required name, address, and GeoJSON Point coordinates.
- Adds a `2dsphere` index to coordinates for `$near` queries.
- Restricts the legacy café type to `coffee_shop`, `cafe`, or `coworking`.
- Stores contact, opening-hours, beans, Wi-Fi, power, workspace, tags, and rating aggregate fields.
- Stores merged frontend fields: owner, category, free-form hours/menu, future photo paths, coffee types, atmosphere, amenities, and moderation status.
- Status is restricted to pending/approved/rejected and defaults to approved for imported records.
- Timestamps add `createdAt` and `updatedAt`.

### `src/models/Favorite.ts`

Stores `userId` and `cafeId`, indexes the user, and adds a unique compound index so one user cannot save the same café twice.

### `src/models/Rating.ts`

Stores the author, café, numeric score, optional review, optional display name, and timestamps. Score is constrained to 1–5; review and author name have length limits. A unique `(userId, cafeId)` index enforces one review per user/café.

## 6. Backend routes

Routes only declare HTTP shape and middleware order. Business behavior lives in controllers.

### `src/routes/authRoutes.ts`

- `POST /register` is public and calls registration.
- `POST /login` is public and calls login.
- `GET /me` requires JWT authentication.

### `src/routes/cafeRoutes.ts`

- `POST /recommend` is public because recommendation input is supplied by the client.
- `GET /all` uses optional authentication so visibility can depend on the caller.
- `POST /` requires authentication for submissions.
- `PATCH /:id/status` requires both authentication and admin role.
- `DELETE /:id` requires authentication; the controller checks owner/admin authorization.
- `GET /` and `/search` support public discovery with optional identity.
- `GET /:id` returns a profile and also permits anonymous access.

The static routes (`/all`, `/search`) are declared before `/:id`, preventing those words from being interpreted as IDs.

### `src/routes/ratingRoutes.ts`

Uses `mergeParams: true` so nested `cafeId` is available. Reading reviews is public; creating, editing, and deleting reviews require authentication.

### `src/routes/favoriteRoutes.ts`

Listing, adding, and removing favorites require authentication. The check endpoint is optional-auth so anonymous users receive `{ isFavorite: false }` rather than an authentication error.

### `src/routes/adminRoutes.ts`

Protects `GET /admin/reviews` with both JWT and admin middleware before calling the all-ratings controller.

## 7. Backend controllers

### `src/controllers/authController.ts`

`generateToken` signs user ID, email, and role using the configured secret and expiry.

`register`:

1. reads email/password/name;
2. rejects missing fields;
3. rejects duplicate email;
4. constructs and saves a user, triggering password hashing;
5. creates a JWT;
6. returns HTTP 201 with token and safe user fields.

`login`:

1. validates email/password presence;
2. loads the user with the normally hidden password selected;
3. compares the submitted password with bcrypt;
4. returns 401 for either unknown user or bad password;
5. returns a signed token and safe user data.

`getCurrentUser` requires `req.user`, reloads the user by claim ID, and returns current persisted identity fields.

### `src/controllers/cafeController.ts`

`getCafesByLocation`:

- requires latitude and longitude;
- parses radius in kilometers, defaulting to five;
- searches MongoDB with `$near` and converts kilometers to meters;
- limits the first result set to 50;
- if fewer than ten results exist, calls Overpass;
- attempts to persist each unseen OSM record, ignoring individual duplicate/validation failures;
- queries MongoDB again and returns the final nearby set.

`searchCafes` builds a case-insensitive `$or` over name, address, and tags. If coordinates are supplied, it adds a `$near` location condition; otherwise it performs a normal text-like regex query. Results are capped at 50.

`getCafeById` loads by Mongo ID and returns 404 when absent.

`listAllCafes` implements visibility rules:

- anonymous users: approved only;
- regular users: approved plus their own records;
- admins: all statuses.

It sorts newest first and caps output at 200.

`createCafe`:

- requires authentication;
- requires name and address;
- geocodes the address if both coordinates are omitted;
- returns 422 when geocoding finds nothing and 502 when the external service fails;
- validates supplied coordinates and requires both latitude and longitude together;
- trims scalar strings and accepts arrays for tags;
- stores GeoJSON as `[lng, lat]`;
- assigns `pending` to normal users and `approved` to admins;
- ignores any status supplied by the client, preventing self-approval.

`updateCafeStatus` validates the requested status, updates the café, and returns 404 for an unknown ID. The route already ensures the caller is an admin.

`deleteCafe` requires authentication, loads the café, then permits only its creator or an admin to delete it.

### `src/controllers/favoriteController.ts`

Each method first requires a logged-in request (except the optional check route). `getFavorites` finds the user’s favorite IDs and then loads matching café documents. `addFavorite` validates the café, rejects duplicates, and saves the relation. `removeFavorite` deletes the user/café pair and returns 404 if it did not exist. `isFavorite` converts the existence query into a boolean.

### `src/controllers/ratingController.ts`

`getCafeRatings` returns newest reviews first.

`getAllRatings` returns up to 500 reviews for the admin dashboard.

`addRating` validates authentication and score, verifies the café exists, then finds the current user’s existing rating. It updates that document or creates one. It reloads all ratings for the café, calculates the arithmetic mean, rounds to one decimal place, and writes `userRating` and `reviewCount` back to the café.

`updateRating` loads the requested review, ensures its owner matches the current user, applies supplied fields, saves, then repeats aggregate recalculation.

`deleteRating` permits the review owner or an admin, deletes the record, recalculates the aggregate with zero-safe logic, and returns success.

### `src/controllers/recommendationController.ts`

- Extracts drink, atmosphere, location, and shops from the request body.
- Requires each preference to be a string no longer than 120 characters.
- Requires at least one non-empty preference.
- Requires 1–200 café objects.
- Validates each café’s ID, name, optional scalar fields, rating, and string arrays.
- Rejects the entire request if any café is malformed.
- Passes validated data to the recommendation service and returns its top matches.

## 8. Backend services

### `src/services/geocodingService.ts`

- Creates a one-hour in-memory NodeCache.
- Normalizes the address only for the cache key.
- Returns a cached coordinate immediately when available.
- Builds Nominatim’s `/search` endpoint.
- Requests JSON v2 and one result, with the configured User-Agent and a ten-second timeout.
- Converts string latitude/longitude into numbers.
- Rejects invalid numeric output.
- Caches and returns `{ lat, lng }`.

### `src/services/overpassService.ts`

- Creates a one-hour process-local cache.
- Builds a cache key from latitude, longitude, and radius.
- Constructs an OverpassQL bounding-box query for cafés, coffee amenities, and coffee restaurants.
- POSTs URL-encoded query data to Overpass with a 30-second timeout.
- Normalizes nodes and ways; ways use `element.center`.
- Keeps only elements with usable coordinates.
- Caches the normalized array.
- Returns an empty array after logging an external API failure, allowing the caller to return database results.

`getDistance` implements the haversine formula. It is available as a utility, although the main radius query currently delegates distance ordering to MongoDB `$near`.

### `src/services/recommendationService.ts`

`normalize` removes accents and lowercases text. `tokens` splits text on non-alphanumeric characters and ignores one-character tokens. `matchRatio` divides matched unique preference tokens by total unique preference tokens.

For each café, the service scores:

```text
3 × drink match
+ 3 × atmosphere match
+ 2 × location match
```

Zero-score cafés are removed. The rest are sorted by score, then café rating, then name, and limited to three. The reason string identifies the preference dimensions that matched.

## 9. Backend tests

### `src/tests/recommendationService.test.ts`

The Vitest file tests the recommendation service as a pure function. It should cover token normalization, partial matches, ranking, tie-breaking, empty preferences, and the three-result limit. Because the service has no database or network dependency, it is a good unit-test target.

## 10. Frontend package and build files

### `bean-beacon-frontend/package.json`

The frontend uses React 18, React Router, TanStack Query, TypeScript, Vite, Tailwind, Radix/shadcn primitives, Lucide icons, React Hook Form-related packages, date utilities, charts, and toast/theme libraries. Scripts are:

- `dev`: Vite development server;
- `build`: production Vite build;
- `build:dev`: development-mode build;
- `lint`: ESLint;
- `preview`: serve a built bundle.

### `src/vite-env.d.ts`

Provides Vite’s TypeScript ambient declarations, including `import.meta.env` support and asset imports.

### `vite.config.ts`

Configures Vite, React SWC transformation, path aliases, and development behavior. The `@` alias is used throughout the app for `src` imports.

### `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`

Separate browser-app and Node/Vite configuration from the root project reference. They define strict TypeScript checking, module settings, path aliases, and included files.

### `tailwind.config.ts`

Defines Tailwind content paths and theme extensions. It supplies the design tokens consumed by the shadcn-style UI components and enables animation utilities.

### `postcss.config.js`

Loads Tailwind and Autoprefixer into the CSS build pipeline.

### `eslint.config.js`

Configures ESLint for TypeScript/React source, browser globals, hooks rules, and refresh-related linting.

### `components.json`

Describes the shadcn/ui component configuration: style preset, TypeScript mode, Tailwind file, CSS file, import aliases, and component utility paths.

### `index.html`

Defines the browser document shell, metadata, favicon, and the `#root` element where React mounts. Vite injects the module entry during development/build.

## 11. Frontend bootstrap, API, and data

### `src/main.tsx`

- imports React, `createRoot`, `App`, and global CSS;
- finds the `root` DOM element;
- renders `<App />` into it.

### `src/App.tsx`

Lines 1–7 import React, toast providers, tooltip provider, TanStack Query, React Router, and page components.

Line 9 creates one `QueryClient`, which owns request caching and invalidation.

The component returns nested providers:

- `StrictMode` detects unsafe patterns in development;
- `QueryClientProvider` gives pages access to React Query;
- `TooltipProvider` supports Radix tooltips;
- two toaster components provide the project’s two toast APIs;
- `BrowserRouter` enables client-side URLs;
- `Routes` maps the five active routes and a catch-all not-found route.

### `src/lib/api.ts`

The file is the frontend/backend contract.

- `API_URL` reads `VITE_API_URL`, defaulting to `/api`.
- token/user constants identify localStorage keys.
- `ApiUser` defines client identity shape.
- `authStorage` reads, writes, and clears session data.
- a listener `Set` broadcasts auth changes to mounted components.
- `ApiError` carries server status.
- `request<T>` builds JSON headers, adds a bearer token, calls `fetch`, parses JSON, rejects unsuccessful HTTP or API-envelope responses, and returns `body.data`.

The `auth` object exposes sign-in, sign-up, sign-out, current-user, and admin checks. Successful login and signup persist token/user and notify listeners.

`ApiCafe` describes the backend café response, including GeoJSON coordinates. `cafesApi` exposes list, create, status, delete, and recommendation calls.

`ApiRating` describes review records. `reviewsApi` exposes list, upsert/create, and remove operations.

`adminApi.allReviews` calls the admin-only review endpoint.

The backend favorite endpoints exist, but this current wrapper does not expose a `favoritesApi`, so the current frontend does not implement a favorites UI flow.

### `src/data/shops.ts`

- Defines the `CoffeeShop` view model used by cards, map, and profile pages.
- Defines the three filter groups and their allowed labels.
- Supplies six static sample cafés with photos, ratings, distances, categories, addresses, coffee types, atmospheres, and amenities.

These samples are only shown by `useCafes` when the API returns an empty list. They are marked as sample so the UI does not link them to real backend profiles.

### `src/hooks/useCafes.ts`

- Imports React Query, the API, and sample data.
- Defines a fallback Unsplash photo.
- `toShop` converts a backend café to the frontend shape.
- It maps MongoDB `[lng, lat]` into separate `lat` and `lng` fields.
- It maps optional backend fields to safe frontend defaults.
- `useCafes` queries `/cafes/all` under the `cafes` key.
- An empty API response becomes `{ shops: sampleShops, isSample: true }`; otherwise API results are returned as real data.

### `src/lib/utils.ts`

Contains shared presentation helpers, typically class-name merging and error-message normalization. It prevents every component from reimplementing the same small utility behavior.

## 12. Frontend pages

### `src/pages/Index.tsx`

- Imports state, icons, tabs, discovery components, buttons, routing, toast, and café data.
- Defines empty attribute filter state and an accent/case-normalizing function.
- Stores selected category, search text, and selected attributes in local state.
- Loads cafés through `useCafes`.
- `toggleAttr` adds or removes a selected attribute.
- `filteredShops` applies category, name search, and every-selected-attribute matching.
- `handleLocationClick` checks browser geolocation support, requests a position, and displays success/error toasts. It currently does not send those coordinates to `/api/cafes`.
- The returned JSX renders a hero/search area, management link, sample-data notice, recommendation panel, category controls, attribute controls, result count, list tab, map tab, cards, and empty state.

### `src/pages/Manage.tsx`

Contains the sign-in/sign-up form and café submission workflow.

`AuthForm` stores mode, email, password, name, and busy state. Submit chooses `auth.signIn` or `auth.signUp`, reports failures through a toast, and disables the button while waiting.

`CafeForm` stores café fields and tag arrays. Submit trims text, sends the payload to `cafesApi.create`, informs the user that regular submissions are pending, clears the form, and calls its refresh callback.

The page listens for auth changes, displays the authentication form for anonymous users, shows the submission/list-management area for authenticated users, and provides admin dashboard navigation where appropriate.

### `src/pages/CafeProfile.tsx`

- reads the route `id`;
- loads cafés using the shared query;
- finds the matching café;
- displays loading/not-found states;
- builds a photo list from the primary image and gallery;
- renders name, category, address, rating, image, menu, reviews, opening hours, directions, phone, and tags;
- uses `ReviewsPanel` for the review read/write flow.

### `src/pages/Dashboard.tsx`

- tracks current identity through the auth listener;
- enables the dashboard query only for admins;
- fetches cafés and all reviews in parallel;
- calculates live, pending, review, average-rating, and recent-activity statistics in the browser;
- provides handlers for approve/reject, café deletion, and review deletion;
- invalidates dashboard and café queries after mutations;
- renders listing, review, and activity tabs;
- shows a restricted message for anonymous or non-admin users.

### `src/pages/NotFound.tsx`

Renders the fallback page for unmatched client-side routes and provides a navigation path back to the home page.

## 13. Frontend feature components

### `src/components/SearchBar.tsx`

Renders a controlled-by-callback search input and a location button. It does not own search state; `Index` owns it and passes `onSearch` and `onLocationClick`.

### `src/components/CategoryFilter.tsx`

Defines category metadata and renders one button per category. The selected button uses the primary variant; clicking calls the parent’s `onSelect` callback.

### `src/components/AttributeFilters.tsx`

Iterates over coffee type, atmosphere, and amenity groups. Each value is a toggle badge. A clear button appears only when at least one value is selected.

### `src/components/CoffeeShopCard.tsx`

- defines `mapsLink`, which creates a Google Maps search URL from café name/address;
- renders image, open/closed badge, name, category, rating, count, distance, address, and hours;
- embeds a lazy Google Maps iframe;
- offers directions and phone actions;
- shows reviews and profile navigation only for real API records, not samples.

### `src/components/CafeMap.tsx`

- declares Google Maps globals for TypeScript;
- caches the script-loading promise so multiple map instances do not inject multiple scripts;
- reads browser-key and tracking-ID environment variables;
- initializes a world-centered map;
- removes old markers whenever the shop set changes;
- creates a marker and escaped info-window HTML per café with coordinates;
- fits bounds for many cafés and zooms to one café;
- explains when no cafés have coordinates.

The `esc` helper prevents café text from becoming executable HTML inside the info window.

### `src/components/CafeReviews.tsx`

`Stars` renders five stars, optionally clickable. `ReviewsPanel` tracks current user, score, author name, comment, and submit state. It queries reviews, requires authentication to submit, calls the upsert endpoint, shows success/error toasts, and invalidates both review and café caches after saving. `CafeReviews` wraps the panel in a dialog and displays the current review count.

### `src/components/CafeRecommender.tsx`

- stores three free-text preferences and loading/error/result state;
- removes image-only fields before sending café data;
- calls `cafesApi.recommend`;
- displays up to three returned cafés by matching recommendation IDs back to the loaded shop list;
- displays the backend explanation under each result.

### `src/components/NavLink.tsx`

Provides a small router-aware navigation-link abstraction, usually applying active styling based on the current location.

### `src/hooks/use-mobile.tsx`

Uses a media query listener to expose whether the viewport is below the mobile breakpoint. Components can use this for responsive behavior beyond CSS.

### `src/hooks/use-toast.ts` and `src/components/ui/use-toast.ts`

Implement the project’s toast state and dispatch mechanism. One is the application hook and the other is the shadcn primitive’s supporting hook; they coordinate toast creation, dismissal, and timed removal.

## 14. UI primitive files

The files under `src/components/ui/` are shadcn/Radix-style wrappers. They are not business logic, but every one is part of the UI dependency graph:

| File group | Role |
|---|---|
| `button`, `badge`, `card`, `input`, `textarea`, `label` | basic styled controls and containers |
| `dialog`, `alert-dialog`, `drawer`, `sheet`, `popover`, `hover-card` | overlays and transient surfaces |
| `tabs`, `accordion`, `collapsible`, `menubar`, `navigation-menu` | navigation and disclosure |
| `select`, `radio-group`, `checkbox`, `switch`, `toggle`, `toggle-group` | form controls |
| `calendar`, `date`-related helpers, `input-otp` | specialized inputs |
| `table`, `pagination`, `breadcrumb` | structured navigation/data |
| `chart`, `carousel`, `resizable`, `scroll-area`, `progress` | advanced display/layout |
| `avatar`, `separator`, `skeleton`, `tooltip`, `sonner`, `toaster`, `toast` | supporting visual feedback |
| `command`, `context-menu`, `dropdown-menu` | command and action menus |
| `form` | React Hook Form field/context integration |
| `sidebar` | responsive navigation shell |

The recurring line-by-line pattern in these files is:

1. import a Radix primitive and class-name helper;
2. wrap the primitive with `React.forwardRef`;
3. merge default Tailwind classes with `className`;
4. preserve Radix props and refs;
5. assign a display name;
6. export the wrapper and any variants.

They should be treated as reusable presentation infrastructure. The business behavior lives in the page and feature components that consume them.

## 15. Frontend styling and static files

### `src/index.css`

Loads Tailwind’s base/components/utilities layers, defines CSS variables for light/dark design tokens, sets global typography/background/foreground rules, and contains project-wide utility adjustments.

### `src/App.css`

Contains app-specific CSS not represented by Tailwind classes. Current feature screens rely primarily on Tailwind utility classes, so this file is smaller than the component tree.

### `src/assets/bean-brew-roastery.jpg`

Bundled sample image imported by `shops.ts`. It is a static asset, not executable code.

### `public/robots.txt`

Controls crawler behavior for the deployed site.

### `public/placeholder.svg`

Static placeholder image used by the frontend/tooling when an image is unavailable.

## 16. Frontend Docker and Nginx

### `bean-beacon-frontend/Dockerfile`

The build stage installs dependencies, copies the frontend, and runs `vite build`. The production stage uses Nginx, copies the built `dist` directory into the web root, installs the custom Nginx configuration, exposes port 80, and checks that the root page responds.

### `bean-beacon-frontend/Dockerfile.dev`

Runs Vite in host-accessible mode on port 8081 with a bind-mounted source tree and dependency volume.

### `bean-beacon-frontend/nginx/default.conf`

- listens on port 80;
- disables server version tokens;
- serves static files from the Vite output directory;
- proxies `/api/` to `http://backend:3000` and forwards useful proxy headers;
- uses `try_files ... /index.html` for React Router history fallback;
- caches static assets for seven days.

## 17. Docker Compose files

### `docker-compose.yml`

Defines MongoDB, development backend, development frontend, Prometheus, Grafana, cAdvisor, and node-exporter.

- MongoDB publishes 27017 and persists `/data/db` in `mongo-data`.
- Backend waits for MongoDB health, publishes 3000, receives internal service DNS `mongo`, and mounts source for hot reload.
- Frontend waits for backend health, publishes 8081, and mounts source for Vite.
- Prometheus publishes 9090 and persists its time-series database.
- Grafana publishes host 3001 to container 3000 and loads provisioning files read-only.
- cAdvisor observes Docker/container metrics.
- node-exporter exposes host metrics.
- named volumes preserve database, dependency, Prometheus, and Grafana data.

### `docker-compose.prod.yml`

Defines a private `app-network` and production images/services.

- MongoDB is internal-only and persists `mongo-prod-data`.
- Backend uses the multi-stage production image and requires `JWT_SECRET`.
- Frontend serves Nginx on host port 80 and reaches backend over the private network.
- Health checks and `depends_on` enforce startup order.

Monitoring services are present in development Compose but not production Compose.

## 18. Monitoring files

### `monitoring/prometheus.yml`

- sets a 15-second global scrape interval;
- scrapes Prometheus itself;
- scrapes cAdvisor at `cadvisor:8080`;
- scrapes node-exporter at `node-exporter:9100`;
- scrapes the backend at `backend:3000`.

The backend target relies on Prometheus discovering the `/metrics` endpoint convention.

### `monitoring/grafana/provisioning/datasources/prometheus.yml`

Uses Grafana provisioning API version 1 to register Prometheus as the default proxy data source at `http://prometheus:9090`. It is editable from Grafana. No dashboard JSON is committed.

## 19. CI/CD

### `.gitlab-ci.yml`

The pipeline has `validate`, `test`, `security`, and `build` stages.

- Backend validation installs exact dependencies and runs TypeScript build.
- Frontend validation runs lint and production build.
- Backend tests run Vitest in non-watch mode.
- npm audit jobs report high-level issues without failing the pipeline.
- Gitleaks scans the repository and is blocking.
- Docker build jobs create backend/frontend images tagged with the short commit SHA.

The pipeline does not push images or deploy them; it stops at image construction.

## 20. Existing documentation files

### `docs/ARCHITECTURE.md`

The companion architecture document explains system boundaries, runtime flows, API behavior, persistence, deployment, monitoring, and current risks at a conceptual level. This `project.md` adds source-file-oriented detail.

### `docs/API.md`

Documents intended API endpoints, request shapes, responses, and authentication expectations. Verify endpoint details against `src/routes` and controllers because the repository contains historical documentation.

### `docs/DEVELOPMENT.md`

Describes local development commands, debugging, performance suggestions, tests, and Git workflow. Some example paths and feature claims predate the current merged frontend.

### `docs/DEPLOYMENT.md`

Describes hosted frontend/backend options, MongoDB Atlas, environment variables, HTTPS, backups, and troubleshooting. The repository’s production Compose file is the most precise description of the bundled deployment.

### `docs/SETUP.md`

Provides manual and script-based setup instructions for frontend, backend, MongoDB, environment variables, troubleshooting, and IDE setup. Its old frontend directory references should be updated to `bean-beacon-frontend`.

### `bean-beacon-backend/README.md` and `bean-beacon-frontend/README.md`

Package-level READMEs provide local commands and package context. They should be kept aligned with root README, Compose ports, and current route/component names.

## 21. Files intentionally not expanded line by line

The following are not hand-authored application logic or are too large to be useful as a manual walkthrough:

- `package-lock.json` files and `bun.lockb`: generated dependency resolution graphs;
- `src/components/ui/*`: reusable Radix/shadcn wrappers, catalogued above by role and common implementation pattern;
- `src/assets/*.jpg`, `*.ico`, and `*.svg`: binary/static media;
- `node_modules`: third-party source and generated install output;
- generated `dist` output if created locally.

## 22. Runtime sequence examples

### Anonymous discovery

```text
Browser opens /
  -> App selects Index
  -> Index calls useCafes
  -> request() calls GET /api/cafes/all
  -> optional auth sees no token
  -> listAllCafes filters status=approved
  -> Mongoose reads MongoDB
  -> API returns data envelope
  -> useCafes maps GeoJSON record to CoffeeShop
  -> Index filters and renders cards/map
```

### Authenticated café submission

```text
Manage -> auth.signIn/signUp -> localStorage JWT
  -> CafeForm -> POST /api/cafes
  -> authMiddleware verifies JWT
  -> createCafe validates fields
  -> Nominatim converts address to coordinates
  -> Cafe.create stores pending record
  -> frontend invalidates cafes query
```

### Review aggregation

```text
CafeReviews -> POST nested rating route
  -> authMiddleware
  -> addRating creates/updates unique user/café rating
  -> all ratings are read
  -> average and count are calculated
  -> Cafe aggregate fields are updated
  -> response returns saved rating
  -> frontend refreshes reviews and café cards
```

## 23. Current gaps to remember while extending the code

1. Favorites are implemented on the backend but not in the current frontend API/page layer.
2. The location button obtains coordinates but does not call the backend radius endpoint.
3. The map implementation is Google Maps, despite older Leaflet references.
4. Café image/gallery fields exist in the model but are not backed by upload/storage code.
5. Recommendations rank browser-supplied café objects rather than reloading authoritative records.
6. Rating aggregate updates are not transactional under concurrent writes.
7. Rate limiting and centralized request schemas are absent.
8. Process-local caches disappear on restart and are not shared between backend replicas.
9. Existing documentation contains stale paths and port assumptions.

