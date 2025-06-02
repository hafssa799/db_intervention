package com.exp.ocp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "problemes_frequents")
public class ProblemeFrequent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String question;
    private String reponse;
    
    // Getters et setters avec noms corrects selon les conventions camelCase
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getQuestion() {
        return question;
    }
    
    public void setQuestion(String question) {
        this.question = question;
    }
    
    public String getReponse() {
        return reponse;
    }
    
    public void setReponse(String reponse) {
        this.reponse = reponse;
    }
}