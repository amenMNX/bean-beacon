# Bean Beacon - Development Setup Guide

> Current setup note: Docker Compose is the recommended workflow for this repository. See [CURRENT_STATUS.md](CURRENT_STATUS.md) for the current ports, map flow, admin routes, and verification commands.

Quick reference for setting up the project locally.

## Prerequisites

- Node.js 16+
- npm or yarn
- MongoDB (local or MongoDB Atlas)
- Git

## Docker Compose Setup (Recommended)

From the repository root, start the application and its dependencies:
```bash
docker compose up -d --build
```

The frontend is available at `http://localhost:8081` and the API health endpoint at
`http://localhost:3000/api/health`. Monitoring services are available at
Prometheus `http://localhost:9090`, Grafana `http://localhost:3001`, and Uptime Kuma
`http://localhost:3002`. Stop the services with `docker compose stop` to preserve volumes.

## Manual Setup

### Frontend

```bash
cd bean-beacon-frontend
npm install
cp .env.example .env
# Edit .env if needed
npm run dev
```

Frontend will be available at `http://localhost:8081`

### Backend

```bash
cd bean-beacon-backend
npm install
cp .env.example .env
# Edit .env with your MONGODB_URI and other settings
npm run dev
```

Backend will be available at `http://localhost:3000`

## Important Notes

### MongoDB Setup

If you don't have MongoDB running locally:

1. **Option A: Use MongoDB Atlas (Cloud)**
   ```
   1. Go to mongodb.com/cloud/atlas
   2. Create free account and cluster
   3. Create database user
   4. Get connection string
   5. Update MONGODB_URI in backend/.env
   ```

2. **Option B: Install MongoDB locally**
   - **macOS:** `brew install mongodb-community && brew services start mongodb-community`
   - **Ubuntu:** `sudo apt-get install mongodb && sudo systemctl start mongodb`
   - **Windows:** Download from mongodb.com/try/download/community

### Environment Variables

The .env files should contain:

**Frontend (.env):**
```
VITE_API_URL=http://localhost:3000/api
```

**Backend (.env):**
```
MONGODB_URI=mongodb://localhost:27017/bean-beacon
JWT_SECRET=your-secret-key (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8081
```
The example secret is for local development only. Production requires a unique random `JWT_SECRET`.

## Running the Application

### Terminal 1 - Backend
```bash
cd bean-beacon-backend
npm run dev
```
Watch for: `Server running on port 3000`

### Terminal 2 - Frontend
```bash
cd bean-beacon-frontend
npm run dev
```
Watch for: `Local: http://localhost:8081`

### Testing

1. Open browser to `http://localhost:8081`
2. Should see landing page
3. Click "Get Started" to register
4. After login, enable geolocation
5. See cafés load on map

### Troubleshooting

**"Cannot GET /api/health"** → Backend not running or wrong URL
- Start backend with `npm run dev`
- Check VITE_API_URL in frontend .env

**"MongoDB connection failed"** → Database issue
- Verify MONGODB_URI is correct
- Ensure MongoDB is running
- Check database user permissions

**"Cannot read geolocation"** → Permission issue
- Check browser console for errors
- Allow location access when prompted
- Some origins (localhost) might need HTTPS

## Development Tools

### Frontend
- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

### Backend
- `npm run dev` - Start dev server with hot reload
- `npm run build` - Compile TypeScript
- `npm start` - Run compiled code
- `npm test -- run` - Run backend tests in non-watch mode

## IDE Setup

### VS Code

Install recommended extensions:
- TypeScript Vue Plugin
- ESLint
- Tailwind CSS IntelliSense
- MongoDB for VS Code
- Thunder Client or REST Client (for API testing)

## Common Tasks

### View Frontend Code
```bash
code bean-beacon-frontend
```

### View Backend Code
```bash
code bean-beacon-backend
```

### Clean Install
```bash
# Frontend
cd bean-beacon-frontend
rm -rf node_modules package-lock.json
npm install

# Backend
cd bean-beacon-backend
rm -rf node_modules package-lock.json dist
npm install
```

## Next Steps

- Read the main [README.md](../README.md) for feature overview
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- Explore the [API documentation](../bean-beacon-backend/README.md)

Happy coding! ☕
