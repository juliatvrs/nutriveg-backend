const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "uploads",
    allowed_formats: ["jpg", "jpeg"],
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  },
});

const uploadCloudinary = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = /.jpg|.jpeg/;
    const isAccepted = allowedFileTypes.test(file.mimetype);
    if (isAccepted) cb(null, true);
    else cb(new Error("Apenas arquivos .jpg e .jpeg são aceitos."));
  },
});

module.exports = uploadCloudinary;