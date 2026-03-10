// utils/seedData.js
// Script pour ajouter des données de test (utilisateurs et couturiers)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Role = require('../models/role');
const Couturier = require('../models/couturier');

async function seedData() {
  console.log('🔄 Début du seed des données...');
  
  // Connexion à MongoDB
  await mongoose.connect('mongodb://localhost:27017/tailleurconnect');
  console.log('✅ Connecté à MongoDB');
  
  // ====== SEED DES RÔLES ======
  console.log('🔄 Seed des rôles...');
  const rolesList = [
    { name: 'admin', description: 'Gestion complète de la plateforme' },
    { name: 'couturier', description: 'Gestion du profil, articles et commandes' },
    { name: 'client', description: 'Consultation des couturiers et passage de commandes' }
  ];
  
  for (const r of rolesList) {
    await Role.updateOne({ name: r.name }, r, { upsert: true });
    console.log(`✅ Rôle '${r.name}' créé/mis à jour`);
  }
  // ====== FIN SEED RÔLES ======
  
  // Vérifier si les données existent déjà
  const existingUsers = await User.countDocuments();
  if (existingUsers > 0) {
    console.log(`⚠️  ${existingUsers} utilisateurs déjà présents. Abandon du seed.`);
    console.log('   Pour re-seed, supprimez les données existantes ou videz la base.');
    await mongoose.disconnect();
    return;
  }
  
  // Récupérer les rôles
  const roleClient = await Role.findOne({ name: 'client' });
  const roleCouturier = await Role.findOne({ name: 'couturier' });
  
  if (!roleClient || !roleCouturier) {
    console.error('❌ Rôles non trouvés après seed');
    await mongoose.disconnect();
    return;
  }
  
  console.log('📋 Rôles trouvés:', { client: roleClient._id, couturier: roleCouturier._id });
  
  // Hasher le mot de passe
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);
  
  // Créer 3 utilisateurs couturiers
  const couturierUsers = [
    {
      name: 'Amani Couture',
      email: 'amani@tailleurconnect.com',
      passwordHash,
      role: roleCouturier._id
    },
    {
      name: 'Marie Création',
      email: 'marie@tailleurconnect.com',
      passwordHash,
      role: roleCouturier._id
    },
    {
      name: 'SOS Retouches',
      email: 'sos@tailleurconnect.com',
      passwordHash,
      role: roleCouturier._id
    }
  ];
  
  // Créer les utilisateurs
  const createdUsers = [];
  for (const userData of couturierUsers) {
    const user = await User.create(userData);
    createdUsers.push(user);
    console.log(`✅ Utilisateur créé: ${user.name} (${user.email})`);
  }
  
  // Créer les profils couturier correspondants
  const couturierProfiles = [
    {
      user_id: createdUsers[0]._id,
      nom_marque: 'Amani Couture',
      description: 'Spécialiste en tenues traditionnelles et robes de mariée sur mesure. Plus de 10 ans d\'expérience dans la confection de vêtements de qualité.',
      telephone: '+229 90 12 34 56',
      adresse: {
        rue: 'Rue de la Cathédrale',
        ville: 'Cotonou',
        quartier: 'Cité des凤仙',
        pays: 'Bénin'
      },
      disponibilite: true,
      services: ['CREATION_SUR_MESURE', 'CONFECTION', 'RETOUCHE'],
      tarifs: {
        retouche: 5000,
        creation_sur_mesure: 35000,
        confection: 25000
      },
      photos: [],
      stats: {
        note_moyenne: 4.8,
        nombre_avis: 24,
        total_commandes: 45,
        commandes_terminees: 42
      }
    },
    {
      user_id: createdUsers[1]._id,
      nom_marque: 'Marie Création',
      description: 'Fashion designer passionnée par les créations modernes et élégantes. Je transforme vos idées en réalités.',
      telephone: '+229 97 65 43 21',
      adresse: {
        rue: 'Avenue Jean Paul II',
        ville: 'Cotonou',
        quartier: 'Akpacodji',
        pays: 'Bénin'
      },
      disponibilite: true,
      services: ['CREATION_SUR_MESURE', 'CONFECTION'],
      tarifs: {
        creation_sur_mesure: 40000,
        confection: 30000
      },
      photos: [],
      stats: {
        note_moyenne: 4.5,
        nombre_avis: 18,
        total_commandes: 32,
        commandes_terminees: 30
      }
    },
    {
      user_id: createdUsers[2]._id,
      nom_marque: 'SOS Retouches',
      description: 'Service rapide de retouches et ajustements. Votre vêtement comme neuf en 24h!',
      telephone: '+229 66 55 44 33',
      adresse: {
        rue: 'Marché Dantokpa',
        ville: 'Cotonou',
        quartier: 'Dantokpa',
        pays: 'Bénin'
      },
      disponibilite: true,
      services: ['RETOUCHE', 'AUTRE'],
      tarifs: {
        retouche: 3000,
        autre: 2000
      },
      photos: [],
      stats: {
        note_moyenne: 4.2,
        nombre_avis: 56,
        total_commandes: 120,
        commandes_terminees: 115
      }
    }
  ];
  
  // Créer les profils couturier
  for (const profileData of couturierProfiles) {
    const couturier = await Couturier.create(profileData);
    console.log(`✅ Profil couturier créé: ${couturier.nom_marque} (ID: ${couturier._id})`);
  }
  
  console.log('🎉 Seed terminé avec succès!');
  console.log('   - 3 utilisateurs couturiers créés');
  console.log('   - 3 profils couturier créés');
  console.log('   - Mot de passe pour tous: password123');
  
  await mongoose.disconnect();
  console.log('✅ Déconnecté de MongoDB');
}

// Exporter pour utilisation dans server.js si besoin
module.exports = seedData;

// Exécuter si appelé directement
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('\n📝 Pour tester:');
      console.log('   1. Lancez le backend: npm start');
      console.log('   2. Connectez-vous avec: amani@tailleurconnect.com / password123');
      console.log('   3. Allez dans /couturiers pour voir la liste');
    })
    .catch(err => {
      console.error('❌ Erreur lors du seed:', err);
      process.exit(1);
    });
}

