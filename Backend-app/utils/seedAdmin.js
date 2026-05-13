// Backend-app/utils/seedAdmin.js
// Lance ce script UNE FOIS pour créer le compte admin initial
// Commande : cd Backend-app && node utils/seedAdmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/user');
const Role = require('../models/role');

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@tailleurconnect.bj';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@1234!';
const ADMIN_NAME     = 'Administrateur';

async function seedAdmin(options = {}) {
  try {
    if (!options.fromServer) {
      const mongoUri = process.env.MONGO_URI || 'mongodb+srv://daagbohounondekavhifadit_db_user:oQ99mJepwhb6aOV9@cluster0.yzdqbov.mongodb.net/?appName=Cluster0';
      await mongoose.connect(mongoUri);
      console.log('✅ Connecté à MongoDB (same as app)');
    }

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log('⚠️  Compte admin existe déjà:', ADMIN_EMAIL);
      if (!options.fromServer) {
        await mongoose.disconnect();
        process.exit(0);
      }
      return;
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    let adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) {
      adminRole = await Role.create({ name: 'admin', description: 'Administrateur système' });
    }

    const admin = await User.create({
      name:          ADMIN_NAME,
      email:         ADMIN_EMAIL,
      passwordHash,
      role:          adminRole._id,
      status:        'actif',
    });

    console.log('🎉 Compte administrateur créé !');
    console.log('   Email:', ADMIN_EMAIL);
    console.log('   Password:', ADMIN_PASSWORD);
    console.log('   ID:', admin._id);
    console.log('\\n⚠️ Change password after first login!');
  } catch (err) {
    console.error('❌ Erreur:', err.message);
  } finally {
    if (!options.fromServer) {
      await mongoose.disconnect();
      process.exit(0);
    }
  }
}

module.exports = seedAdmin;

