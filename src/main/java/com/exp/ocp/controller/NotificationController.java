package com.exp.ocp.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.exp.ocp.model.Notification;
import com.exp.ocp.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/{utilisateurId}")
    public List<Notification> getNotifications(@PathVariable Long utilisateurId) {
        return notificationService.getNotifications(utilisateurId);
    }
}



