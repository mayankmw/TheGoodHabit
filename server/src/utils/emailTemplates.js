import sendEmail from "./sendEmail.js";
import { db } from "../config/db.js";

/**
 * One shared design system for every email the app sends.
 *
 * Email HTML is not web HTML: no flexbox, no grid, no external stylesheets.
 * Outlook renders through Word, so layout is tables, widths are attributes as
 * well as styles, and every style is inline. The one <style> block carries a
 * mobile media query, which the clients that matter honour and the rest
 * safely ignore.
 */

const CLIENT_APP_URL = (process.env.CLIENT_APP_URL || "http://localhost:8080")
  .replace(/\/+$/, "");

const UPLOADS_APP_URL = process.env.UPLOADS_APP_URL || "";
const ASSET_IMAGE_URL = process.env.ASSET_IMAGE_URL || "";

// An explicit override wins — use it to point at a CDN copy of the logo.
const EMAIL_LOGO_OVERRIDE = process.env.EMAIL_LOGO_URL || "";

// Resolved from the assets table (the same row the admin panel uploads to) and
// cached, because it changes about once a year and every email needs it.
let cachedLogoUrl = EMAIL_LOGO_OVERRIDE || "";

// A mail client fetches this from the open internet. If the URL only resolves
// on this machine the <img> renders as a broken box in the inbox, which is
// worse than no image, so those hosts fall back to the wordmark.
const isPubliclyReachable = (url) => {
  try {
    const { hostname } = new URL(url);
    if (["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(hostname)) return false;
    if (/^10\./.test(hostname)) return false;
    if (/^192\.168\./.test(hostname)) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return false;
    if (hostname.endsWith(".local")) return false;
    return true;
  } catch {
    return false;
  }
};

/**
 * Re-reads the logo the admin panel uploaded. Called at boot and whenever an
 * asset is saved, so a new logo reaches emails without a restart.
 */
export const refreshEmailLogo = async () => {
  if (EMAIL_LOGO_OVERRIDE) {
    cachedLogoUrl = EMAIL_LOGO_OVERRIDE;
    return cachedLogoUrl;
  }

  try {
    const [[logo]] = await db.query(
      "SELECT image FROM assets WHERE type = 'logo' AND image IS NOT NULL ORDER BY id LIMIT 1"
    );

    if (!logo?.image) {
      cachedLogoUrl = "";
      return cachedLogoUrl;
    }

    const url = `${UPLOADS_APP_URL}${ASSET_IMAGE_URL}${logo.image}`;

    if (!isPubliclyReachable(url)) {
      console.warn(
        `Email logo not used — ${url} is not reachable from outside this machine. ` +
          "Set UPLOADS_APP_URL to a public origin, or EMAIL_LOGO_URL to a hosted copy."
      );
      cachedLogoUrl = "";
      return cachedLogoUrl;
    }

    cachedLogoUrl = url;
  } catch (err) {
    console.error("Email logo lookup failed:", err.message);
    cachedLogoUrl = "";
  }

  return cachedLogoUrl;
};

const BRAND = "#EC3C85";     // --primary  hsl(335 82% 58%)
const ACCENT = "#FFEC3D";    // --secondary hsl(54 100% 62%)
const PAGE_BG = "#FDF6EE";
const CARD_BG = "#FFFFFF";
const TEXT = "#262626";
const MUTED = "#737373";
const BORDER = "#F2E6DA";
const SUCCESS = "#15803D";

// Poppins is the storefront face but Gmail strips web fonts, so the stack
// degrades to faces that actually exist on the device.
const FONT = "'Poppins','Helvetica Neue',Helvetica,Arial,sans-serif";

export const formatINR = (value) => {
  const n = Number(value || 0);
  // en-IN gives the 1,23,456 grouping Indian customers expect
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

/**
 * A courier tracking URL is admin-typed free text (orders.trackingUrl is a
 * plain VARCHAR) and lands directly in an href, so the scheme is whitelisted
 * and the value escaped for attribute context. Returns "" for anything
 * unusable, which callers treat as "no link".
 */
export const safeUrl = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return "";
  }

  if (!["http:", "https:", "mailto:"].includes(parsed.protocol)) return "";

  return raw
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

export const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * sendEmail throws on any SMTP fault. Nothing an email is attached to — a
 * captured payment, a saved enquiry, a status change — may fail because of it.
 */
export const safeSend = async (to, subject, text, html, attachments = [], headers = null) => {
  if (!to || !String(to).trim()) {
    console.error(`Email skipped — no recipient (${subject})`);
    return { success: false, skipped: true };
  }

  try {
    await sendEmail(to, subject, text, html, attachments, headers);
    return { success: true };
  } catch (err) {
    console.error(`Email failed (${subject}):`, err.message);
    return { success: false, error: err.message };
  }
};

/* ---------------------------------------------------------------- pieces */

export const button = (label, href, color = BRAND) => {
  const safe = safeUrl(href);
  if (!safe) return "";

  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr>
    <td align="center" bgcolor="${color}" style="border-radius:999px;">
      <a href="${safe}" target="_blank" style="display:inline-block;padding:14px 34px;font-family:${FONT};font-size:15px;font-weight:bold;line-height:1;color:#ffffff;text-decoration:none;border-radius:999px;">${label}</a>
    </td>
  </tr>
</table>`;
};

export const paragraph = (html, color = TEXT) =>
  `<p style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:1.65;color:${color};">${html}</p>`;

export const heading = (text) =>
  `<h1 style="margin:0 0 16px;font-family:${FONT};font-size:22px;line-height:1.3;font-weight:bold;color:${TEXT};">${text}</h1>`;

export const divider = () =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid ${BORDER};font-size:0;line-height:0;height:1px;">&nbsp;</td></tr></table>`;

/** A highlighted panel — order number, tracking, anything worth isolating. */
export const panel = (innerHtml, bg = PAGE_BG) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
  <tr>
    <td style="background-color:${bg};border:1px solid ${BORDER};border-radius:12px;padding:18px 20px;font-family:${FONT};font-size:14px;line-height:1.6;color:${TEXT};">${innerHtml}</td>
  </tr>
</table>`;

/** The OTP code, big enough to read and copy on a phone. */
export const codeBlock = (code) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
  <tr>
    <td align="center" style="background-color:${PAGE_BG};border:1px dashed ${BRAND};border-radius:12px;padding:22px 16px;">
      <div style="font-family:${FONT};font-size:32px;font-weight:bold;letter-spacing:10px;color:${BRAND};line-height:1;">${code}</div>
    </td>
  </tr>
</table>`;

/** Line items with right-aligned money, which a <ul> can never do properly. */
export const itemsTable = (items = []) => {
  if (!items.length) return "";

  const rows = items
    .map(
      (i) => `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-family:${FONT};font-size:14px;color:${TEXT};">
      ${escapeHtml(i.name)}
      <span style="color:${MUTED};"> × ${Number(i.quantity)}</span>
    </td>
    <td align="right" style="padding:10px 0;border-bottom:1px solid ${BORDER};font-family:${FONT};font-size:14px;font-weight:bold;color:${TEXT};white-space:nowrap;">
      ${formatINR(Number(i.price) * Number(i.quantity))}
    </td>
  </tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 4px;">${rows}</table>`;
};

export const totalsTable = ({ subtotal, discount, paid }) => {
  const row = (label, value, opts = {}) => `
  <tr>
    <td style="padding:${opts.strong ? "12px 0 0" : "6px 0"};font-family:${FONT};font-size:${opts.strong ? "16px" : "14px"};color:${opts.color || MUTED};${opts.strong ? "font-weight:bold;" : ""}">${label}</td>
    <td align="right" style="padding:${opts.strong ? "12px 0 0" : "6px 0"};font-family:${FONT};font-size:${opts.strong ? "16px" : "14px"};color:${opts.color || TEXT};font-weight:bold;white-space:nowrap;">${value}</td>
  </tr>`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
    ${row("Subtotal", formatINR(subtotal))}
    ${discount > 0 ? row("Discount", `− ${formatINR(discount)}`, { color: SUCCESS }) : ""}
    ${row("Paid", formatINR(paid), { strong: true, color: TEXT })}
  </table>`;
};

export const addressBlock = (title, order) => {
  const lines = [
    order.shippingAddressLine1,
    order.shippingAddressLine2,
    [order.shippingCity, order.shippingState].filter(Boolean).join(", "),
    order.shippingPostalCode,
  ]
    .filter(Boolean)
    .map((l) => escapeHtml(l));

  if (!lines.length) return "";

  return panel(
    `<strong style="color:${MUTED};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">${title}</strong><br />${lines.join("<br />")}`
  );
};

/* ---------------------------------------------------------------- shells */

const brandHeader = () => {
  // the type styles on the <img> are what the alt text inherits in the many
  // clients that block images by default, so it degrades to a wordmark twice over
  const inner = cachedLogoUrl
    ? `<img src="${cachedLogoUrl}" alt="NoshBOB" width="150" style="display:block;border:0;margin:0 auto;max-width:150px;height:auto;font-family:${FONT};font-size:24px;font-weight:bold;letter-spacing:1px;color:#ffffff;" />`
    : `<div style="font-family:${FONT};font-size:26px;font-weight:bold;letter-spacing:1px;color:#ffffff;">NoshBOB</div>`;

  return `
  <tr>
    <td align="center" bgcolor="${BRAND}" style="padding:26px 24px;">
      ${inner}
      <div style="height:4px;width:48px;background-color:${ACCENT};border-radius:999px;margin:12px auto 0;font-size:0;line-height:0;">&nbsp;</div>
    </td>
  </tr>`;
};

const brandFooter = (footerNote = "") => `
  <tr>
    <td style="background-color:${PAGE_BG};padding:24px 28px;border-top:1px solid ${BORDER};">
      ${footerNote ? `<p style="margin:0 0 10px;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED};">${footerNote}</p>` : ""}
      <p style="margin:0 0 6px;font-family:${FONT};font-size:13px;line-height:1.6;color:${TEXT};">
        <a href="${CLIENT_APP_URL}" style="color:${BRAND};text-decoration:none;font-weight:bold;">Shop NoshBOB</a>
        &nbsp;·&nbsp;
        <a href="${CLIENT_APP_URL}/contact" style="color:${BRAND};text-decoration:none;">Contact us</a>
        &nbsp;·&nbsp;
        <a href="${CLIENT_APP_URL}/orders" style="color:${BRAND};text-decoration:none;">Your orders</a>
      </p>
      <p style="margin:0;font-family:${FONT};font-size:11px;line-height:1.6;color:${MUTED};">
        You're receiving this because you shop with NoshBOB.
      </p>
    </td>
  </tr>`;

/**
 * Customer-facing shell: branded header band, white card, footer links.
 * `preheader` is the grey line inboxes show beside the subject.
 */
export const renderEmail = ({ preheader = "", title = "", bodyHtml = "", footerNote = "" }) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title>${escapeHtml(title)}</title>
<style>
  @media only screen and (max-width:620px) {
    .nb-card { width:100% !important; border-radius:0 !important; }
    .nb-pad  { padding:24px 18px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${PAGE_BG};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${PAGE_BG};">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${PAGE_BG};">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" class="nb-card" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:${CARD_BG};border-radius:16px;overflow:hidden;border:1px solid ${BORDER};">
        ${brandHeader()}
        <tr>
          <td class="nb-pad" style="padding:32px 28px;">
            ${bodyHtml}
          </td>
        </tr>
        ${brandFooter(footerNote)}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

/**
 * Internal shell for notifications that go to the shop owner. Deliberately
 * plain — marketing chrome makes an operational alert slower to scan.
 */
export const renderInternalEmail = ({ title = "", rows = [], bodyHtml = "" }) => {
  const rowsHtml = rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:6px 14px 6px 0;font-family:${FONT};font-size:13px;color:${MUTED};white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:6px 0;font-family:${FONT};font-size:14px;color:${TEXT};">${value}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background-color:#F6F6F6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F6F6F6;">
  <tr>
    <td align="center" style="padding:20px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#ffffff;border:1px solid #E5E5E5;border-radius:8px;">
        <tr>
          <td style="padding:18px 22px;border-bottom:2px solid ${BRAND};">
            <div style="font-family:${FONT};font-size:16px;font-weight:bold;color:${TEXT};">${escapeHtml(title)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 22px;">
            ${rowsHtml ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">${rowsHtml}</table>` : ""}
            ${bodyHtml}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
};

/** Wraps admin-authored newsletter HTML without touching the markup itself. */
export const renderNewsletterEmail = ({ preheader = "", title = "", contentHtml = "", unsubscribeUrl = "" }) =>
  renderEmail({
    preheader,
    title,
    bodyHtml: `<div style="font-family:${FONT};font-size:15px;line-height:1.65;color:${TEXT};">${contentHtml}</div>`,
    footerNote: unsubscribeUrl
      ? `Don't want these emails? <a href="${unsubscribeUrl}" style="color:${MUTED};text-decoration:underline;">Unsubscribe here</a>.`
      : "",
  });

const SERVER_APP_URL = (process.env.SERVER_APP_URL || process.env.UPLOADS_APP_URL || "")
  .replace(/\/+$/, "");

/** The page a human lands on from the footer link — it asks before acting. */
export const unsubscribeLink = (token) =>
  token ? `${CLIENT_APP_URL}/unsubscribe?token=${encodeURIComponent(token)}` : "";

/**
 * RFC 8058 one-click headers. Gmail and Yahoo POST to the https URL with a
 * `List-Unsubscribe=One-Click` body and expect the opt-out to happen without
 * any further interaction, so this endpoint must not ask for confirmation.
 */
export const unsubscribeHeaders = (token) => {
  if (!token || !SERVER_APP_URL) return null;

  const oneClick = `${SERVER_APP_URL}/newsletter/unsubscribe/one-click?token=${encodeURIComponent(token)}`;

  return {
    "List-Unsubscribe": `<${oneClick}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
};

export const EMAIL_THEME = { BRAND, ACCENT, PAGE_BG, CARD_BG, TEXT, MUTED, BORDER, SUCCESS, FONT, CLIENT_APP_URL };
