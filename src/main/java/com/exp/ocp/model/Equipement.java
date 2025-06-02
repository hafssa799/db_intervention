package com.exp.ocp.model;

import java.util.Date;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;

@Entity
@Table(name = "equipement")
public class Equipement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idEquipement;

    @Column(name = "numero_serie", unique = true)
    private String numeroSerie;

    @Column(name = "type_equipement")
    private String typeEquipement;

    private String modele;
    private String fabricant;

    @Temporal(TemporalType.DATE)
    @Column(name = "date_acquisition")
    private Date dateAcquisition;

    @Temporal(TemporalType.DATE)
    @Column(name = "date_installation")
    private Date dateInstallation;

    private String statut;
    @Column(name = "localisation")

    private String localisation;

    @Column(name = "cheminPDF")
    private String cheminPDF;

    @Column(name = "cheminExcel")
    private String cheminExcel;

    @OneToMany(mappedBy = "equipement", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Intervention> interventions;

    // Getters et Setters
    public Long getIdEquipement() {
        return idEquipement;
    }

    public void setIdEquipement(Long idEquipement) {
        this.idEquipement = idEquipement;
    }

    public String getNumeroSerie() {
        return numeroSerie;
    }

    public void setNumeroSerie(String numeroSerie) {
        this.numeroSerie = numeroSerie;
    }

    public String getTypeEquipement() {
        return typeEquipement;
    }

    public void setTypeEquipement(String typeEquipement) {
        this.typeEquipement = typeEquipement;
    }

    public String getModele() {
        return modele;
    }

    public void setModele(String modele) {
        this.modele = modele;
    }

    public String getFabricant() {
        return fabricant;
    }

    public void setFabricant(String fabricant) {
        this.fabricant = fabricant;
    }

    public Date getDateAcquisition() {
        return dateAcquisition;
    }

    public void setDateAcquisition(Date dateAcquisition) {
        this.dateAcquisition = dateAcquisition;
    }

    public Date getDateInstallation() {
        return dateInstallation;
    }

    public void setDateInstallation(Date dateInstallation) {
        this.dateInstallation = dateInstallation;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    public String getLocalisation() {
        return localisation;
    }

    public void setLocalisation(String localisation) {
        this.localisation = localisation;
    }

    public String getCheminPDF() {
        return cheminPDF;
    }

    public void setCheminPDF(String cheminPDF) {
        this.cheminPDF = cheminPDF;
    }

    public String getCheminExcel() {
        return cheminExcel;
    }

    public void setCheminExcel(String cheminExcel) {
        this.cheminExcel = cheminExcel;
    }

    public List<Intervention> getInterventions() {
        return interventions;
    }

    public void setInterventions(List<Intervention> interventions) {
        this.interventions = interventions;
    }
}
