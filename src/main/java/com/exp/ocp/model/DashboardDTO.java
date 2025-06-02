package com.exp.ocp.model;

public class DashboardDTO {
    private int total;
    private int enCours;
    private int terminees;
    private int techniciens;

    public DashboardDTO(int total, int enCours, int terminees, int techniciens) {
        this.total = total;
        this.enCours = enCours;
        this.terminees = terminees;
        this.techniciens = techniciens;
    }

    // Getters et Setters
    public int getTotal() {
        return total;
    }

    public void setTotal(int total) {
        this.total = total;
    }

    public int getEnCours() {
        return enCours;
    }

    public void setEnCours(int enCours) {
        this.enCours = enCours;
    }

    public int getTerminees() {
        return terminees;
    }

    public void setTerminees(int terminees) {
        this.terminees = terminees;
    }

    public int getTechniciens() {
        return techniciens;
    }

    public void setTechniciens(int techniciens) {
        this.techniciens = techniciens;
    }
}
