package com.exp.ocp.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.exp.ocp.model.Equipement;

@Repository
public interface EquipementRepository extends JpaRepository<Equipement, Long> {  // Changer Integer en Long
    // Méthodes pour le filtrage
    List<Equipement> findByStatut(String statut);
    List<Equipement> findByTypeEquipement(String typeEquipement);
    List<Equipement> findByLocalisation(String localisation);
    
    // Méthode de recherche combinée
    List<Equipement> findByStatutAndTypeEquipementAndLocalisation(
        String statut, String typeEquipement, String localisation);
    
    // Méthodes pour filtres partiels
    List<Equipement> findByStatutAndTypeEquipement(String statut, String typeEquipement);
    List<Equipement> findByStatutAndLocalisation(String statut, String localisation);
    List<Equipement> findByTypeEquipementAndLocalisation(String typeEquipement, String localisation);
}
