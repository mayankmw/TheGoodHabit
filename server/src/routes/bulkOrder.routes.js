import express from "express";
import { submitBulkOrder } from "../controllers/bulkOrder.controller.js";

const router = express.Router();

router.post("/submit", submitBulkOrder);

export default router;
