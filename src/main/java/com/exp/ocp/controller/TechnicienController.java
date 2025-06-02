package com.exp.ocp.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.exp.ocp.model.Role;
import com.exp.ocp.model.Utilisateur;
import com.exp.ocp.service.UtilisateurService;

@RestController
@RequestMapping("/api/techniciens")
public class TechnicienController {

    private final UtilisateurService utilisateurService;

  
    public TechnicienController(UtilisateurService utilisateurService) {
        this.utilisateurService = utilisateurService;
    }

    /**
     * Récupère la liste des techniciens.
     */
    @GetMapping
    public ResponseEntity<List<Utilisateur>> getAllTechniciens() {
        // On récupère les utilisateurs ayant le rôle "TECHNICIEN"
        List<Utilisateur> techniciens = utilisateurService.getUtilisateursParRole(Role.TECHNICIEN);
        System.out.println("Nombre de techniciens récupérés : " + techniciens.size());
        if (techniciens.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(techniciens);
    }
}
