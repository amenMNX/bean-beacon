// Thin fetch wrapper around the Bean Beacon Express API.
// Replaces direct Supabase table/auth/storage calls.

const API_URL = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "bean-beacon-token";
const USER_KEY = "bean-beacon-user";

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

// --- token/session storage ---

export const authStorage = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  getUser: (): ApiUser | null => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as ApiUser) : null;
  },
  set: (token: string, user: ApiUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

// Simple event so components can react to login/logout without a Context provider.
type Listener = (user: ApiUser | null) => void;
const listeners = new Set<Listener>();
export const onAuthChange = (fn: Listener) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const notifyAuthChange = (user: ApiUser | null) => listeners.forEach((fn) => fn(user));

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const body = await res.json().catch(() => ({}));

  if (!res.ok || body.success === false) {
    throw new ApiError(body.error || `Request failed (${res.status})`, res.status);
  }
  return body.data as T;
}

// --- Auth ---

export const auth = {
  signIn: async (email: string, password: string) => {
    const data = await request<{ token: string; user: ApiUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    authStorage.set(data.token, data.user);
    notifyAuthChange(data.user);
    return data.user;
  },
  signUp: async (email: string, password: string, name: string) => {
    const data = await request<{ token: string; user: ApiUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    authStorage.set(data.token, data.user);
    notifyAuthChange(data.user);
    return data.user;
  },
  signOut: () => {
    authStorage.clear();
    notifyAuthChange(null);
  },
  currentUser: () => authStorage.getUser(),
  isAdmin: () => authStorage.getUser()?.role === "admin",
};

// --- Cafes ---

export type CafeStatus = "pending" | "approved" | "rejected";

export interface ApiCafe {
  _id: string;
  name: string;
  address: string;
  phone?: string;
  hoursText?: string;
  menuText?: string;
  category?: string;
  coffeeTypes?: string[];
  atmosphere?: string[];
  amenities?: string[];
  location: { coordinates: [number, number] }; // [lng, lat]
  createdBy?: string;
  status: CafeStatus;
  userRating: number;
  reviewCount: number;
  createdAt: string;
}

export const cafesApi = {
  listAll: () => request<ApiCafe[]>("/cafes/all"),
  create: (payload: {
    name: string;
    address: string;
    phone?: string;
    hoursText?: string;
    menuText?: string;
    lat?: number;
    lng?: number;
    category: string;
    coffeeTypes: string[];
    atmosphere: string[];
    amenities: string[];
  }) => request<ApiCafe>("/cafes", { method: "POST", body: JSON.stringify(payload) }),
  setStatus: (id: string, status: CafeStatus) =>
    request<ApiCafe>(`/cafes/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  remove: (id: string) => request<void>(`/cafes/${id}`, { method: "DELETE" }),
  recommend: (payload: {
    drink: string;
    atmosphere: string;
    location: string;
    shops: Array<{
      id: string;
      name: string;
      address: string;
      category: string;
      coffeeTypes: string[];
      atmosphere: string[];
      amenities: string[];
      menu?: string;
      rating?: number;
    }>;
  }) =>
    request<{ recommendations: Array<{ id: string; reason: string }> }>("/cafes/recommend", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

// --- Reviews (bean-beacon calls these "ratings") ---

export interface ApiRating {
  _id: string;
  cafeId: string;
  userId: string;
  rating: number;
  review?: string;
  authorName?: string;
  createdAt: string;
}

export const reviewsApi = {
  list: (cafeId: string) => request<ApiRating[]>(`/cafes/${cafeId}/ratings`),
  upsert: (cafeId: string, payload: { rating: number; review?: string; authorName: string }) =>
    request<ApiRating>(`/cafes/${cafeId}/ratings`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  remove: (cafeId: string, ratingId: string) =>
    request<void>(`/cafes/${cafeId}/ratings/${ratingId}`, { method: "DELETE" }),
};

// --- Favorites ---

export const favoritesApi = {
  list: () => request<ApiCafe[]>("/favorites"),
  add: (cafeId: string) => request<void>(`/favorites/${cafeId}`, { method: "POST" }),
  remove: (cafeId: string) => request<void>(`/favorites/${cafeId}`, { method: "DELETE" }),
};

// --- Admin (owner dashboard) ---

export const adminApi = {
  allReviews: () => request<ApiRating[]>("/admin/reviews"),
};
