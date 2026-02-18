# Bean Beacon - API Documentation

Complete REST API reference for Bean Beacon backend.

**Base URL:** `http://localhost:3000/api`

## Table of Contents
1. [Authentication](#authentication)
2. [Cafés](#cafés)
3. [Favorites](#favorites)
4. [Ratings & Reviews](#ratings--reviews)
5. [Error Handling](#error-handling)

## Authentication

### Register User

Create a new user account.

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

**Errors:**
- `400` - Missing fields, invalid email, or email already registered
- `500` - Server error

---

### Login User

Authenticate and get JWT token.

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

**Errors:**
- `400` - Missing credentials
- `401` - Invalid email or password
- `500` - Server error

---

### Get Current User

Get authenticated user information.

```http
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Errors:**
- `401` - No token provided or invalid token
- `404` - User not found

---

## Cafés

### Get Nearby Cafés

Fetch cafés near a location.

```http
GET /cafes?latitude=40.7128&longitude=-74.0060&radius=5
Authorization: Bearer <token> (optional)
```

**Query Parameters:**
- `latitude` (required, number) - User's latitude
- `longitude` (required, number) - User's longitude  
- `radius` (optional, number, default: 5) - Search radius in kilometers

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "osmId": "1234567",
      "name": "The Coffee House",
      "location": {
        "type": "Point",
        "coordinates": [-74.0060, 40.7128]
      },
      "address": "123 Main St, New York, NY",
      "type": "coffee_shop",
      "userRating": 4.5,
      "reviewCount": 23,
      "wifi": true,
      "powerOutlets": true,
      "quietWorkspace": true,
      "website": "https://thecoffeehouse.com",
      "phone": "+1-212-555-0123"
    }
  ]
}
```

**Errors:**
- `400` - Missing latitude/longitude
- `500` - Server error

---

### Search Cafés

Search cafés by name or address.

```http
GET /cafes/search?query=espresso&latitude=40.7128&longitude=-74.0060
Authorization: Bearer <token> (optional)
```

**Query Parameters:**
- `query` (required, string) - Search term
- `latitude` (optional, number) - For sorting by distance
- `longitude` (optional, number) - For sorting by distance

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Espresso Express",
      "address": "456 Park Ave, New York, NY",
      "type": "cafe",
      "userRating": 4.2,
      "reviewCount": 15,
      "wifi": false,
      "powerOutlets": true,
      "quietWorkspace": false
    }
  ]
}
```

---

### Get Café Details

Get full information for a specific café.

```http
GET /cafes/507f1f77bcf86cd799439011
Authorization: Bearer <token> (optional)
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "osmId": "1234567",
    "name": "The Coffee House",
    "location": {
      "type": "Point",
      "coordinates": [-74.0060, 40.7128]
    },
    "address": "123 Main St, New York, NY",
    "type": "coffee_shop",
    "userRating": 4.5,
    "reviewCount": 23,
    "wifi": true,
    "powerOutlets": true,
    "quietWorkspace": true,
    "website": "https://thecoffeehouse.com",
    "phone": "+1-212-555-0123",
    "tags": ["coffee_shop", "espresso"],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T15:45:00Z"
  }
}
```

**Errors:**
- `404` - Café not found

---

## Favorites

### Get User's Favorites

Get all favorite cafés for authenticated user.

```http
GET /favorites
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "The Coffee House",
      "address": "123 Main St, New York, NY",
      "type": "coffee_shop",
      "userRating": 4.5,
      "reviewCount": 23,
      "wifi": true,
      "powerOutlets": true
    }
  ]
}
```

**Errors:**
- `401` - Not authenticated

---

### Add to Favorites

Add a café to user's favorites.

```http
POST /favorites/{cafeId}
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "cafeId": "507f1f77bcf86cd799439010",
    "createdAt": "2024-01-20T15:45:00Z"
  }
}
```

**Errors:**
- `400` - Already in favorites
- `401` - Not authenticated
- `404` - Café not found

---

### Remove from Favorites

Remove a café from user's favorites.

```http
DELETE /favorites/{cafeId}
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Removed from favorites"
}
```

**Errors:**
- `401` - Not authenticated
- `404` - Favorite not found

---

### Check if Favorite

Check if a café is in user's favorites.

```http
GET /favorites/{cafeId}/check
Authorization: Bearer eyJhbGciOiJIUzI1NiIs... (optional)
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "isFavorite": true
  }
}
```

---

## Ratings & Reviews

### Get Café Ratings

Get all ratings and reviews for a café.

```http
GET /cafes/{cafeId}/ratings
Authorization: Bearer <token> (optional)
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "userId": "507f1f77bcf86cd799439011",
      "cafeId": "507f1f77bcf86cd799439010",
      "rating": 5,
      "review": "Amazing coffee and very friendly staff!",
      "createdAt": "2024-01-20T15:45:00Z",
      "updatedAt": "2024-01-20T15:45:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439016",
      "userId": "507f1f77bcf86cd799439012",
      "cafeId": "507f1f77bcf86cd799439010",
      "rating": 4,
      "review": "Good coffee, bit expensive though.",
      "createdAt": "2024-01-19T12:30:00Z",
      "updatedAt": "2024-01-19T12:30:00Z"
    }
  ]
}
```

---

### Add Rating/Review

Create a new rating and review for a café.

```http
POST /cafes/{cafeId}/ratings
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "rating": 5,
  "review": "Amazing coffee and very friendly staff!"
}
```

**Request Body:**
- `rating` (required, number, 1-5) - Rating score
- `review` (optional, string, max 1000 chars) - Text review

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "userId": "507f1f77bcf86cd799439011",
    "cafeId": "507f1f77bcf86cd799439010",
    "rating": 5,
    "review": "Amazing coffee and very friendly staff!",
    "createdAt": "2024-01-20T15:45:00Z",
    "updatedAt": "2024-01-20T15:45:00Z"
  }
}
```

**Errors:**
- `400` - Invalid rating (must be 1-5)
- `401` - Not authenticated
- `404` - Café not found

---

### Update Rating/Review

Update an existing rating/review.

```http
PUT /cafes/{cafeId}/ratings/{ratingId}
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "rating": 4,
  "review": "Great place, coffee is excellent."
}
```

**Request Body:**
- `rating` (optional, number, 1-5) - New rating
- `review` (optional, string) - Updated review

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "userId": "507f1f77bcf86cd799439011",
    "cafeId": "507f1f77bcf86cd799439010",
    "rating": 4,
    "review": "Great place, coffee is excellent.",
    "createdAt": "2024-01-20T15:45:00Z",
    "updatedAt": "2024-01-20T16:30:00Z"
  }
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Cannot edit other user's rating
- `404` - Rating not found

---

### Delete Rating/Review

Delete a rating/review.

```http
DELETE /cafes/{cafeId}/ratings/{ratingId}
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Rating deleted"
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Cannot delete other user's rating
- `404` - Rating not found

---

## Error Handling

### Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad Request | Check request format and required fields |
| 401 | Unauthorized | Provide valid JWT token |
| 403 | Forbidden | You don't have permission for this action |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Retry later or contact support |

---

## Authentication

All endpoints marked with `Authorization: Bearer <token>` require a valid JWT token in the Authorization header.

**How to send token:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Get a token by:
1. Calling `/auth/register` (returns token)
2. Calling `/auth/login` (returns token)
3. Store token in localStorage on frontend
4. Include in all subsequent requests

---

## Rate Limiting

Currently no rate limiting is implemented. Please use the API responsibly.

## CORS

CORS is enabled for requests from configured frontend URL (see `FRONTEND_URL` in backend `.env`).

---

## Examples

### Complete Authentication Flow

```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword",
    "name": "John Doe"
  }'

# Response includes token - save it!
TOKEN="eyJhbGciOiJIUzI1NiIs..."

# 2. Get nearby cafés (no auth needed)
curl "http://localhost:3000/api/cafes?latitude=40.7128&longitude=-74.0060&radius=5"

# 3. Add to favorites (auth required)
curl -X POST http://localhost:3000/api/favorites/507f1f77bcf86cd799439010 \
  -H "Authorization: Bearer $TOKEN"

# 4. Post a review
curl -X POST http://localhost:3000/api/cafes/507f1f77bcf86cd799439010/ratings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "review": "Great coffee!"
  }'
```

---

For frontend implementation examples, see the [frontend services](../bean-beacon-app-main/src/services/api.ts).
