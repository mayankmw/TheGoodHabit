import express from "express";
import { sendContactMessage } from "../controllers/contact.controller.js";

const router = express.Router();

router.post("/send", sendContactMessage);

export default router;
