package com.exp.ocp.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.exp.ocp.model.Conversation;
import com.exp.ocp.model.ProblemeFrequent;
import com.exp.ocp.repository.ConversationRepository;
import com.exp.ocp.repository.ProblemeFrequentRepository;

@Service
public class ChatbotService {
    
    private static final Logger logger = LoggerFactory.getLogger(ChatbotService.class);
    
    @Autowired
    private ConversationRepository conversationRepository;
    
    @Autowired
    private ProblemeFrequentRepository problemeFrequentRepository;
    
    public Map<String, Object> traiterQuestion(String question, Long userId) {
        logger.info("Traitement de la question: '{}' pour l'utilisateur: {}", question, userId);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (question == null || question.trim().isEmpty()) {
                logger.warn("Question vide reçue");
                response.put("success", false);
                response.put("reponse", "Veuillez poser une question.");
                return response;
            }
            
            // Normaliser la question pour améliorer la recherche
            String questionNormalisee = question.toLowerCase()
                .replaceAll("[^a-z0-9àâçéèêëîïôûùüÿñæœ ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
            
            logger.info("Question normalisée: '{}'", questionNormalisee);
            
            // Rechercher des problèmes fréquents avec la méthode du repository
            List<ProblemeFrequent> problemesPotentiels = problemeFrequentRepository.findByQuestionContainingIgnoreCase(questionNormalisee);
            
            logger.info("Nombre de problèmes potentiels trouvés via repository: {}", problemesPotentiels.size());
            
            ProblemeFrequent problemeCorrespondant = null;
            
            // Si la méthode du repository trouve des résultats, utiliser le premier
            if (!problemesPotentiels.isEmpty()) {
                problemeCorrespondant = problemesPotentiels.get(0);
                logger.info("Correspondance trouvée via repository: '{}'", problemeCorrespondant.getQuestion());
            } else {
                // Sinon, faire une recherche manuelle (comme avant)
                List<ProblemeFrequent> tousLesProblemes = problemeFrequentRepository.findAll();
                logger.info("Nombre total de problèmes fréquents trouvés: {}", tousLesProblemes.size());
                
                // Log tous les problèmes pour déboguer
                for (ProblemeFrequent p : tousLesProblemes) {
                    logger.debug("Problème en DB: '{}' -> '{}'", p.getQuestion(), 
                        p.getReponse() != null ? 
                            p.getReponse().substring(0, Math.min(20, p.getReponse().length())) + "..." : 
                            "null");
                }
                
                // Recherche manuelle pour une meilleure correspondance
                for (ProblemeFrequent probleme : tousLesProblemes) {
                    if (probleme.getQuestion() == null) continue;
                    
                    String problemeQuestion = probleme.getQuestion().toLowerCase();
                    
                    // Vérifier si la question de l'utilisateur contient des mots-clés du problème
                    if (questionNormalisee.contains(problemeQuestion) || 
                        problemeQuestion.contains(questionNormalisee)) {
                        problemeCorrespondant = probleme;
                        logger.info("Correspondance directe trouvée avec: '{}'", problemeQuestion);
                        break;
                    }
                    
                    // Vérifier la correspondance de mots individuels
                    String[] motsQuestion = questionNormalisee.split(" ");
                    String[] motsProbleme = problemeQuestion.split(" ");
                    int motsCommuns = 0;
                    
                    for (String motQuestion : motsQuestion) {
                        for (String motProbleme : motsProbleme) {
                            if (motQuestion.equals(motProbleme) && motQuestion.length() > 2) {
                                motsCommuns++;
                                logger.debug("Mot commun trouvé: '{}'", motQuestion);
                            }
                        }
                    }
                    
                    // Si au moins 50% des mots correspondent
                    if (motsCommuns >= Math.min(motsQuestion.length, motsProbleme.length) * 0.5) {
                        problemeCorrespondant = probleme;
                        logger.info("Correspondance par mots-clés trouvée avec: '{}'", problemeQuestion);
                        break;
                    }
                }
            }
            
            String reponse;
            
            if (problemeCorrespondant != null && problemeCorrespondant.getReponse() != null) {
                // Si un problème correspondant est trouvé, utiliser sa réponse
                reponse = problemeCorrespondant.getReponse();
                logger.info("Problème fréquent trouvé: '{}' avec réponse: '{}'", 
                    problemeCorrespondant.getQuestion(), 
                    reponse.substring(0, Math.min(50, reponse.length())) + "...");
            } else {
                // Réponse par défaut si aucun problème correspondant n'est trouvé
                reponse = "Je n'ai pas trouvé de solution à ce problème spécifique. " +
                          "Veuillez contacter notre service technique pour obtenir de l'aide.";
                logger.info("Aucun problème fréquent trouvé pour la question");
            }
            
            // Enregistrer la conversation dans la base de données
            try {
                Conversation conversation = new Conversation();
                conversation.setUserId(userId);
                conversation.setQuestion(question);
                conversation.setReponse(reponse);
                conversation.setDateCreation(LocalDateTime.now());
                
                Conversation savedConversation = conversationRepository.save(conversation);
                logger.info("Conversation enregistrée avec l'ID: {}", savedConversation.getId());
            } catch (Exception e) {
                logger.error("Erreur lors de l'enregistrement de la conversation: {}", e.getMessage(), e);
                // Continuer malgré l'erreur d'enregistrement pour au moins renvoyer une réponse
            }
            
            // Préparer la réponse
            response.put("reponse", reponse);
            response.put("success", true);
            
            logger.info("Réponse finale préparée: {}", response);
            
            return response;
        } catch (Exception e) {
            logger.error("Erreur lors du traitement de la question: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("error", "Une erreur est survenue lors du traitement de votre question");
            response.put("reponse", "Désolé, une erreur s'est produite. Veuillez réessayer plus tard.");
            return response;
        }
    }
    
    public List<Conversation> getHistoriqueConversations(Long userId) {
        logger.info("Récupération de l'historique pour l'utilisateur: {}", userId);
        return conversationRepository.findByUserIdOrderByDateCreationDesc(userId);
    }

    
    public Conversation modifierConversation(Long id, Conversation conversationModifiee) {
    Conversation existante = conversationRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Conversation non trouvée"));
    
    existante.setQuestion(conversationModifiee.getQuestion());
    existante.setReponse(conversationModifiee.getReponse());
    existante.setDateCreation(conversationModifiee.getDateCreation()); // optionnel
    
    return conversationRepository.save(existante);
}

public void supprimerConversation(Long id) {
    if (!conversationRepository.existsById(id)) {
        throw new RuntimeException("Conversation non trouvée pour suppression");
    }
    conversationRepository.deleteById(id);
}
}