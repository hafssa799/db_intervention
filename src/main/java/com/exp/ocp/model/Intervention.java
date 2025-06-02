package com.exp.ocp.model;

import java.util.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;

@Entity
@Table(name = "intervention")
public class Intervention {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idIntervention;

    @Column(name = "cheminPDF")
    private String cheminPDF;

    @Column(name = "cheminExcel") 
    private String cheminExcel;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "dateDemande")
    private Date dateDemande;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "dateDebut")
    private Date dateDebut;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "dateFin")
    private Date dateFin;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut")
    private StatutIntervention statut;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idDemandeur", referencedColumnName = "idUtilisateur")
    private Utilisateur demandeur;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idTechnicien", referencedColumnName = "idUtilisateur")
    private Utilisateur technicien;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idEquipement", referencedColumnName = "idEquipement")
    private Equipement equipement;

    // CORRECTION: Assurer que la localisation est bien stockée
    @Column(name = "localisation", nullable = false)
    private String localisation;
   
    @Column(name = "priorite")
    private String priorite;

    public enum StatutIntervention {
        EN_ATTENTE,
        EN_COURS,
        TERMINEE,
        ANNULEE
    }

    // Constructeurs
    public Intervention() {}

    public Intervention(String description, String localisation, String priorite, 
                       Utilisateur demandeur, Equipement equipement) {
        this.description = description;
        this.localisation = localisation;
        this.priorite = priorite;
        this.demandeur = demandeur;
        this.equipement = equipement;
        this.dateDemande = new Date();
        this.statut = StatutIntervention.EN_ATTENTE;
    }

    // Méthode pour obtenir la localisation (priorité : intervention > équipement)
    public String getLocalisationEffective() {
        if (this.localisation != null && !this.localisation.trim().isEmpty()) {
            return this.localisation;
        }
        if (this.equipement != null && this.equipement.getLocalisation() != null) {
            return this.equipement.getLocalisation();
        }
        return "Localisation non définie";
    }

    // Méthode pour calculer la durée
    public long getDuree() {
        if (dateDemande != null && dateFin != null) {
            return (dateFin.getTime() - dateDemande.getTime()) / (1000 * 60);
        }
        return 0;
    }

    // Getters et Setters
    public Long getIdIntervention() { return idIntervention; }
    public void setIdIntervention(Long idIntervention) { this.idIntervention = idIntervention; }

    public String getCheminPDF() { return cheminPDF; }
    public void setCheminPDF(String cheminPDF) { this.cheminPDF = cheminPDF; }

    public String getCheminExcel() { return cheminExcel; }
    public void setCheminExcel(String cheminExcel) { this.cheminExcel = cheminExcel; }

    public Date getDateDemande() { return dateDemande; }
    public void setDateDemande(Date dateDemande) { this.dateDemande = dateDemande; }

    public Date getDateDebut() { return dateDebut; }
    public void setDateDebut(Date dateDebut) { this.dateDebut = dateDebut; }

    public Date getDateFin() { return dateFin; }
    public void setDateFin(Date dateFin) { this.dateFin = dateFin; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public StatutIntervention getStatut() { return statut; }
    public void setStatut(StatutIntervention statut) { this.statut = statut; }

    public Utilisateur getDemandeur() { return demandeur; }
    public void setDemandeur(Utilisateur demandeur) { this.demandeur = demandeur; }

    public Utilisateur getTechnicien() { return technicien; }
    public void setTechnicien(Utilisateur technicien) { this.technicien = technicien; }

    public Equipement getEquipement() { return equipement; }
    public void setEquipement(Equipement equipement) { this.equipement = equipement; }

    public String getLocalisation() { return localisation; }
    public void setLocalisation(String localisation) { this.localisation = localisation; }

    public String getPriorite() { return priorite; }
    public void setPriorite(String priorite) { this.priorite = priorite; }
}