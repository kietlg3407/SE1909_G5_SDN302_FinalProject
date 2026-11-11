const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const { Readable } = require('stream');

// Cấu hình Cloudinary bằng biến môi trường
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

// Cấu hình Storage cho Multer để upload thẳng lên Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'shop_quan_ao_uploads', // Tên folder sẽ tạo trên Cloudinary
    allowedFormats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const origHandleFile = storage._handleFile.bind(storage);
const origRemoveFile = storage._removeFile.bind(storage);

storage._handleFile = function (req, file, cb) {
  const chunks = [];
  let limitReached = false;

  file.stream.on('limit', () => {
    limitReached = true;
  });

  file.stream.on('data', (chunk) => {
    if (!limitReached) {
      chunks.push(chunk);
    }
  });

  file.stream.on('error', (err) => {
    cb(err);
  });

  file.stream.on('end', () => {
    if (limitReached) {
      return cb(null, {});
    }
    const bufferStream = Readable.from(Buffer.concat(chunks));
    Object.defineProperty(file, 'stream', {
      configurable: true,
      enumerable: false,
      value: bufferStream,
    });
    origHandleFile(req, file, cb);
  });
};

storage._removeFile = function (req, file, cb) {
  if (!file || !file.filename) {
    return cb(null);
  }
  origRemoveFile(req, file, cb);
};

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Chỉ chấp nhận tệp hình ảnh định dạng JPEG, PNG hoặc WEBP');
    error.code = 'INVALID_FILE_TYPE';
    error.statusCode = 400;
    cb(error, false);
  }
};

const uploadCloud = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter,
});

module.exports = { cloudinary, uploadCloud };
