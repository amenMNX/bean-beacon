import client from "prom-client";
import type { NextFunction, Request, Response } from "express";

export const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: "bean_beacon_" });

const httpRequestDuration = new client.Histogram({
  name: "bean_beacon_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

const httpRequestsTotal = new client.Counter({
  name: "bean_beacon_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

/**
 * Records request count + duration per route. Mount before the app's routers
 * so req.route (set during dispatch) is available by the time the response
 * finishes. Falls back to "unmatched" for 404s so unknown paths don't create
 * unbounded label cardinality.
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const route = req.route ? `${req.baseUrl}${req.route.path}` : "unmatched";
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    httpRequestDuration.observe(labels, durationSeconds);
    httpRequestsTotal.inc(labels);
  });

  next();
}

export async function metricsHandler(_req: Request, res: Response) {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
}
