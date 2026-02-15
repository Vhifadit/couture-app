//pour importer express
const express = require('express');
// permet de créer une application express et gérer la base
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Routes
const authRoutes = require('./routes/auth');

// Charger les variables d'environnement
dotenv.config();

// Créer l'app
const app = express();

// Middlewares globaux
// Ce middleware permet d'intercepter le JSON et de le rendre disponible dans req.body
app.use(express.json());

// Monter les routes principales de l'API
app.use('/auth', authRoutes);

// Connexion à MongoDB avec Mongoose
// Utilise MONGO_URI si défini dans .env, sinon garde votre URI actuelle
const mongoUri =
  process.env.MONGO_URI ||
  'mongodb+srv://daagbohounondekavhifadit_db_user:oQ99mJepwhb6aOV9@cluster0.yzdqbov.mongodb.net/?appName=Cluster0';

mongoose
  .connect(mongoUri)
  .then(() => console.log('Connexion réussie à MongoDB avec Mongoose !'))
  .catch((err) => console.error('Erreur de connexion :', err));

// exportation de l'application pour le serveur Node
module.exports = app;
