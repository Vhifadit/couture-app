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

// Créer l'app
const app = express();

// Middlewares globaux
app.use(cors()); // Activation de CORS pour autoriser le frontend
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

// Connexion à MongoDB avec Mongoose
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://daagbohounondekavhifadit_db_user:oQ99mJepwhb6aOV9@cluster0.yzdqbov.mongodb.net/?appName=Cluster0';

mongoose.connect(mongoUri)
  .then(() => console.log('Connexion réussie à MongoDB avec Mongoose !'))
  .catch((err) => console.error('Erreur de connexion :', err));

// exportation de l'application pour le serveur Node
module.exports = app;
