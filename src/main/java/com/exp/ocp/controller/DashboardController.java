package com.exp.ocp.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.exp.ocp.service.DashboardService;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    // Endpoint pour récupérer les données du tableau de bord
    @GetMapping("/api/dashboard")
    public Object getDashboardData() {
        return dashboardService.getDashboardData();
    }
}
