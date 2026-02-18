# Bean Beacon - Development Setup Guide

Quick reference for setting up the project locally.

## Prerequisites

- Node.js 16+ 
- npm or yarn
- MongoDB (local or MongoDB Atlas)
- Git

## Automatic Setup (Unix/Linux/macOS)

Run the setup script:
```bash
chmod +x setup.sh
./setup.sh
```

This will:
- Check Node.js installation
- Install frontend dependencies
- Install backend dependencies  
- Create .env files from examples

## Manual Setup

### Frontend

```bash
cd bean-beacon-app-main
npm install
cp .env.example .env
# Edit .env if needed
npm run dev
```

Frontend will be available at `http://localhost:5173`

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
FRONTEND_URL=http://localhost:5173
```

## Running the Application

### Terminal 1 - Backend
```bash
cd bean-beacon-backend
npm run dev
```
Watch for: `Server running on port 3000`

### Terminal 2 - Frontend
```bash
cd bean-beacon-app-main
npm run dev
```
Watch for: `Local: http://localhost:5173`

### Testing

1. Open browser to `http://localhost:5173`
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
- `npm run test` - Run tests (coming soon)

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
code bean-beacon-app-main
```

### View Backend Code  
```bash
code bean-beacon-backend
```

### Clean Install
```bash
# Frontend
cd bean-beacon-app-main
rm -rf node_modules package-lock.json
npm install

# Backend
cd bean-beacon-backend
rm -rf node_modules package-lock.json dist
npm install
```

## Next Steps

- Read the main [README.md](./README.md) for feature overview
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- Explore the [API documentation](./bean-beacon-backend/README.md)

Happy coding! ☕
