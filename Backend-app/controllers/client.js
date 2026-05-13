const path = require('path');
const fs = require('fs');
const Client = require('../models/client')
const User = require('../models/user');
const Couturier = require('../models/couturier');

// Helpers
const deleteLocalFileIfExists = async (filePath) => {
  try {
    if (!filePath) return;
    const normalized = String(filePath).replaceAll('\\', '/');
    if (!normalized.includes('uploads/')) return;

    const absoluteCandidates = [
      path.join(process.cwd(), normalized),
      path.join(process.cwd(), normalized.startsWith('/') ? normalized.slice(1) : normalized),
    ];

    for (const candidate of absoluteCandidates) {
      if (fs.existsSync(candidate)) {
        await fs.promises.unlink(candidate);
        return;
      }
    }
  } catch {
    // ignore
  }
};



// Créer un profil client (après inscription)
const createProfile = async (req, res) => {
  try {
    const userId = req.user.sub;
    
    // Vérifier que l'utilisateur a le rôle client
    const user = await User.findById(userId).populate('role');
    if (user.role.name !== 'client') {
      return res.status(403).json({ message: 'Profil client réservé aux clients' });
    }
    
    // Vérifier si profil existe déjà
    const existing = await Client.findOne({ user_id: userId });
    if (existing) {
      return res.status(409).json({ message: 'Profil client déjà existant' });
    }
    
    const { telephone, adresses, preferences, mesures_type } = req.body;
    
    // Créer le profil
    const client = await Client.create({
      user_id: userId,
      telephone,
      adresses: adresses || [],
      preferences: preferences || {},
      mesures_type: mesures_type || {}
    });
    
    // Retourner avec les infos User
    const clientPopulated = await Client.findById(client._id)
      .populate('user_id', 'name email');
    
    res.status(201).json({
      message: 'Profil client créé avec succès',
      client: clientPopulated
    });
    
  } catch (error) {
    console.error('Create client profile error:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Obtenir son profil client
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.sub;
    
    const client = await Client.findOne({ user_id: userId })
      .populate('user_id', 'name email');
    
    if (!client) {
      return res.status(404).json({ message: 'Profil client non trouvé' });
    }
    
    res.json({ client });
    
  } catch (error) {
    console.error('Get client profile error:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Mettre à jour son profil
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.sub;
    const updates = req.body;
    
    // Champs autorisés
    const allowedUpdates = ['telephone', 'preferences', 'mesures_type'];
    const updateData = {};
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });
    
    const client = await Client.findOneAndUpdate(
      { user_id: userId },
      updateData,
      { new: true }
    ).populate('user_id', 'name email');
    
    if (!client) {
      return res.status(404).json({ message: 'Profil client non trouvé' });
    }
    
    res.json({
      message: 'Profil mis à jour',
      client
    });
    
  } catch (error) {
    console.error('Update client profile error:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Ajouter une adresse
const addAddress = async (req, res) => {
  try {
    const userId = req.user.sub;
    const newAddress = req.body;
    
    // Validation minimale
    if (!newAddress.nom || !newAddress.rue || !newAddress.quartier || !newAddress.ville) {
      return res.status(400).json({ message: 'Champs obligatoires: nom, rue, quartier, ville' });
    }
    
    const client = await Client.findOne({ user_id: userId });
    if (!client) {
      return res.status(404).json({ message: 'Profil client non trouvé' });
    }
    
    // Si première adresse ou marquée comme principale
    if (client.adresses.length === 0 || newAddress.est_principale) {
      // Retirer le statut principal des autres
      client.adresses.forEach(addr => addr.est_principale = false);
      newAddress.est_principale = true;
    }
    
    client.adresses.push(newAddress);
    await client.save();
    
    res.status(201).json({
      message: 'Adresse ajoutée',
      adresses: client.adresses
    });
    
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Supprimer une adresse
const removeAddress = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { addressId } = req.params;
    
    const client = await Client.findOne({ user_id: userId });
    if (!client) {
      return res.status(404).json({ message: 'Profil client non trouvé' });
    }
    
    client.adresses = client.adresses.filter(
      addr => addr._id.toString() !== addressId
    );
    
    // Si plus d'adresse principale, mettre la première
    if (client.adresses.length > 0 && !client.adresses.some(a => a.est_principale)) {
      client.adresses[0].est_principale = true;
    }
    
    await client.save();
    
    res.json({
      message: 'Adresse supprimée',
      adresses: client.adresses
    });
    
  } catch (error) {
    console.error('Remove address error:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Mettre à jour les mesures
const updateMeasurements = async (req, res) => {
  try {
    const userId = req.user.sub;
    const measurements = req.body;
    
    const client = await Client.findOneAndUpdate(
      { user_id: userId },
      { 
        mesures_type: {
          ...measurements,
          date_mesure: new Date()
        }
      },
      { new: true }
    );
    
    if (!client) {
      return res.status(404).json({ message: 'Profil client non trouvé' });
    }
    
    res.json({
      message: 'Mesures mises à jour',
      mesures: client.mesures_type
    });
    
  } catch (error) {
    console.error('Update measurements error:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Obtenir les mesures (pour partage avec couturier)
const getMeasurements = async (req, res) => {
  try {
    const userId = req.user.sub;
    
    const client = await Client.findOne(
      { user_id: userId },
      'mesures_type'
    );
    
    if (!client) {
      return res.status(404).json({ message: 'Profil client non trouvé' });
    }
    
    res.json({ mesures: client.mesures_type });
    
  } catch (error) {
    console.error('Get measurements error:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ NOUVEAU: Obtenir le profil d'un client par son ID utilisateur (pour les couturiers)
const getClientByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const client = await Client.findOne({ user_id: userId })
      .populate('user_id', 'name email');
    
    if (!client) {
      return res.status(404).json({ message: 'Profil client non trouvé' });
    }
    
    res.json({ client });
    
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ NOUVEAU: Obtenir un couturier par son userId (pour les clients)
const getCouturierByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const couturier = await Couturier.findOne({ user_id: userId })
      .populate('user_id', 'name email');
    
    if (!couturier) {
      return res.status(404).json({ message: 'Couturier non trouvé' });
    }
    
    res.json({ couturier });
    
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Désactiver le compte client
const deactivateAccount = async (req, res) => {
  try {
    const userId = req.user.sub;
    
    await Client.findOneAndUpdate(
      { user_id: userId },
      { est_actif: false }
    );
    
    res.json({ message: 'Compte client désactivé' });
    
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ POST /profile/photo (photo de profil)
const uploadProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.sub;

    const client = await Client.findOne({ user_id: userId });
    if (!client) return res.status(404).json({ message: 'Profil client non trouv e' });

    const file = req.file;
    if (!file) return res.status(400).json({ message: 'Aucun fichier recu' });

    // Note: uploadClients saves to uploads/clients, and app.js serves /uploads as static.
    const photoUrl = `/uploads/clients/${file.filename}`;

    client.photo = photoUrl;
    await client.save();

    return res.status(201).json({
      message: 'Photo de profil mise a jour',
      client: { _id: client._id, photo: client.photo },
    });
  } catch (error) {
    console.error('Upload client photo error:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ DELETE /profile/photo (supprimer photo de profil)
const deleteProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.sub;

    const client = await Client.findOne({ user_id: userId });
    if (!client) return res.status(404).json({ message: 'Profil client non trouvé' });

    if (client.photo) {
      await deleteLocalFileIfExists(client.photo);
      client.photo = null;
      await client.save();
    }

    return res.json({
      message: 'Photo de profil supprimée',
      client: { _id: client._id, photo: null },
    });
  } catch (error) {
    console.error('Delete client photo error:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports = {
  createProfile,
  getMyProfile,
  updateProfile,
  addAddress,
  removeAddress,
  updateMeasurements,
  getMeasurements,
  getClientByUserId,
  getCouturierByUserId,
  deactivateAccount,
  uploadProfilePhoto,
  deleteProfilePhoto,
};

