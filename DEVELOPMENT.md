# Bean Beacon - Development Guide

Guide for developers working on Bean Beacon.

## Code Overview

### Frontend Architecture

**Layers:**
1. **Pages** (`src/pages/`) - Full page components
2. **Components** (`src/components/`) - Reusable UI components
3. **Providers** (`src/providers/`) - Context providers (Auth, Theme)
4. **Hooks** (`src/hooks/`) - Custom React hooks
5. **Services** (`src/services/`) - API calls
6. **Utils** (`src/utils/`) - Utility functions

**Data Flow:**
```
User Interaction
    ↓
Component State/Hooks
    ↓
API Service Call (Axios)
    ↓
Backend Response
    ↓
Context/Query Update
    ↓
Component Re-render
```

### Backend Architecture

**Layers:**
1. **Routes** (`src/routes/`) - Express route handlers
2. **Controllers** (`src/controllers/`) - Business logic
3. **Services** (`src/services/`) - External integrations (Overpass API)
4. **Models** (`src/models/`) - Mongoose schemas
5. **Middleware** - Request processing (Auth, Error handling)
6. **Config** - Configuration and setup

**Request Flow:**
```
HTTP Request
    ↓
Middleware (Auth check, etc.)
    ↓
Route Handler
    ↓
Controller (Business logic)
    ↓
Models (Database operations)
    ↓
Service (External APIs if needed)
    ↓
Response
```

## Key Files to Modify

### Frontend - Adding a New Page

1. **Create page component** in `src/pages/NewPage.tsx`:
```typescript
export const NewPage = () => {
  return <div>New Page</div>;
};
```

2. **Add route** in `src/App.tsx`:
```typescript
<Route path="/newpage" element={<NewPage />} />
```

3. **Navigation** - Update nav in components

### Frontend - Adding a New Component

1. **Create component** in `src/components/NewComponent.tsx`:
```typescript
interface NewComponentProps {
  title: string;
}

export const NewComponent = ({ title }: NewComponentProps) => {
  return <div>{title}</div>;
};
```

2. **Use in pages/components**:
```typescript
import { NewComponent } from "@/components/NewComponent";

<NewComponent title="Hello" />
```

### Backend - Adding a New API Endpoint

1. **Create model** in `src/models/` (if needed):
```typescript
import mongoose, { Schema } from "mongoose";

const itemSchema = new Schema(
  {
    name: String,
    // ... fields
  },
  { timestamps: true }
);

export const Item = mongoose.model("Item", itemSchema);
```

2. **Create controller** in `src/controllers/`:
```typescript
import { Item } from "../models/Item.js";

export const getItems = async (req: Request, res: Response) => {
  try {
    const items = await Item.find();
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

3. **Create route** in `src/routes/`:
```typescript
import { Router } from "express";
import { getItems } from "../controllers/itemController.js";

const router = Router();
router.get("/", getItems);
export default router;
```

4. **Register route** in `src/index.ts`:
```typescript
import itemRoutes from "./routes/itemRoutes.js";
app.use("/api/items", itemRoutes);
```

## Common Tasks

### Testing API Endpoints

Use Thunder Client, Postman, or curl:

```bash
# Get cafés
curl "http://localhost:3000/api/cafes?latitude=40.7128&longitude=-74.0060"

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password"}'

# Get favorites (with token)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/favorites
```

### Database Queries

Using MongoDB/Mongoose in controllers:

```typescript
// Find all
const items = await Item.find();

// Find by ID
const item = await Item.findById(id);

// Find with conditions
const items = await Item.find({ type: "cafe" });

// Create
const item = new Item({ name: "New Item" });
await item.save();

// Update
await Item.updateOne({ _id: id }, { name: "Updated" });

// Delete
await Item.deleteOne({ _id: id });

// Geospatial query
const nearby = await Cafe.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [lon, lat] },
      $maxDistance: 5000
    }
  }
});
```

### Using useQuery (React Query)

```typescript
import { useQuery } from "@tanstack/react-query";
import { cafeAPI } from "@/services/api";

const { data, isLoading, error } = useQuery({
  queryKey: ["cafes", latitude, longitude],
  queryFn: () => cafeAPI.getCafesByLocation(latitude, longitude)
    .then(res => res.data.data),
  enabled: !!latitude // Only run if latitude exists
});

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;
return <div>{data?.length} cafés found</div>;
```

### Using Context

```typescript
// Create context
const MyContext = createContext<MyType | undefined>(undefined);

export const MyProvider = ({ children }) => {
  const [state, setState] = useState(initialValue);
  return (
    <MyContext.Provider value={{ state, setState }}>
      {children}
    </MyContext.Provider>
  );
};

// Use context
export const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) throw new Error("Must be used within provider");
  return context;
};

// In component
const { state, setState } = useMyContext();
```

### Environment Variables

**Frontend:**
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;
```

**Backend:**
```typescript
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET;
```

## Debugging

### Frontend Debugging

1. **Browser DevTools:**
   - Open DevTools (F12)
   - Console tab for errors
   - Network tab for API calls
   - Application tab to view localStorage
   - React DevTools extension (helpful!)

2. **Console Logging:**
```typescript
console.log("Debug:", value);
console.error("Error:", error);
console.warn("Warning:", issue);
```

3. **VS Code Debugging:**
   - Install "Debugger for Firefox" or "Debugger for Chrome"
   - Set breakpoints
   - Debug config in `launch.json`

### Backend Debugging

1. **Console Logging:**
```typescript
console.log("API called:", req.path);
console.error("Database error:", error);
```

2. **VS Code Debugging:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/bean-beacon-backend/src/index.ts",
      "preLaunchTask": "tsc",
      "name": "Launch Backend"
    }
  ]
}
```

3. **MongoDB Debugging:**
```bash
# Check if MongoDB is running
mongosh

# Query directly
db.cafes.find();
db.users.find();
```

## Performance Tips

### Frontend

1. **Code Splitting:**
```typescript
const LazyComponent = lazy(() => import('./HeavyComponent'));
<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>
```

2. **Memoization:**
```typescript
const MemoComponent = memo(Component);
const memoizedValue = useMemo(() => expensiveCalculation(a, b), [a, b]);
const memoizedCallback = useCallback(() => doSomething(a, b), [a, b]);
```

3. **Query Optimization:**
```typescript
// Don't refetch if data is fresh
useQuery({
  queryKey: ["cafes"],
  queryFn: getCafes,
  staleTime: 5 * 60 * 1000, // 5 minutes
})
```

### Backend

1. **Database Indexing:**
```typescript
// Already indexed in schema
userSchema.index({ email: 1 }); // Fast lookups
cafeSchema.index({ location: "2dsphere" }); // Geospatial
```

2. **Query Optimization:**
```typescript
// Select specific fields
const users = await User.find().select('name email');

// Pagination
const page = req.query.page || 1;
const limit = 20;
const users = await User.find()
  .skip((page - 1) * limit)
  .limit(limit);
```

3. **Caching:**
```typescript
const cache = new NodeCache({ stdTTL: 3600 });
const cached = cache.get('key');
if (!cached) {
  const data = await fetchExpensive();
  cache.set('key', data);
}
```

## Testing

### Frontend Unit Tests (Coming Soon)

```typescript
import { render, screen } from '@testing-library/react';
import { CafeCard } from '@/components/CafeCard';

test('renders cafe name', () => {
  render(<CafeCard cafe={{ name: 'Test Cafe' }} />);
  expect(screen.getByText('Test Cafe')).toBeInTheDocument();
});
```

### Backend Unit Tests (Coming Soon)

```typescript
import { describe, it, expect } from 'vitest';
import { calculateDistance } from '@/utils/distance';

describe('calculateDistance', () => {
  it('calculates distance between two coordinates', () => {
    const distance = calculateDistance(40, -74, 40.1, -74.1);
    expect(distance).toBeGreaterThan(0);
  });
});
```

## Git Workflow

1. **Create feature branch:**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make changes and commit:**
   ```bash
   git add .
   git commit -m "Add: description of changes"
   ```

3. **Push and create PR:**
   ```bash
   git push origin feature/your-feature
   ```

4. **Good commit messages:**
   - `Add: New feature`
   - `Fix: Bug fix`
   - `Refactor: Code reorganization`
   - `Docs: Documentation update`
   - `Test: Adding tests`

## Useful Commands

```bash
# Frontend
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run linter
npm run preview  # Preview production build

# Backend
npm run dev      # Start with hot reload
npm run build    # Compile TypeScript
npm start        # Run compiled code

# Both
rm -rf node_modules package-lock.json
npm install      # Fresh install
```

## Resources

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptbook.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Leaflet Documentation](https://leafletjs.com)
- [Express.js Guide](https://expressjs.com)
- [MongoDB Docs](https://docs.mongodb.com)
- [Vite Documentation](https://vitejs.dev)

## Getting Help

1. Check existing issues on GitHub
2. Search in documentation
3. Ask in discussions or create an issue
4. Check browser console for errors
5. Check backend logs for API errors

---

Happy coding! ☕
