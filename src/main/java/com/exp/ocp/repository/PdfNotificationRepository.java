package com.exp.ocp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.exp.ocp.model.PdfNotification;

@Repository
public interface PdfNotificationRepository extends JpaRepository<PdfNotification, Long> {
    // Tu peux ajouter des méthodes personnalisées ici si nécessaire
}
