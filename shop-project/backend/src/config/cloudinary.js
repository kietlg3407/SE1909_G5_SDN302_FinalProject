const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cấu hình Cloudinary bằng biến môi trường
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cấu hình Storage cho Multer để upload thẳng lên Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'shop_quan_ao_uploads', // Tên folder sẽ tạo trên Cloudinary
    allowedFormats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const uploadCloud = multer({ storage });

module.exports = { cloudinary, uploadCloud };
