// pour importer express
const express = require('express');
// permet de créer une application express et gérer la base
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path'); 
const cors = require('cors'); 

dotenv.config();

// Routes
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/order'); 
const couturierRoutes = require('./routes/couturier');
const clientRoutes = require('./routes/client');
const articleRoutes = require('./routes/article');
const chatRoutes = require('./routes/chat');
const notificationController = require('./controllers/notification');

const notificationRoutes = require('./routes/notification');

const adminRoutes = require('./routes/admin_routes');

// Créer l'app
const app = express();

const cron = require('node-cron');

// Cron toutes les 6h pour rappels auto (00:00, 06:00, 12:00, 18:00)
cron.schedule('0 */6 * * *', async () => {
  console.log('🔔 Lancement cron rappels notifications...');
  try {
    const result = await notificationController.processReminders();
    console.log(`✅ Cron rappels OK: ${result.reminders} rappels, ${result.late} retards`);
  } catch (err) {
    console.error('❌ Erreur cron rappels:', err);
  }
});

console.log('🕐 Cron notifications activé (toutes 6h)');

app.set('trust proxy', 1);

// Middlewares globaux
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }
  return next();
});

app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})); // CORS for frontend
app.use(express.json());

// Servir les fichiers statiques (uploads)
// Accessible via http://localhost:3001/uploads/nom_image.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Monter les routes principales de l'API
// Ajout du préfixe '/api' pour correspondre à la config du frontend
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/couturiers', couturierRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/admin', adminRoutes);

// Connexion à MongoDB avec Mongoose
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://daagbohounondekavhifadit_db_user:oQ99mJepwhb6aOV9@cluster0.yzdqbov.mongodb.net/?appName=Cluster0';

mongoose.connect(mongoUri)
  .then(() => console.log('Connexion réussie à MongoDB avec Mongoose !'))
  .catch((err) => console.error('Erreur de connexion :', err));

// exportation de l'application pour le serveur Node
module.exports = app;
