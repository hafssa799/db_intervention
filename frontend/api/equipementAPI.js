import api from '../api';

const equipementAPI = {
  // Récupérer tous les équipements
  getAllEquipements: () => {
    return api.get('/api/equipements');
  },
  
  // Récupérer un équipement par ID
  getEquipementById: (id) => {
    return api.get(`/api/equipements/${id}`);
  },
  
  // Créer un nouvel équipement
  createEquipement: (equipement) => {
    return api.post('/api/equipements', equipement);
  },
  
  // Mettre à jour un équipement existant
  updateEquipement: (id, equipement) => {
    return api.put(`/api/equipements/${id}`, equipement);
  },
  
  // Supprimer un équipement
  deleteEquipement: (id) => {
    return api.delete(`/api/equipements/${id}`);
  },
  
  // Filtrer les équipements
  filterEquipements: (statut, typeEquipement, localisation) => {
    let queryParams = new URLSearchParams();
    if (statut) queryParams.append('statut', statut);
    if (typeEquipement) queryParams.append('typeEquipement', typeEquipement);
    if (localisation) queryParams.append('localisation', localisation);
    
    return api.get(`/api/equipements/filter?${queryParams.toString()}`);
  },
  
  // Récupérer l'historique des interventions pour un équipement
  getEquipementInterventions: (id) => {
    return api.get(`/api/equipements/${id}/interventions`);
  }
};

export default equipementAPI;