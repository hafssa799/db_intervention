package com.exp.ocp.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.exp.ocp.model.DashboardDTO;
import com.exp.ocp.model.Intervention;
import com.exp.ocp.model.Role;
import com.exp.ocp.repository.InterventionRepository;
import com.exp.ocp.repository.UtilisateurRepository;
@Service
public class DashboardService {

    @Autowired
    private InterventionRepository interventionRepository;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    public DashboardDTO getDashboardData() {
        long total = interventionRepository.count();
        long enCours = interventionRepository.countByStatut(Intervention.StatutIntervention.EN_COURS);
        long terminees = interventionRepository.countByStatut(Intervention.StatutIntervention.TERMINEE);
        
        // Utiliser countByRole pour compter les techniciens
        long techniciens = utilisateurRepository.countByRole(Role.TECHNICIEN);

        return new DashboardDTO((int) total, (int) enCours, (int) terminees, (int) techniciens);
    }
}
