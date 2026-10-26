const nodeEnv = process.env.NODE_ENV || "development";
const jwtSecret = process.env.JWT_SECRET;

if (nodeEnv === "production" && !jwtSecret) {
  throw new Error("JWT_SECRET must be set in production");
}

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  jwtSecret: jwtSecret || "your_jwt_secret_key",
  jwtExpire: process.env.JWT_EXPIRE || "7d",
  overpassApiUrl: process.env.OVERPASS_API_URL || "https://overpass-api.de/api/interpreter",
  nominatimApiUrl: process.env.NOMINATIM_API_URL || "https://nominatim.openstreetmap.org",
  nominatimUserAgent: process.env.NOMINATIM_USER_AGENT || "BeanBeacon/1.0",
};

export const isDevelopment = config.nodeEnv === "development";
export const isProduction = config.nodeEnv === "production";
