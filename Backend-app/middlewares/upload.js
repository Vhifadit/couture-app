// middlewares/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier s'il n'existe pas
const uploadDir = 'uploads/couturiers';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration stockage local
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'couturier-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// ✅ SANS fileFilter pour tester
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 5
  }
  // ❌ Pas de fileFilter pour l'instant
});

// Middleware to ensure upload dirs exist
const ensureUploadDir = (req, res, next) => {
  const clientsDir = 'uploads/clients';
  if (!fs.existsSync(clientsDir)) {
    fs.mkdirSync(clientsDir, { recursive: true });
  }
  next();
};

// Client photo upload (single file)
const uploadClients = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/clients');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'client-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'), false);
    }
  }
});

module.exports = { upload, uploadClients, ensureUploadDir };

