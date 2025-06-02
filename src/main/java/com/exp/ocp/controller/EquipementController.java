package com.exp.ocp.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
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

import com.exp.ocp.model.Equipement;
import com.exp.ocp.model.Intervention;
import com.exp.ocp.service.EquipementService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/equipements")
@CrossOrigin(origins = "http://localhost:3000") // Autoriser les appels depuis React
public class EquipementController {

    @Autowired
    private EquipementService equipementService;

    // Récupérer tous les équipements
    @GetMapping
    public List<Equipement> getAllEquipements() {
        return equipementService.getAllEquipements();
    }

    // Récupérer un équipement par ID
    @GetMapping("/{id}")
    public Optional<Equipement> getEquipementById(@PathVariable Long id) {
        return equipementService.getEquipementById(id);
    }

    // Créer un nouvel équipement
    @PostMapping
    public Equipement createEquipement(@Valid @RequestBody Equipement equipement) {
        return equipementService.createEquipement(equipement);
    }

    // Mettre à jour un équipement
    @PutMapping("/{id}")
    public Equipement updateEquipement(@PathVariable Long id, @RequestBody Equipement equipement) {
        equipement.setIdEquipement(id);
        return equipementService.updateEquipement(equipement);
    }

    // Supprimer un équipement
   @DeleteMapping("/{id}")
public ResponseEntity<?> deleteEquipement(@PathVariable Long id) {
    try {
        // Vérifier si l'équipement existe
        Optional<Equipement> equipementOpt = equipementService.getEquipementById(id);
        if (!equipementOpt.isPresent()) {
            return ResponseEntity.status(404).body("Équipement non trouvé avec l'ID: " + id);
        }
        
        // Vérifier si l'équipement a des interventions associées
        List<Intervention> interventions = equipementService.getInterventionsForEquipement(id);
        if (!interventions.isEmpty()) {
            // Option 1: Retourner une erreur informative
            return ResponseEntity.status(400).body(
                "Impossible de supprimer l'équipement ID " + id + 
                " car il possède " + interventions.size() + 
                " intervention(s) associée(s). Veuillez d'abord supprimer ces interventions."
            );
            
            // Option 2: Supprimer les interventions avant l'équipement
            // interventionService.deleteInterventionsByEquipementId(id);
            // equipementService.deleteEquipement(id);
            // return ResponseEntity.noContent().build();
        }
        
        // Si aucune intervention, supprimer l'équipement
        equipementService.deleteEquipement(id);
        return ResponseEntity.noContent().build();
    } catch (Exception e) {
        return ResponseEntity.status(500).body("Erreur serveur: " + e.getMessage());
    }
}

    // Filtrer les équipements
    @GetMapping("/filter")
    public List<Equipement> filterEquipements(
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) String typeEquipement,
            @RequestParam(required = false) String localisation) {
        return equipementService.filterEquipements(statut, typeEquipement, localisation);
    }

    // Historique des interventions pour un équipement
    @GetMapping("/{id}/interventions")
    public List<Intervention> getInterventionsForEquipement(@PathVariable Long id) {
        return equipementService.getInterventionsForEquipement(id);
    }
} 
