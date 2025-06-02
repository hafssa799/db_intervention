package com.exp.ocp.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.exp.ocp.model.ProblemeFrequent;

@Repository
public interface ProblemeFrequentRepository extends JpaRepository<ProblemeFrequent, Long> {
    
    // Méthode simple pour rechercher par mot-clé
    List<ProblemeFrequent> findByQuestionContainingIgnoreCase(String keyword);
    
    // Méthode plus avancée avec JPQL pour une meilleure correspondance
    @Query("SELECT p FROM ProblemeFrequent p WHERE " +
           "LOWER(p.question) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(:keyword) LIKE LOWER(CONCAT('%', p.question, '%'))")
    List<ProblemeFrequent> findByKeywordPattern(@Param("keyword") String keyword);
    
    // Recherche par mots-clés multiples
    @Query("SELECT p FROM ProblemeFrequent p WHERE " +
           "LOWER(p.question) LIKE LOWER(CONCAT('%', :keyword1, '%')) OR " +
           "LOWER(p.question) LIKE LOWER(CONCAT('%', :keyword2, '%'))")
    List<ProblemeFrequent> findByMultipleKeywords(@Param("keyword1") String keyword1, 
                                                 @Param("keyword2") String keyword2);
}