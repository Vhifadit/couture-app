// On importe le modèle Role pour pouvoir interagir avec la collection "roles"
const Role = require('../models/role');

// Fonction asynchrone qui initialise les rôles par défaut
async function seedRoles() {
  console.log('🔄 Début de l\'initialisation des rôles...');
  
  // Liste des rôles que l'on veut avoir dans la base dès le démarrage
  const roles = [
    { name: 'admin', description: 'Gestion complète de la plateforme' },
    { name: 'couturier', description: 'Gestion du profil, articles et commandes' },
    { name: 'client', description: 'Consultation des couturiers et passage de commandes' }
  ];

  // Boucle sur chaque rôle de la liste
  for (const r of roles) {
    try {
      // updateOne va chercher un rôle par son "name"
      // - Si le rôle existe déjà, il met à jour sa description
      // - Si le rôle n'existe pas, il le crée (grâce à l'option upsert: true)
      const result = await Role.updateOne({ name: r.name }, r, { upsert: true });
      
      if (result.upsertedId) {
        console.log(`✅ Rôle '${r.name}' créé avec succès`);
      } else {
        console.log(`✅ Rôle '${r.name}' déjà existant, mis à jour`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la création du rôle '${r.name}':`, error.message);
      throw error; // Rethrow to stop startup if roles fail
    }
  }
  
  // Vérifier que les rôles existent
  const count = await Role.countDocuments();
  console.log(`📊 Total des rôles en base: ${count}`);
  
  // Lister les rôles
  const existingRoles = await Role.find({}).select('name');
  console.log('📋 Rôles disponibles:', existingRoles.map(r => r.name).join(', '));
}

// On exporte la fonction pour pouvoir l'utiliser dans server.js
module.exports = seedRoles;

