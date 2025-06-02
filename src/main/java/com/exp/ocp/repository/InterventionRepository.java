package com.exp.ocp.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.exp.ocp.model.Intervention;
import com.exp.ocp.model.Utilisateur;
import com.exp.ocp.model.Intervention.StatutIntervention;

public interface InterventionRepository extends JpaRepository<Intervention, Long> {
    
    // Méthode pour récupérer toutes les interventions triées par date de demande décroissante
    List<Intervention> findAllByOrderByDateDemandeDesc();
    
    // Méthode pour récupérer les interventions par statut
    List<Intervention> findByStatut(StatutIntervention statut);
    
    // Méthode pour rechercher des interventions par description (contenant un mot-clé)
    List<Intervention> findByDescriptionContainingIgnoreCase(String description);
    
    // Méthode pour récupérer les interventions par équipement
    @Query("SELECT i FROM Intervention i WHERE i.equipement.idEquipement = :idEquipement")
    List<Intervention> findByIdEquipement(@Param("idEquipement") Long idEquipement);
    
    // Méthode pour récupérer les interventions par technicien
    @Query("SELECT i FROM Intervention i WHERE i.technicien.idUtilisateur = :idTechnicien")
    List<Intervention> findByTechnicienId(@Param("idTechnicien") Long idTechnicien);
    
    // Méthode pour compter le nombre total d'interventions
    @Override
    long count();
    
    // Méthode pour compter le nombre d'interventions par statut
    long countByStatut(StatutIntervention statut);
    
    // Méthode pour compter le nombre d'interventions avec deux statuts différents
    @Query("SELECT COUNT(i) FROM Intervention i WHERE i.statut = :statut1 OR i.statut = :statut2")
    long countByStatutAndStatut(@Param("statut1") StatutIntervention statut1,
                              @Param("statut2") StatutIntervention statut2);
    
    // Méthode pour récupérer les interventions par demandeur (objet Utilisateur)
    List<Intervention> findByDemandeur(Utilisateur demandeur);
    
    // Méthode pour récupérer les interventions par ID du demandeur, triées par date
    List<Intervention> findByDemandeurIdUtilisateurOrderByDateDemandeDesc(Long idUtilisateur);
}