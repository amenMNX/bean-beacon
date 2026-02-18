# Bean Beacon - Smart Coffee Shop Finder

A modern full-stack web application that helps users discover nearby coffee shops, cafés, and coworking-friendly cafés based on their location, with an interactive map, real-time reviews, and personalized favorites list.

## 📸 Features

✅ **Location-Based Discovery** - Get your location and find nearby cafés on an interactive map
✅ **Interactive Maps** - Leaflet-powered map with OpenStreetMap data
✅ **Real-Time Search** - Search and filter cafés by distance, rating, WiFi, power outlets
✅ **User Reviews & Ratings** - Read and write reviews, rate your favorite spots
✅ **Favorites List** - Save and manage your favorite cafés
✅ **User Authentication** - Secure email/password registration and login
✅ **Dark Mode** - Comfortable viewing in any lighting condition
✅ **Responsive Design** - Works on desktop, tablet, and mobile
✅ **Real Place Data** - Integration with OpenStreetMap/Overpass API

## 🛠 Tech Stack

### Frontend
- **Vite** - Lightning-fast build tool
- **React 18** - Modern UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first styling
- **Leaflet** - Interactive maps
- **React Query** - Data fetching & caching
- **React Router** - Client-side routing
- **shadcn/ui** - High-quality UI components
- **Axios** - HTTP client

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **Bcryptjs** - Password hashing
- **Axios** - HTTP requests
- **Overpass API** - Real-world café data

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn
- MongoDB running locally or MongoDB Atlas connection
- Git

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd bean-beacon-app-main
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```
   Update `VITE_API_URL` if your backend runs on a different port.

4. **Start development server:**
   ```bash
   npm run dev
   ```
   Frontend will be available at `http://localhost:5173`

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd bean-beacon-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Update .env with your configuration:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/bean-beacon
   JWT_SECRET=your_secure_secret_key_here
   JWT_EXPIRE=7d
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```
   Backend will be available at `http://localhost:3000`

## 📁 Project Structure

```
bean-beacon-app-main/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── CafeMap.tsx      # Interactive Leaflet map
│   │   ├── CafeList.tsx     # List view of cafés
│   │   ├── CafeDetails.tsx  # Detailed view with reviews
│   │   ├── SearchFilters.tsx# Search & filter controls
│   │   └── ...
│   ├── pages/               # Page components
│   │   ├── Landing.tsx      # Landing page
│   │   ├── ExplorePage.tsx  # Main explorer page
│   │   ├── AuthPage.tsx     # Login/register page
│   │   ├── FavoritesPage.tsx# Saved favorites
│   │   └── ...
│   ├── services/            # API calls
│   │   └── api.ts           # Axios API client
│   ├── providers/           # React context providers
│   │   ├── AuthProvider.tsx # Authentication context
│   │   └── ThemeProvider.tsx# Dark mode context
│   ├── hooks/               # Custom React hooks
│   │   └── useGeolocation.ts# Geolocation hook
│   ├── utils/               # Utilities
│   └── styles/              # Global styles
├── index.html               # Entry point
├── vite.config.ts           # Vite configuration
├── tailwind.config.ts       # Tailwind CSS config
├── tsconfig.json            # TypeScript config
└── package.json             # Dependencies

bean-beacon-backend/
├── src/
│   ├── models/              # MongoDB schemas
│   │   ├── User.ts          # User model
│   │   ├── Cafe.ts          # Café data model
│   │   ├── Favorite.ts      # User favorites
│   │   └── Rating.ts        # Reviews & ratings
│   ├── controllers/         # Request handlers
│   │   ├── authController.ts# Auth logic
│   │   ├── cafeController.ts# Café endpoints
│   │   ├── favoriteController.ts
│   │   └── ratingController.ts
│   ├── routes/              # API routes
│   │   ├── authRoutes.ts    # /api/auth
│   │   ├── cafeRoutes.ts    # /api/cafes
│   │   ├── favoriteRoutes.ts# /api/favorites
│   │   └── ratingRoutes.ts  # /api/ratings
│   ├── services/            # External APIs
│   │   └── overpassService.ts# OpenStreetMap integration
│   ├── middleware/          # Express middleware
│   │   └── auth.ts          # JWT authentication
│   ├── config/              # Configuration
│   │   ├── database.ts      # MongoDB connection
│   │   └── index.ts         # App config
│   ├── types/               # TypeScript interfaces
│   └── index.ts             # Express app entry point
├── .env.example             # Environment template
├── tsconfig.json            # TypeScript config
└── package.json             # Dependencies
```

## 🔑 Key Features & Implementation

### 1. Geolocation & Maps
- Uses browser Geolocation API to get user's current location
- Leaflet with OpenStreetMap for interactive maps
- Custom markers for user location and cafés
- Real-time marker updates when selecting cafés

### 2. Coffee Shop Discovery
- Fetches real data from OpenStreetMap via Overpass API
- Caches results for 1 hour to reduce API calls
- Shows distance, WiFi availability, power outlets
- Filters by rating and distance radius

### 3. User Authentication
- JWT-based token authentication
- Bcrypt password hashing
- Secure token storage in localStorage
- Protected routes that redirect to login

### 4. Favorites System
- Persisted in MongoDB
- One-click add/remove from favorites
- Accessible from favorites page

### 5. Reviews & Ratings
- 1-5 star rating system
- Optional text reviews
- Community averages displayed
- Edit/delete your own reviews

### 6. Dark Mode
- Theme toggle in navbar
- Persisted preference in localStorage
- System preference detection

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register        - Create account
POST   /api/auth/login           - Login user
GET    /api/auth/me              - Get current user
```

### Cafés
```
GET    /api/cafes?lat=&lon=&radius=   - Get nearby cafés
GET    /api/cafes/search?query=        - Search cafés
GET    /api/cafes/:id                  - Get café details
```

### Favorites
```
GET    /api/favorites                  - Get user's favorites
POST   /api/favorites/:cafeId          - Add to favorites
DELETE /api/favorites/:cafeId          - Remove from favorites
GET    /api/favorites/:cafeId/check    - Check if favorite
```

### Ratings
```
GET    /api/cafes/:cafeId/ratings      - Get café ratings
POST   /api/cafes/:cafeId/ratings      - Add rating
PUT    /api/cafes/:cafeId/ratings/:id  - Update rating
DELETE /api/cafes/:cafeId/ratings/:id  - Delete rating
```

## 🔐 Security Considerations

- JWT tokens are stored in localStorage
- Passwords are hashed with bcrypt (10 salt rounds)
- Protected endpoints require valid JWT
- CORS configured for frontend URL
- Input validation on all endpoints
- Environment variables for sensitive data

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
```
Deploy the `dist` folder to Vercel or Netlify.

Set environment variable:
```
VITE_API_URL=https://your-backend-url/api
```

### Backend (Render/Railway)
```bash
npm run build
npm start
```

Set environment variables on hosting platform.

## 📝 Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000/api
```

### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/bean-beacon
JWT_SECRET=your_secure_secret_key
JWT_EXPIRE=7d
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
OVERPASS_API_URL=https://overpass-api.de/api/interpreter
NOMINATIM_API_URL=https://nominatim.openstreetmap.org
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## ☕ Support

Found a café you love? Share it with the community via Bean Beacon!

Need help? Check the documentation or open an issue on GitHub.

---

**Built with ☕ and ❤️ for coffee lovers everywhere**
