import multer from "multer";
import path from "path";
import { AppError } from "./error.middleware";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/"); // Thư mục lưu file
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `chat-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    "image/jpeg","image/png","image/gif","image/webp",
    "video/mp4","video/quicktime","video/x-msvideo","video/x-matroska",
    "application/pdf","text/plain",
    "application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "audio/mpeg","audio/wav","audio/ogg",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Loại file không được phép.", 400));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
});
