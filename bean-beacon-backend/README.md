# Bean Beacon Backend

Smart Coffee Shop Finder - REST API Backend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration (MongoDB URI, JWT secret, etc.)

4. Start development server:
```bash
npm run dev
```

Server runs on `http://localhost:3000`

## Architecture

```
src/
├── index.ts              # Express app setup
├── config/               # Configuration files
├── middleware/           # Express middleware
├── models/               # Database models (Mongoose)
├── routes/               # API routes
├── controllers/          # Business logic
├── services/             # External API integration
├── utils/                # Utility functions
├── types/                # TypeScript types
└── constants/            # Constants
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Coffee Shops
- `GET /api/cafes` - List nearby cafes (with filters)
- `GET /api/cafes/:id` - Get cafe details
- `GET /api/cafes/search` - Search cafes

### Favorites
- `GET /api/favorites` - Get user's favorites
- `POST /api/favorites/:cafeId` - Add to favorites
- `DELETE /api/favorites/:cafeId` - Remove from favorites

### Ratings & Reviews
- `GET /api/cafes/:cafeId/ratings` - Get cafe ratings
- `POST /api/cafes/:cafeId/ratings` - Add rating/review
- `PUT /api/cafes/:cafeId/ratings/:ratingId` - Update rating
- `DELETE /api/cafes/:cafeId/ratings/:ratingId` - Delete rating

## Database Schema

### User
- id, email, password (hashed), name, createdAt, updatedAt

### Cafe
- id, name, latitude, longitude, address, type (coffee_shop/cafe/coworking), rating, reviewCount, tags, etc.

### Favorite
- id, userId, cafeId, createdAt

### Rating/Review
- id, userId, cafeId, rating (1-5), review (text), createdAt, updatedAt
