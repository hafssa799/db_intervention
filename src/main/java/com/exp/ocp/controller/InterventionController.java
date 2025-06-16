package com.exp.ocp.controller;

import java.util.Collections;
import java.util.Date;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.exp.ocp.model.Equipement;
import com.exp.ocp.model.Intervention;
import com.exp.ocp.model.Utilisateur;
import com.exp.ocp.repository.EquipementRepository;
import com.exp.ocp.repository.InterventionRepository;
import com.exp.ocp.repository.UtilisateurRepository;
import com.exp.ocp.service.InterventionService;

@RestController
@RequestMapping("/api/interventions")
@CrossOrigin(origins = "*") // CORS support
public class InterventionController {

    private static final Logger logger = LoggerFactory.getLogger(InterventionController.class);

    @Autowired
    private InterventionRepository interventionRepository;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private EquipementRepository equipementRepository;
    
    @Autowired
    private InterventionService interventionService;

    // Création d'une intervention - CORRIGÉ
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> createIntervention(
            @RequestParam("equipementId") Long equipementId,
            @RequestParam("description") String description,
            @RequestParam("priorite") String priorite,
            @RequestParam("demandeurId") Long demandeurId,
            @RequestParam(value = "localisation", required = false) String localisation,
            @RequestParam(value = "dateDebut", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm") Date dateDebut,
            @RequestParam(value = "dateFin", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm") Date dateFin,
            @RequestParam(value = "cheminPDF", required = false) String cheminPDF,
            @RequestParam(value = "cheminExcel", required = false) String cheminExcel,
            @RequestParam(value = "fichier", required = false) MultipartFile fichier) {

        logger.info("Création d'une nouvelle intervention - demandeur: {}, équipement: {}", demandeurId, equipementId);
        
        try {
            // Validation des paramètres obligatoires
            if (equipementId == null || demandeurId == null || 
                description == null || description.trim().isEmpty() ||
                priorite == null || priorite.trim().isEmpty()) {
                logger.error("Paramètres obligatoires manquants");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Paramètres obligatoires manquants: equipementId, demandeurId, description et priorite sont requis.");
            }
            
            // Recherche des entités Utilisateur et Equipement
            Utilisateur demandeur = utilisateurRepository.findById(demandeurId).orElse(null);
            Equipement equipement = equipementRepository.findById(equipementId).orElse(null);

            if (demandeur == null) {
                logger.error("Utilisateur avec ID {} non trouvé", demandeurId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Utilisateur non trouvé.");
            }

            if (equipement == null) {
                logger.error("Équipement avec ID {} non trouvé", equipementId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Équipement non trouvé.");
            }

            // Création de l'intervention
            Intervention intervention = new Intervention();
            intervention.setDemandeur(demandeur);
            intervention.setEquipement(equipement);
            intervention.setDescription(description.trim());
            intervention.setPriorite(priorite.trim());
            intervention.setStatut(Intervention.StatutIntervention.EN_ATTENTE); // Default status
            intervention.setDateDemande(new Date());

            // Définir la localisation (priorité à celle fournie, sinon celle de l'équipement)
            if (localisation != null && !localisation.trim().isEmpty()) {
                intervention.setLocalisation(localisation.trim());
            } else if (equipement.getLocalisation() != null && !equipement.getLocalisation().trim().isEmpty()) {
                intervention.setLocalisation(equipement.getLocalisation());
            }
            
            // Gestion des autres champs optionnels
            if (dateDebut != null) {
                intervention.setDateDebut(dateDebut);
            }
            
            if (dateFin != null) {
                intervention.setDateFin(dateFin);
            }
            
            if (cheminPDF != null && !cheminPDF.trim().isEmpty()) {
                intervention.setCheminPDF(cheminPDF.trim());
            }
            
            if (cheminExcel != null && !cheminExcel.trim().isEmpty()) {
                intervention.setCheminExcel(cheminExcel.trim());
            }

            // Gestion du fichier uploadé (si nécessaire)
            if (fichier != null && !fichier.isEmpty()) {
                logger.info("Fichier reçu: {} (taille: {} bytes)", fichier.getOriginalFilename(), fichier.getSize());
                // Ici vous pouvez ajouter la logique pour sauvegarder le fichier
                // Par exemple: String cheminFichier = fileStorageService.saveFile(fichier);
                // intervention.setCheminFichier(cheminFichier);
            }

            // Sauvegarde
            intervention = interventionRepository.save(intervention);
            logger.info("Intervention créée avec succès, ID: {}", intervention.getIdIntervention());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(intervention);
            
        } catch (Exception e) {
            logger.error("Erreur lors de la sauvegarde de l'intervention", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Erreur lors de la sauvegarde de l'intervention: " + e.getMessage());
        }
    }

    // Mise à jour d'une intervention existante
    @PutMapping("/{id}")
    public ResponseEntity<?> updateIntervention(
            @PathVariable Long id,
            @RequestBody Intervention updatedIntervention) {
        
        logger.info("Mise à jour de l'intervention avec ID: {}", id);
        
        try {
            Intervention updated = interventionService.updateIntervention(id, updatedIntervention);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            logger.error("Erreur lors de la mise à jour de l'intervention: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Erreur inattendue lors de la mise à jour de l'intervention", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la mise à jour de l'intervention.");
        }
    }

    // Suppression d'une intervention - CORRIGÉ
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteIntervention(@PathVariable Long id) {
        logger.info("Suppression de l'intervention avec ID: {}", id);
        
        try {
            // Vérifier que l'intervention existe
            if (!interventionRepository.existsById(id)) {
                logger.error("Intervention avec ID {} non trouvée pour suppression", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Intervention non trouvée avec l'ID: " + id);
            }
            
            // Utiliser le service si disponible, sinon supprimer directement
            if (interventionService != null) {
                interventionService.deleteIntervention(id);
            } else {
                interventionRepository.deleteById(id);
            }
            
            logger.info("Intervention avec ID {} supprimée avec succès", id);
            return ResponseEntity.ok("Intervention supprimée avec succès");
            
        } catch (RuntimeException e) {
            logger.error("Erreur lors de la suppression de l'intervention: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Erreur inattendue lors de la suppression de l'intervention", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la suppression de l'intervention: " + e.getMessage());
        }
    }

    // Récupérer toutes les interventions
    @GetMapping
    public ResponseEntity<List<Intervention>> getAllInterventions() {
        logger.info("Récupération de toutes les interventions");
        try {
            List<Intervention> interventions = interventionRepository.findAllByOrderByDateDemandeDesc();
            logger.info("Nombre d'interventions trouvées: {}", interventions.size());
            return ResponseEntity.ok(interventions);
        } catch (Exception e) {
            logger.error("Erreur lors de la récupération des interventions", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.emptyList());
        }
    }

    // Récupérer une intervention par ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getInterventionById(@PathVariable Long id) {
        logger.info("Récupération de l'intervention avec ID: {}", id);
        try {
            Intervention intervention = interventionRepository.findById(id).orElse(null);
            if (intervention == null) {
                logger.warn("Intervention avec ID {} non trouvée", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Intervention non trouvée.");
            }
            return ResponseEntity.ok(intervention);
        } catch (Exception e) {
            logger.error("Erreur lors de la récupération de l'intervention", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Erreur lors de la récupération de l'intervention");
        }
    }
    
    // Récupérer les interventions par demandeur
    @GetMapping("/demandeur/{idDemandeur}")
    public ResponseEntity<List<Intervention>> getInterventionsByDemandeur(@PathVariable Long idDemandeur) {
        logger.info("Récupération des interventions pour le demandeur ID: {}", idDemandeur);
        
        try {
            // Vérifie si l'utilisateur existe
            if (!utilisateurRepository.existsById(idDemandeur)) {
                logger.error("Utilisateur demandeur avec ID {} non trouvé", idDemandeur);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.emptyList());
            }
            
            // Récupère les interventions
            List<Intervention> interventions = interventionRepository.findByDemandeurIdUtilisateurOrderByDateDemandeDesc(idDemandeur);
            logger.info("Nombre d'interventions trouvées pour demandeur {}: {}", idDemandeur, interventions.size());
            
            return ResponseEntity.ok(interventions);
        } catch (Exception e) {
            logger.error("Erreur lors de la récupération des interventions du demandeur", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.emptyList());
        }
    }
    
    // Récupérer les interventions par technicien
    @GetMapping("/technicien/{idTechnicien}")
    public ResponseEntity<List<Intervention>> getInterventionsByTechnicien(@PathVariable Long idTechnicien) {
        logger.info("Récupération des interventions pour le technicien ID: {}", idTechnicien);
        
        try {
            List<Intervention> interventions = interventionRepository.findByTechnicienId(idTechnicien);
            logger.info("Nombre d'interventions trouvées: {}", interventions.size());
            
            return ResponseEntity.ok(interventions);
        } catch (Exception e) {
            logger.error("Erreur lors de la récupération des interventions du technicien", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.emptyList());
        }
    }
}