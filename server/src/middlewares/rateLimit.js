/**
 * A small in-memory rate limiter.
 *
 * Deliberately not a dependency: the only endpoints that need it are the OTP
 * pair, and the counters are cheap. The trade-off is that the window lives in
 * this process — with more than one server instance each keeps its own count,
 * so the effective limit multiplies by the instance count. Move to a shared
 * store (Redis) before scaling out.
 */

const buckets = new Map();

// keeps the map from growing without bound on a long-running process
const sweep = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}, 60_000);
sweep.unref?.();

export const clientIp = (req) =>
  (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
  req.socket?.remoteAddress ||
  "unknown";

const hit = (key, limit, windowMs) => {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  entry.count += 1;

  if (entry.count > limit)
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };

  return { allowed: true, retryAfter: 0 };
};

/**
 * `keys` maps a request to the buckets it consumes, so one route can be
 * limited per-address AND per-IP at once — limiting only by address lets one
 * attacker walk through a list, and only by IP lets a botnet through.
 */
export const rateLimit = ({ limit, windowMs, keys, message }) => (req, res, next) => {
  for (const key of keys(req)) {
    if (!key) continue;

    const { allowed, retryAfter } = hit(key, limit, windowMs);

    if (!allowed) {
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        success: false,
        message: message || "Too many requests — please wait a moment and try again",
        retryAfter,
      });
    }
  }

  return next();
};

/** Lets a successful sign-in clear the failure count for that address. */
export const resetRateLimit = (key) => buckets.delete(key);
