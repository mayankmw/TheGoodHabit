import express from "express";
import { getAssets, getSliders, getStory, getSocials } from "../controllers/public.controller.js";

const router = express.Router();

router.get("/assets", getAssets);
router.get("/sliders", getSliders);
router.get("/story", getStory);
router.get("/socials", getSocials);

export default router;
