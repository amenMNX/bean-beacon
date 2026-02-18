import axios, { AxiosInstance } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (email: string, password: string, name: string) =>
    api.post("/auth/register", { email, password, name }),
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  getCurrentUser: () => api.get("/auth/me"),
};

// Cafe API
export const cafeAPI = {
  getCafesByLocation: (latitude: number, longitude: number, radius: number = 5) =>
    api.get("/cafes", { params: { latitude, longitude, radius } }),
  searchCafes: (query: string, latitude?: number, longitude?: number) =>
    api.get("/cafes/search", { params: { query, latitude, longitude } }),
  getCafeById: (id: string) => api.get(`/cafes/${id}`),
};

// Favorites API
export const favoritesAPI = {
  getFavorites: () => api.get("/favorites"),
  addFavorite: (cafeId: string) => api.post(`/favorites/${cafeId}`),
  removeFavorite: (cafeId: string) => api.delete(`/favorites/${cafeId}`),
  isFavorite: (cafeId: string) => api.get(`/favorites/${cafeId}/check`),
};

// Ratings API
export const ratingsAPI = {
  getCafeRatings: (cafeId: string) => api.get(`/cafes/${cafeId}/ratings`),
  addRating: (cafeId: string, rating: number, review?: string) =>
    api.post(`/cafes/${cafeId}/ratings`, { rating, review }),
  updateRating: (cafeId: string, ratingId: string, rating: number, review?: string) =>
    api.put(`/cafes/${cafeId}/ratings/${ratingId}`, { rating, review }),
  deleteRating: (cafeId: string, ratingId: string) =>
    api.delete(`/cafes/${cafeId}/ratings/${ratingId}`),
};

export default api;
