package com.exp.ocp.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.exp.ocp.model.Role;
import com.exp.ocp.model.Utilisateur;
import com.exp.ocp.service.UtilisateurService;

@RestController
@RequestMapping("/api/utilisateurs")
@CrossOrigin(origins = "http://localhost:3000")
public class UtilisateurController {

    @Autowired
    private UtilisateurService utilisateurService;

    // GET /api/utilisateurs ou /api/utilisateurs?role=DEMANDEUR
    @GetMapping
    public ResponseEntity<List<Utilisateur>> getUtilisateurs(@RequestParam(required = false) String role) {
        if (role != null) {
            try {
                Role roleEnum = Role.valueOf(role.toUpperCase());
                return ResponseEntity.ok(utilisateurService.getUtilisateursParRole(roleEnum));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(List.of());
            }
        }
        return ResponseEntity.ok(utilisateurService.getAllUtilisateurs());
    }

    // GET /api/utilisateurs/message
    @GetMapping("/message")
    public ResponseEntity<String> getMessage() {
        return ResponseEntity.ok("Hello from Spring Boot!");
    }

    // POST /api/utilisateurs/login
    @PostMapping("/login")
    public ResponseEntity<?> loginReact(@RequestBody Map<String, String> loginData) {
        Optional<Utilisateur> userOpt = utilisateurService.verifierUtilisateur(
                loginData.get("email"),
                loginData.get("motDePasse"),
                loginData.get("role").toUpperCase());

        if (userOpt.isPresent()) {
            Utilisateur u = userOpt.get();
            return ResponseEntity.ok(Map.of(
                    "idUtilisateur", u.getIdUtilisateur(),
                    "nom", u.getNom(),
                    "prenom", u.getPrenom(),
                    "email", u.getEmail(),
                    "role", u.getRole().name()));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Email, mot de passe ou rôle incorrect."));
    }
    @GetMapping("/demandeurs")
public ResponseEntity<List<Utilisateur>> getDemandeurs() {
    return ResponseEntity.ok(utilisateurService.getUtilisateursParRole(Role.DEMANDEUR));
}

}
