package com.exp.ocp.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.exp.ocp.model.Role;
import com.exp.ocp.model.Utilisateur;
import com.exp.ocp.repository.UtilisateurRepository;

@Service
public class UtilisateurService {

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    /**
     * Ajoute un nouvel utilisateur.
     */
    public Utilisateur ajouterUtilisateur(Utilisateur utilisateur) {
        return utilisateurRepository.save(utilisateur);
    }

    /**
     * Récupère tous les utilisateurs.
     */
    public List<Utilisateur> getAllUtilisateurs() {
        return utilisateurRepository.findAll();
    }

    /**
     * Récupère un utilisateur par son ID.
     */
    public Utilisateur getUtilisateurById(Long id) {
        return utilisateurRepository.findById(id).orElse(null);
    }

    /**
     * Met à jour un utilisateur existant.
     */
    public Utilisateur updateUtilisateur(Long id, Utilisateur utilisateur) {
        Optional<Utilisateur> optional = utilisateurRepository.findById(id);
        if (optional.isPresent()) {
            Utilisateur u = optional.get();
            u.setNom(utilisateur.getNom());
            u.setPrenom(utilisateur.getPrenom());
            u.setEmail(utilisateur.getEmail());
            u.setMotDePasse(utilisateur.getMotDePasse());
            u.setRole(utilisateur.getRole());
            return utilisateurRepository.save(u);
        }
        return null;
    }

    /**
     * Supprime un utilisateur par son ID.
     */
    public void deleteUtilisateur(Long id) {
        utilisateurRepository.deleteById(id);
    }

    /**
     * Authentifie un utilisateur par email, mot de passe et rôle.
     */
    public boolean authenticate(String email, String motDePasse, String role) {
        try {
            Role enumRole = Role.valueOf(role);
            return utilisateurRepository.findByEmailAndMotDePasseAndRole(email, motDePasse, enumRole).isPresent();
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Vérifie l'existence d'un utilisateur par email, mot de passe et rôle.
     */
    public Optional<Utilisateur> verifierUtilisateur(String email, String motDePasse, String role) {
        try {
            Role selectedRole = Role.valueOf(role);
            Optional<Utilisateur> result = utilisateurRepository.findByEmailAndMotDePasseAndRole(email, motDePasse, selectedRole);

            System.out.println("Résultat de la recherche : " + (result.isPresent() ? "Utilisateur trouvé" : "Aucun utilisateur"));

            return result;
        } catch (IllegalArgumentException e) {
            System.out.println("Rôle invalide : " + role);
            return Optional.empty();
        }
    }

    /**
     * Récupère tous les utilisateurs ayant un rôle spécifique.
     */
    public List<Utilisateur> getUtilisateursParRole(Role role) {
        List<Utilisateur> utilisateurs = utilisateurRepository.findByRole(role);
        System.out.println("Utilisateurs trouvés pour le rôle " + role + ": " + utilisateurs);
        return utilisateurs;
    }

    /**
     * Récupère les utilisateurs ayant le rôle 'TECHNICIEN'.
     */
    public List<Utilisateur> getTechniciens() {
        return utilisateurRepository.findByRole(Role.TECHNICIEN);
    }

    public Utilisateur findById(Long demandeurId) {
        throw new UnsupportedOperationException("Not supported yet.");
    }
    
}
