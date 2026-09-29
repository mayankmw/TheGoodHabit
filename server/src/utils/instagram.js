import crypto from "node:crypto";
import { db } from "../config/db.js";

/**
 * The shop's Instagram account, through the Instagram API with Instagram Login.
 *
 * Requests are deliberately unversioned: they follow the Meta app's default
 * API version, so a pinned version being retired can never switch the reels
 * section off.
 */
const GRAPH_URL = "https://graph.instagram.com";

const MEDIA_FIELDS = "id,media_type,media_url,thumbnail_url,permalink,caption,timestamp";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// Instagram's media links are signed and expire, so they are cached briefly
// and never stored
const MEDIA_TTL_MS = HOUR_MS;
// a reel that was removed or made private is asked about again sooner
const MISSING_TTL_MS = 10 * 60 * 1000;

// well inside the token's 60-day life, and past the 24 hours a token has to
// age before Instagram will renew it
const RENEW_AFTER_DAYS = 7;
const SYNC_EVERY_HOURS = 12;

const TOKEN_REJECTED =
  "Instagram rejected the access token (expired or revoked). Put a new one in INSTAGRAM_ACCESS_TOKEN in server/.env and restart the server.";

export class InstagramError extends Error {
  constructor(message, { status = null, code = null } = {}) {
    super(message);
    this.name = "InstagramError";
    this.status = status;
    this.code = code;
  }

  // 190 is Graph's "this token is no good": every call fails until it is replaced
  get isAuthError() {
    return this.code === 190;
  }
}

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

const graphGet = async (path, params, accessToken) => {
  const url = new URL(path, GRAPH_URL);
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  }
  url.searchParams.set("access_token", accessToken);

  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  } catch (err) {
    throw new InstagramError(`Couldn't reach Instagram (${err.message})`);
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok || body.error) {
    throw new InstagramError(body.error?.message || `Instagram answered ${res.status}`, {
      status: res.status,
      code: body.error?.code ?? null,
    });
  }

  return body;
};

const readConnection = async () => {
  const [[row]] = await db.query("SELECT * FROM instagram_connection WHERE id = 1 LIMIT 1");
  return row || null;
};

const setLastError = (message) =>
  db.query("UPDATE instagram_connection SET lastError = ? WHERE id = 1", [message]);

// the .env token being refused is only reported here, since it never made it
// into the table
let setupProblem = null;

const mediaCache = new Map();

/**
 * Takes up INSTAGRAM_ACCESS_TOKEN when it differs from the token the stored
 * connection was seeded from: the first setup, or another account (the shop's
 * own replacing a test one). An unchanged .env leaves the stored token alone,
 * since that one has been renewed in the meantime.
 */
const adoptEnvToken = async () => {
  const token = (process.env.INSTAGRAM_ACCESS_TOKEN || "").trim();
  if (!token) return;

  const hash = sha256(token);
  const current = await readConnection();
  if (current?.sourceTokenHash === hash) return;

  let profile;
  try {
    const me = await graphGet("/me", { fields: "user_id,username" }, token);
    // Meta's docs show this both bare and wrapped in data[]
    profile = Array.isArray(me.data) ? me.data[0] : me;
  } catch (err) {
    setupProblem = `The INSTAGRAM_ACCESS_TOKEN in server/.env was refused by Instagram: ${err.message}`;
    throw err;
  }

  await db.query(
    `REPLACE INTO instagram_connection
       (id, accountId, username, accessToken, tokenExpiresAt, tokenRefreshedAt, sourceTokenHash, lastError)
     VALUES (1, ?, ?, ?, NULL, NULL, ?, NULL)`,
    [String(profile.user_id || profile.id), profile.username, token, hash]
  );

  setupProblem = null;
  mediaCache.clear();
  console.log(`📸 Instagram connected as @${profile.username}`);
};

/**
 * Renews the token well before its 60 days run out. Renewing resets the clock,
 * so as long as the server runs at least once a week the token never expires.
 */
const renewTokenIfDue = async () => {
  const conn = await readConnection();
  if (!conn) return;

  const renewedAt = conn.tokenRefreshedAt ? new Date(conn.tokenRefreshedAt).getTime() : 0;
  if (Date.now() - renewedAt < RENEW_AFTER_DAYS * DAY_MS) return;

  try {
    const body = await graphGet(
      "/refresh_access_token",
      { grant_type: "ig_refresh_token" },
      conn.accessToken
    );

    // matched on the old token, so a .env swap in the meantime wins
    await db.query(
      `UPDATE instagram_connection
       SET accessToken = ?, tokenExpiresAt = DATE_ADD(NOW(), INTERVAL ? SECOND),
           tokenRefreshedAt = NOW(), lastError = NULL
       WHERE id = 1 AND accessToken = ?`,
      [body.access_token, Number(body.expires_in) || 0, conn.accessToken]
    );
  } catch (err) {
    // A token under 24 hours old can't be renewed yet, which is not a problem
    // in itself. Only report the token if it no longer works at all.
    try {
      await graphGet("/me", { fields: "user_id" }, conn.accessToken);
      console.warn("Instagram token not renewed yet, will retry:", err.message);
    } catch (probe) {
      if (probe instanceof InstagramError && probe.isAuthError) await setLastError(TOKEN_REJECTED);
      console.error("Instagram token renewal failed:", probe.message);
    }
  }
};

/** Keeps the connection current for as long as the server is up. */
export const startInstagramSync = () => {
  const run = async () => {
    try {
      await adoptEnvToken();
      await renewTokenIfDue();
    } catch (err) {
      console.error("Instagram sync failed:", err.message);
    }
  };

  run();
  const timer = setInterval(run, SYNC_EVERY_HOURS * HOUR_MS);
  timer.unref?.();   // never hold the process open on its own
};

/**
 * Runs `fn` with the stored connection, and records a refused token so the
 * admin panel can say why reels stopped showing.
 */
const withConnection = async (fn) => {
  const conn = await readConnection();
  if (!conn) throw new InstagramError("Instagram isn't connected yet");

  try {
    const result = await fn(conn);
    if (conn.lastError) await setLastError(null);
    return result;
  } catch (err) {
    if (err instanceof InstagramError && err.isAuthError) await setLastError(TOKEN_REJECTED);
    throw err;
  }
};

const fetchMedia = async (id, conn) => {
  const hit = mediaCache.get(id);
  if (hit && hit.expiresAt > Date.now()) return hit.media;

  try {
    const media = await graphGet(`/${encodeURIComponent(id)}`, { fields: MEDIA_FIELDS }, conn.accessToken);
    mediaCache.set(id, { media, expiresAt: Date.now() + MEDIA_TTL_MS });
    return media;
  } catch (err) {
    // the whole connection is broken, not just this reel
    if (err.isAuthError) throw err;

    // removed, made private, or on another account
    if (err.status >= 400 && err.status < 500) {
      mediaCache.set(id, { media: null, expiresAt: Date.now() + MISSING_TTL_MS });
      return null;
    }

    // Instagram itself is struggling: keep serving what was last seen
    return hit?.media ?? null;
  }
};

/** Current media for each id; a reel Instagram no longer has maps to null. */
export const getMediaByIds = (ids) =>
  withConnection(async (conn) => {
    const media = await Promise.all(ids.map((id) => fetchMedia(id, conn)));
    return new Map(ids.map((id, i) => [id, media[i]]));
  });

/** One reel's media, fetched fresh rather than from the cache. */
export const getMedia = (id) =>
  withConnection(async (conn) => {
    mediaCache.delete(id);
    return fetchMedia(id, conn);
  });

/**
 * The account's videos, newest first, a page at a time. A page can hold fewer
 * than `limit` videos, since photos are filtered out after Instagram pages.
 */
export const listAccountVideos = ({ after = null, limit = 24 } = {}) =>
  withConnection(async (conn) => {
    const body = await graphGet("/me/media", { fields: MEDIA_FIELDS, limit, after }, conn.accessToken);

    return {
      items: (body.data || []).filter((m) => m.media_type === "VIDEO"),
      nextCursor: body.paging?.next ? body.paging.cursors?.after || null : null,
    };
  });

export const getConnectionStatus = async () => {
  const conn = await readConnection();

  return {
    connected: Boolean(conn),
    username: conn?.username || null,
    tokenExpiresAt: conn?.tokenExpiresAt || null,
    problem: setupProblem || conn?.lastError || null,
  };
};
