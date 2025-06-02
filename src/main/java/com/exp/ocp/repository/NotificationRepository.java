package com.exp.ocp.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.exp.ocp.model.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUtilisateurIdUtilisateurOrderByDateDesc(Long utilisateurId);
}
