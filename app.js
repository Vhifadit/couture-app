//pour importer express
const express = require('express');
// permet de créer une application express et gérer la base
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const path = require('path'); 

// Routes
const authRoutes = require('./routes/auth');

const orderRoutes = require('./routes/order'); 

const couturierRoutes = require('./routes/couturier');

const clientRoutes = require('./routes/client');

const articleRoutes = require('./routes/article');


// ...


// app.js - Ajouter après les middlewares globaux

// Servir les fichiers statiques (uploads)





// Charger les variables d'environnement


// Créer l'app
const app = express();

// Middlewares globaux
// Ce middleware permet d'intercepter le JSON et de le rendre disponible dans req.body
app.use(express.json());

// Monter les routes principales de l'API
app.use('/auth', authRoutes);

app.use('/orders', orderRoutes);

app.use('/couturiers', couturierRoutes);

app.use('/clients', clientRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/articles', articleRoutes);



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
