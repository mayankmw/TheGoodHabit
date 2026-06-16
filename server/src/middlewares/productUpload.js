import multer from "multer";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const PRODUCT_IMAGE_URL = process.env.PRODUCT_IMAGE_URL || "";
const UPLOAD_PATH = process.env.UPLOAD_PATH || "";
const PRODUCT_IMAGE_LIMIT_BYTES = 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOAD_PATH + PRODUCT_IMAGE_URL);
  },
  filename(req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/webp"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only image files allowed"), false);
  }
};

export const uploadProductImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: PRODUCT_IMAGE_LIMIT_BYTES }
});
