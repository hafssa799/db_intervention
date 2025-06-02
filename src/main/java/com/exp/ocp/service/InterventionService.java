package com.exp.ocp.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.exp.ocp.model.Equipement;
import com.exp.ocp.model.Intervention;
import com.exp.ocp.model.Intervention.StatutIntervention;
import com.exp.ocp.model.Utilisateur;
import com.exp.ocp.repository.EquipementRepository;
import com.exp.ocp.repository.InterventionRepository;
import com.exp.ocp.repository.UtilisateurRepository;

@Service
public class InterventionService {
    
    private static final Logger logger = LoggerFactory.getLogger(InterventionService.class);

    @Autowired
    private InterventionRepository repository;
    
    @Autowired
    private EquipementRepository equipementRepository;
    
    @Autowired
    private UtilisateurRepository utilisateurRepository;

    // Méthode pour récupérer toutes les interventions ou filtrer par statut
    public List<Intervention> getAll(String statut) {
        if (statut != null && !statut.isEmpty()) {
            try {
                StatutIntervention statutEnum = StatutIntervention.valueOf(statut.toUpperCase());
                logger.info("Récupération des interventions avec statut: {}", statutEnum);
                return repository.findByStatut(statutEnum);
            } catch (IllegalArgumentException e) {
                logger.warn("Statut d'intervention invalide: {}", statut);
                return new ArrayList<>();
            }
        }
        logger.info("Récupération de toutes les interventions triées par date");
        return repository.findAllByOrderByDateDemandeDesc();
    }

    // Méthode pour récupérer une intervention par ID
    public Intervention getById(Long id) {
        logger.info("Récupération de l'intervention avec ID: {}", id);
        Optional<Intervention> intervention = repository.findById(id);
        if (intervention.isEmpty()) {
            logger.warn("Intervention avec ID {} non trouvée", id);
            throw new RuntimeException("Intervention non trouvée avec ID: " + id);
        }
        return intervention.get();
    }

    // Méthode pour mettre à jour le statut d'une intervention
    public Intervention updateStatut(Long id, StatutIntervention statut) {
        logger.info("Mise à jour du statut de l'intervention {} vers {}", id, statut);
        Intervention intervention = getById(id);
        intervention.setStatut(statut);
        return repository.save(intervention);
    }

    // Méthode pour assigner un technicien à une intervention
    public Intervention assignTechnicien(Long id, Long idTechnicien) {
        logger.info("Assignation du technicien {} à l'intervention {}", idTechnicien, id);
        Intervention intervention = getById(id);
        
        Optional<Utilisateur> technicien = utilisateurRepository.findById(idTechnicien);
        if (technicien.isPresent()) {
            intervention.setTechnicien(technicien.get());
            logger.info("Technicien assigné avec succès");
        } else {
            logger.warn("Technicien avec ID {} non trouvé", idTechnicien);
            throw new RuntimeException("Technicien non trouvé avec ID: " + idTechnicien);
        }
        
        return repository.save(intervention);
    }
    
    // Méthode pour mettre à jour les données d'une intervention
    public Intervention updateIntervention(Long id, Intervention updatedData) {
        logger.info("Mise à jour de l'intervention avec ID: {}", id);
        Intervention existingIntervention = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Intervention non trouvée avec ID: " + id));
        
        if (updatedData.getDescription() != null) {
            existingIntervention.setDescription(updatedData.getDescription());
        }
        
        if (updatedData.getDateDemande() != null) {
            existingIntervention.setDateDemande(updatedData.getDateDemande());
        }
        
        if (updatedData.getStatut() != null) {
            existingIntervention.setStatut(updatedData.getStatut());
        }
        
        if (updatedData.getPriorite() != null) {
            existingIntervention.setPriorite(updatedData.getPriorite());
        }
        
        if (updatedData.getEquipement() != null && updatedData.getEquipement().getIdEquipement() != null) {
            Long equipementId = updatedData.getEquipement().getIdEquipement();
            Equipement equipement = equipementRepository.findById(equipementId).orElse(null);
            if (equipement != null) {
                existingIntervention.setEquipement(equipement);
            } else {
                logger.warn("Équipement avec ID {} non trouvé", equipementId);
            }
        }
        
        if (updatedData.getTechnicien() != null && updatedData.getTechnicien().getIdUtilisateur() != null) {
            Long technicienId = updatedData.getTechnicien().getIdUtilisateur();
            Utilisateur technicien = utilisateurRepository.findById(technicienId).orElse(null);
            if (technicien != null) {
                existingIntervention.setTechnicien(technicien);
            } else {
                logger.warn("Technicien avec ID {} non trouvé", technicienId);
            }
        }
        
        if (updatedData.getDemandeur() != null && updatedData.getDemandeur().getIdUtilisateur() != null) {
            Long demandeurId = updatedData.getDemandeur().getIdUtilisateur();
            Utilisateur demandeur = utilisateurRepository.findById(demandeurId).orElse(null);
            if (demandeur != null) {
                existingIntervention.setDemandeur(demandeur);
            } else {
                logger.warn("Demandeur avec ID {} non trouvé", demandeurId);
            }
        }
        
        logger.info("Intervention mise à jour avec succès");
        return repository.save(existingIntervention);
    }

    // Méthode pour enregistrer une intervention
    public Intervention save(Intervention intervention) {
        logger.info("Enregistrement d'une nouvelle intervention");
        return repository.save(intervention);
    }

    // Méthode pour supprimer une intervention
    public void deleteIntervention(Long id) {
        logger.info("Suppression de l'intervention avec ID: {}", id);
        Optional<Intervention> intervention = repository.findById(id);
        if (intervention.isPresent()) {
            repository.delete(intervention.get());
            logger.info("Intervention supprimée avec succès");
        } else {
            logger.warn("Intervention avec ID {} non trouvée pour suppression", id);
            throw new RuntimeException("Intervention non trouvée avec ID: " + id);
        }
    }

    // Méthode de recherche des interventions avec plusieurs filtres
    public List<Intervention> searchInterventions(String keyword, Long idEquipement, Long idTechnicien, String statut) {
        logger.info("Recherche d'interventions avec filtres - keyword: {}, equipementId: {}, technicienId: {}, statut: {}", 
                keyword, idEquipement, idTechnicien, statut);
        
        if (keyword != null && !keyword.isEmpty()) {
            return repository.findByDescriptionContainingIgnoreCase(keyword);
        }
        
        if (idEquipement != null) {
            return repository.findByIdEquipement(idEquipement);
        }
        
        if (idTechnicien != null) {
            return repository.findByTechnicienId(idTechnicien);
        }
        
        if (statut != null && !statut.isEmpty()) {
            try {
                StatutIntervention statutEnum = StatutIntervention.valueOf(statut.toUpperCase());
                return repository.findByStatut(statutEnum);
            } catch (IllegalArgumentException e) {
                logger.warn("Statut d'intervention invalide: {}", statut);
                return new ArrayList<>();
            }
        }
        
        // Si aucun filtre n'est spécifié, retourne toutes les interventions triées par date
        return repository.findAllByOrderByDateDemandeDesc();
    }
  
    // Méthode pour trouver les interventions par technicien
    public List<Intervention> findByTechnicienId(Long idTechnicien) {
        logger.info("Recherche des interventions pour le technicien avec ID: {}", idTechnicien);
        return repository.findByTechnicienId(idTechnicien);
    }
    
}