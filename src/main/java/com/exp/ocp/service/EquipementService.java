package com.exp.ocp.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.exp.ocp.model.Equipement;
import com.exp.ocp.model.Intervention;
import com.exp.ocp.repository.EquipementRepository;
import com.exp.ocp.repository.InterventionRepository;

@Service
public class EquipementService {

    @Autowired
    private EquipementRepository equipementRepository;
    
    @Autowired
    private InterventionRepository interventionRepository;
    
    // Récupérer tous les équipements
    public List<Equipement> getAllEquipements() {
        return equipementRepository.findAll();
    }
    
    // Récupérer un équipement par ID
    public Optional<Equipement> getEquipementById(Long id) {  // Modification de Integer à Long
        return equipementRepository.findById(id);
    }
    
    // Créer un nouvel équipement
    public Equipement createEquipement(Equipement equipement) {
        return equipementRepository.save(equipement);
    }
    
    // Mettre à jour un équipement existant
    public Equipement updateEquipement(Equipement equipement) {
        return equipementRepository.save(equipement);
    }
    
    // Supprimer un équipement
    @Transactional
   public void deleteEquipement(Long id) {
    // Vérifier si l'équipement existe
    Optional<Equipement> equipementOpt = equipementRepository.findById(id);
    if (!equipementOpt.isPresent()) {
        throw new RuntimeException("Équipement non trouvé avec l'ID: " + id);
    }
    
    // Vérifier si l'équipement a des interventions associées
    Equipement equipement = equipementOpt.get();
    if (!equipement.getInterventions().isEmpty()) {
        // Si c'est le cas, supprimer d'abord les interventions ou afficher un message d'erreur
        throw new RuntimeException("Impossible de supprimer l'équipement car il a des interventions associées");
    }
    
    equipementRepository.deleteById(id);
}
    
    // Filtrage par critères
    public List<Equipement> filterEquipements(String statut, String typeEquipement, String localisation) {
        if (statut != null && !statut.isEmpty() && 
            typeEquipement != null && !typeEquipement.isEmpty() && 
            localisation != null && !localisation.isEmpty()) {
            return equipementRepository.findByStatutAndTypeEquipementAndLocalisation(statut, typeEquipement, localisation);
        } else if (statut != null && !statut.isEmpty() && 
                   typeEquipement != null && !typeEquipement.isEmpty()) {
            return equipementRepository.findByStatutAndTypeEquipement(statut, typeEquipement);
        } else if (statut != null && !statut.isEmpty() && 
                   localisation != null && !localisation.isEmpty()) {
            return equipementRepository.findByStatutAndLocalisation(statut, localisation);
        } else if (typeEquipement != null && !typeEquipement.isEmpty() && 
                   localisation != null && !localisation.isEmpty()) {
            return equipementRepository.findByTypeEquipementAndLocalisation(typeEquipement, localisation);
        } else if (statut != null && !statut.isEmpty()) {
            return equipementRepository.findByStatut(statut);
        } else if (typeEquipement != null && !typeEquipement.isEmpty()) {
            return equipementRepository.findByTypeEquipement(typeEquipement);
        } else if (localisation != null && !localisation.isEmpty()) {
            return equipementRepository.findByLocalisation(localisation);
        } else {
            return equipementRepository.findAll();
        }
    }
    
    // Récupérer l'historique des interventions pour un équipement
    public List<Intervention> getInterventionsForEquipement(Long equipementId) {  // Modification de Integer à Long
        return interventionRepository.findByIdEquipement(equipementId);
    }
}
