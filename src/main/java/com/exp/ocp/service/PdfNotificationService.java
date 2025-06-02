package com.exp.ocp.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.exp.ocp.model.PdfNotification;
import com.exp.ocp.repository.PdfNotificationRepository;

@Service
public class PdfNotificationService {

    @Autowired
    private PdfNotificationRepository repository;

    public PdfNotification save(PdfNotification notification) {
        return repository.save(notification);
    }
}
