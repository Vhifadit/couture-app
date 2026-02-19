// middlewares/upload.js
const multer = require('multer');
const path = require('path');

// Configuration stockage local (développement)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/couturiers/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'couturier-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtre des fichiers (images uniquement)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format non supporté. Utilisez: JPEG, PNG, WEBP'), false);
  }
};

// Configuration upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 5 // Max 5 fichiers simultanés
  },
  fileFilter: fileFilter
});

// Middleware pour créer le dossier si inexistant
const ensureUploadDir = (req, res, next) => {
  const fs = require('fs');
  const dir = 'uploads/couturiers';
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  next();
};

module.exports = { upload, ensureUploadDir };