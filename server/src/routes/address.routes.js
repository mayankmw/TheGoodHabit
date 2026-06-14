import express from "express";
import { auth } from "../middlewares/authMiddleware.js";
import {
  createAddress,
  updateAddress,
  deleteAddress,
  getAddresses,
  setPrimaryAddress
} from "../controllers/address.controller.js";

const router = express.Router();

router.post("/create", auth, createAddress);
router.post("/update", auth, updateAddress);
router.post("/delete", auth, deleteAddress);
router.post("/list", auth, getAddresses);
router.post("/set-primary", auth, setPrimaryAddress);

export default router;
