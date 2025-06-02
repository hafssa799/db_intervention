package com.exp.ocp.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.exp.ocp.model.Notification;
import com.exp.ocp.model.Utilisateur;
import com.exp.ocp.repository.NotificationRepository;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public void ajouterNotification(Long utilisateurId, String message) {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setIdUtilisateur(utilisateurId);

        Notification notification = new Notification();
        notification.setUtilisateur(utilisateur);
        notification.setMessage(message);

        notificationRepository.save(notification);
    }

    public List<Notification> getNotifications(Long utilisateurId) {
        return notificationRepository.findByUtilisateurIdUtilisateurOrderByDateDesc(utilisateurId);
    }
}