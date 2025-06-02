package com.exp.ocp.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.exp.ocp.model.Role;
import com.exp.ocp.model.Utilisateur;

@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {

    // Trouver un utilisateur par email, mot de passe et rôle
    Optional<Utilisateur> findByEmailAndMotDePasseAndRole(String email, String motDePasse, Role role);

    // Trouver tous les utilisateurs ayant un rôle spécifique
    List<Utilisateur> findByRole(Role role);
    
    // Compter le nombre d'utilisateurs par rôle
    long countByRole(Role role);
}
