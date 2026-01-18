import multer from "multer";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const UPLOAD_PATH = process.env.UPLOAD_PATH || "";

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

export const uploadImage = (folder) => {
  const storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, path.join(UPLOAD_PATH, folder));
    },
    filename(req, file, cb) {
      const unique =
        Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    }
  });

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB
  });
};
