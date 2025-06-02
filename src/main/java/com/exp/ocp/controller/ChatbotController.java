package com.exp.ocp.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.exp.ocp.model.Conversation;
import com.exp.ocp.service.ChatbotService;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = "*")
public class ChatbotController {
    
    private static final Logger logger = LoggerFactory.getLogger(ChatbotController.class);
    
    @Autowired
    private ChatbotService chatbotService;
    
    @PostMapping("/question")
    public ResponseEntity<?> traiterQuestion(@RequestBody Map<String, String> request, Principal principal) {
        try {
            String question = request.get("question");
            // Récupérer l'ID utilisateur depuis l'authentification
            Long userId = 1L; // À adapter selon votre système d'authentification
            
            logger.info("Traitement de la question: {}", question);
            
            Map<String, Object> response = chatbotService.traiterQuestion(question, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Erreur lors du traitement de la question", e);
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Une erreur s'est produite", "details", e.getMessage()));
        }
    }
    
    @GetMapping("/historique")
    public ResponseEntity<?> getHistorique(Principal principal) {
        try {
            // Récupérer l'ID utilisateur depuis l'authentification
            Long userId = 1L; // À adapter selon votre système d'authentification
            
            List<Conversation> historique = chatbotService.getHistoriqueConversations(userId);
            return ResponseEntity.ok(historique);
        } catch (Exception e) {
            logger.error("Erreur lors de la récupération de l'historique", e);
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Une erreur s'est produite", "details", e.getMessage()));
        }
    }
    @PutMapping("/historique/{id}")
public ResponseEntity<?> modifierConversation(@PathVariable Long id, @RequestBody Conversation conversationModifiee) {
    try {
        Conversation conversation = chatbotService.modifierConversation(id, conversationModifiee);
        return ResponseEntity.ok(conversation);
    } catch (Exception e) {
        logger.error("Erreur lors de la modification de la conversation", e);
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("error", "Erreur lors de la modification", "details", e.getMessage()));
    }
}

@DeleteMapping("/historique/{id}")
public ResponseEntity<?> supprimerConversation(@PathVariable Long id) {
    try {
        chatbotService.supprimerConversation(id);
        return ResponseEntity.ok(Map.of("message", "Conversation supprimée avec succès"));
    } catch (Exception e) {
        logger.error("Erreur lors de la suppression de la conversation", e);
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("error", "Erreur lors de la suppression", "details", e.getMessage()));
    }
}
}