import express from "express";
import {
  subscribeNewsletter,
  unsubscribeNewsletter,
  unsubscribeByToken,
  resubscribeByToken,
  oneClickUnsubscribe,
} from "../controllers/newsletter.controller.js";

const router = express.Router();

router.post("/subscribe", subscribeNewsletter);

// by email, from the site footer form
router.post("/unsubscribe", unsubscribeNewsletter);

// by token, from the link in an email footer
router.post("/unsubscribe/token", unsubscribeByToken);
router.post("/resubscribe/token", resubscribeByToken);

// RFC 8058 one-click: providers POST, humans sometimes GET
router.post("/unsubscribe/one-click", oneClickUnsubscribe);
router.get("/unsubscribe/one-click", oneClickUnsubscribe);

export default router;
