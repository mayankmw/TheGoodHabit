import { db } from "../config/db.js";
import { sendAbandonedCheckoutEmail } from "./orderEmails.js";

// How long a checkout may sit unpaid before we call it abandoned. Razorpay
// sessions are long gone well before this, so it is about giving a slow
// customer room rather than matching any gateway timeout.
const ABANDON_AFTER_MINUTES = Number(process.env.ABANDON_AFTER_MINUTES) || 60;

// A separate, longer wait before nudging — emailing someone who stepped away
// for five minutes reads as pushy.
const RECOVERY_EMAIL_AFTER_MINUTES =
  Number(process.env.RECOVERY_EMAIL_AFTER_MINUTES) || 120;

/**
 * Marks stale unpaid checkouts as abandoned.
 *
 * Only ever touches orders whose payment never reached 'paid'. Stock is not
 * restored because it was never taken — the decrement happens at payment
 * verification, so a pending order holds nothing.
 */
export const sweepAbandonedCheckouts = async () => {
  const [stale] = await db.query(
    `SELECT o.id
     FROM orders o
     LEFT JOIN payments p ON p.orderId = o.id
     WHERE o.status = 'pending'
       AND o.createdAt < (NOW() - INTERVAL ? MINUTE)
       AND (p.status IS NULL OR p.status <> 'paid')`,
    [ABANDON_AFTER_MINUTES]
  );

  if (!stale.length) return { abandoned: 0, emailed: 0 };

  const ids = stale.map((o) => o.id);
  await db.query(
    `UPDATE orders SET status = 'abandoned', abandonedAt = NOW()
     WHERE id IN (${ids.map(() => "?").join(",")})`,
    ids
  );

  return { abandoned: ids.length, emailed: 0 };
};

/**
 * Sends the recovery nudge, once per order. recoveryEmailSentAt is stamped
 * before the send so a slow mail server can't cause a second sweep to email
 * the same customer twice.
 */
export const sendRecoveryEmails = async () => {
  const [due] = await db.query(
    `SELECT id FROM orders
     WHERE status = 'abandoned'
       AND recoveryEmailSentAt IS NULL
       AND abandonedAt < (NOW() - INTERVAL ? MINUTE)
     LIMIT 25`,
    [Math.max(RECOVERY_EMAIL_AFTER_MINUTES - ABANDON_AFTER_MINUTES, 0)]
  );

  let emailed = 0;

  for (const order of due) {
    await db.query("UPDATE orders SET recoveryEmailSentAt = NOW() WHERE id = ?", [order.id]);
    await sendAbandonedCheckoutEmail(order.id);
    emailed += 1;
  }

  return emailed;
};

export const runAbandonedCheckoutSweep = async () => {
  try {
    const { abandoned } = await sweepAbandonedCheckouts();
    const emailed = await sendRecoveryEmails();

    if (abandoned || emailed)
      console.log(`🧹 abandoned checkouts: ${abandoned} marked, ${emailed} nudged`);

    return { abandoned, emailed };
  } catch (err) {
    console.error("Abandoned checkout sweep failed:", err.message);
    return { abandoned: 0, emailed: 0, error: err.message };
  }
};

/** Runs the sweep periodically for as long as the server is up. */
export const startAbandonedCheckoutSweep = () => {
  const everyMinutes = Number(process.env.ABANDON_SWEEP_EVERY_MINUTES) || 15;

  runAbandonedCheckoutSweep();
  const timer = setInterval(runAbandonedCheckoutSweep, everyMinutes * 60 * 1000);
  timer.unref?.();   // never hold the process open on its own

  console.log(`🧹 abandoned checkout sweep every ${everyMinutes}m (abandon after ${ABANDON_AFTER_MINUTES}m)`);
};
