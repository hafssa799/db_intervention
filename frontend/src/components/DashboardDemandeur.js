import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './DashboardDemandeur.css';
import jsPDF from 'jspdf';

function DashboardDemandeur() {
    const navigate = useNavigate();
    const [demandes, setDemandes] = useState([]);
    const [filterStatus, setFilterStatus] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [pendingAction, setPendingAction] = useState(null);
    const [globalProgress, setGlobalProgress] = useState(0);
    const [showProgressBar, setShowProgressBar] = useState(false);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [affectations, setAffectations] = useState([]); // Pour stocker les nouvelles affectations

   useEffect(() => {
  // Appliquer le background à l'arrivée sur le composant
  document.body.style.backgroundImage = "url('https://i.pinimg.com/736x/c3/e5/51/c3e551266e74a192c06e3a59056f3266.jpg')";
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundRepeat = "no-repeat";
  document.body.style.backgroundPosition = "center center";
  document.body.style.backgroundAttachment = "fixed";

  loadDemandes();
  
  // Vérifier les nouvelles affectations toutes les 30 secondes
  const interval = setInterval(checkForNewAffectations, 30000);

  // Nettoyage à la sortie du composant
  return () => {
    clearInterval(interval);
    document.body.style.backgroundImage = '';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundRepeat = '';
    document.body.style.backgroundPosition = '';
    document.body.style.backgroundAttachment = '';
  };
}, []);

   
    // Fonction améliorée pour générer le PDF avec plus de détails
    function generatePDFBlob(intervention) {
        const doc = new jsPDF();
        
        const primaryColor = '#0056B3';
        const secondaryColor = '#495057';
        const accentColor = '#28A745';
        const lightGray = '#E9ECEF';
        
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        let yPosition = 30;

        // En-tête
        doc.setFillColor(primaryColor);
        doc.rect(0, 0, pageWidth, 20, 'F');
        
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('SYSTÈME DE GESTION DES INTERVENTIONS', margin, 13);
        
        doc.setTextColor(secondaryColor);
        doc.setFont('helvetica', 'normal');

        // Titre principal
        yPosition = 40;
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('Rapport d\'Intervention Technique', pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 10;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'normal');
        doc.text(`Demande #${intervention.id}`, pageWidth / 2, yPosition, { align: 'center' });

        // Ligne de séparation
        yPosition += 15;
        doc.setDrawColor(lightGray);
        doc.setLineWidth(0.8);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        
        // Contenu détaillé
        yPosition += 15;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('1. Informations Générales', margin, yPosition);
        
        yPosition += 8;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        doc.text('Date de création:', margin, yPosition);
        doc.text(formatDate(intervention.date), margin + 50, yPosition);
        yPosition += 7;
        
        doc.text('Statut:', margin, yPosition);
        doc.setTextColor(intervention.statusIntervention === 'sent' ? accentColor : secondaryColor);
        doc.text(getStatusText(intervention.statusIntervention), margin + 50, yPosition);
        doc.setTextColor(secondaryColor);
        yPosition += 7;
        
        doc.text('Priorité:', margin, yPosition);
        doc.text(intervention.priority, margin + 50, yPosition);
        yPosition += 15;

        // Description
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('2. Description de l\'Intervention', margin, yPosition);
        yPosition += 8;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const splitDescription = doc.splitTextToSize(intervention.description, pageWidth - 2 * margin);
        doc.text(splitDescription, margin, yPosition);
        yPosition += splitDescription.length * 6 + 15;

        // Détails équipement
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('3. Détails de l\'Équipement', margin, yPosition);
        yPosition += 8;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        doc.text('Équipement:', margin, yPosition);
        doc.text(intervention.equipement, margin + 50, yPosition);
        yPosition += 7;
        
        doc.text('Statut équipement:', margin, yPosition);
        doc.text(intervention.statusEquipement, margin + 50, yPosition);
        yPosition += 7;
        
        doc.text('Localisation:', margin, yPosition);
        doc.text(intervention.localisation, margin + 50, yPosition);
        yPosition += 15;

        // Technicien
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('4. Technicien Assigné', margin, yPosition);
        yPosition += 8;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        doc.text('Nom du technicien:', margin, yPosition);
        doc.text(intervention.technicien, margin + 50, yPosition);
        
        return doc.output('blob');
    }

    const loadDemandes = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.idUtilisateur) {
                showNotification('Utilisateur non connecté', 'error');
                navigate('/login');
                return;
            }
            const response = await api.get(`/api/interventions/demandeur/${user.idUtilisateur}`);
            
            const transformedData = response.data.map(intervention => ({
                id: intervention.idIntervention,
                description: intervention.description,
                date: intervention.dateDemande,
                equipement: intervention.equipement ? 
                    `${intervention.equipement.typeEquipement} - ${intervention.equipement.modele}` : 
                    'Équipement non défini',
                statusEquipement: intervention.equipement ? intervention.equipement.statut : 'Non défini',
                localisation: intervention.localisation || 'Non définie',
                technicien: intervention.technicien ? 
                    `${intervention.technicien.nom} ${intervention.technicien.prenom}` : 
                    'Non assigné',
                priority: intervention.priorite,
                statusIntervention: mapStatusToUI(intervention.statut),
                statutOriginal: intervention.statut,
                // Ajouter les informations nécessaires pour détecter les nouvelles affectations
                technicienId: intervention.technicien?.idTechnicien || null,
                dateAffectation: intervention.dateAffectation || null
            }));

            // Vérifier les nouvelles affectations
            checkForNewAffectations(transformedData);
            
            setDemandes(transformedData);
            showNotification('Demandes chargées avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors du chargement des demandes:', error);
            if (error.response?.status === 401) {
                showNotification('Session expirée, veuillez vous reconnecter', 'error');
                navigate('/login');
            } else {
                showNotification('Erreur lors du chargement des demandes', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour vérifier les nouvelles affectations
    const checkForNewAffectations = async (newDemandes = null) => {
        try {
            const currentDemandes = newDemandes || demandes;
            const previousAffectations = JSON.parse(localStorage.getItem('previousAffectations') || '[]');
            
            // Identifier les nouvelles affectations
            const nouvellesAffectations = [];
            
            currentDemandes.forEach(demande => {
                if (demande.technicienId && demande.technicien !== 'Non assigné') {
                    const previousAffectation = previousAffectations.find(prev => prev.id === demande.id);
                    
                    // Si c'est une nouvelle affectation ou changement de technicien
                    if (!previousAffectation || previousAffectation.technicienId !== demande.technicienId) {
                        nouvellesAffectations.push({
                            id: demande.id,
                            technicien: demande.technicien,
                            description: demande.description,
                            dateAffectation: new Date().toISOString()
                        });
                    }
                }
            });

            // Afficher les notifications pour les nouvelles affectations
            if (nouvellesAffectations.length > 0) {
                nouvellesAffectations.forEach(affectation => {
                    showNotification(
                        `📋 Demande #${affectation.id} assignée au technicien ${affectation.technicien}`,
                        'info'
                    );
                });
                
                // Mettre à jour les affectations stockées
                setAffectations(prev => [...prev, ...nouvellesAffectations]);
            }

            // Sauvegarder l'état actuel des affectations
            const currentAffectations = currentDemandes
                .filter(d => d.technicienId && d.technicien !== 'Non assigné')
                .map(d => ({
                    id: d.id,
                    technicienId: d.technicienId,
                    technicien: d.technicien
                }));
            
            localStorage.setItem('previousAffectations', JSON.stringify(currentAffectations));
            
        } catch (error) {
            console.error('Erreur lors de la vérification des affectations:', error);
        }
    };

    const mapStatusToUI = (apiStatus) => {
        switch(apiStatus) {
            case 'EN_ATTENTE': return 'not-sent';
            case 'EN_COURS': return 'generating';
            case 'TERMINEE': return 'sent';
            case 'ANNULEE': return 'not-sent';
            default: return 'not-sent';
        }
    };

    const getStatusClass = (statusIntervention) => {
        switch(statusIntervention) {
            case 'sent': return 'status-sent';
            case 'generating': return 'status-generating';
            default: return 'status-not-sent';
        }
    };

    const getStatusIcon = (statusIntervention) => {
        switch(statusIntervention) {
            case 'sent': return '✓';
            case 'generating': return '⏳';
            default: return '✗';
        }
    };

    const getStatusTitle = (statusIntervention) => {
        switch(statusIntervention) {
            case 'sent': return 'Document envoyé à l\'administration';
            case 'generating': return 'Envoi en cours...';
            default: return 'En attente d\'envoi';
        }
    };

    const getStatusText = (statusIntervention) => {
        switch(statusIntervention) {
            case 'sent': return 'Envoyé';
            case 'generating': return 'En cours';
            default: return 'En attente';
        }
    };

    const formatDate = (dateString) => {
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => {
            setNotification({ message: '', type: '' });
        }, 5000); // Augmenté à 5 secondes pour les notifications d'affectation
    };

    const showModal = (message, callback) => {
        setModalMessage(message);
        setIsModalOpen(true);
        setPendingAction(() => callback);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setPendingAction(null);
    };

    const confirmAction = () => {
        if (pendingAction) {
            pendingAction();
        }
        closeModal();
    };

    // Fonction améliorée pour envoyer à l'administration
    const sendToAdmin = async (id) => {
        try {
            const demande = demandes.find(d => d.id === id);
            if (!demande) {
                showNotification('Demande introuvable', 'error');
                return;
            }

            // Changer le statut à "en cours d'envoi"
            setDemandes(prevDemandes =>
                prevDemandes.map(d =>
                    d.id === id ? { ...d, statusIntervention: 'generating' } : d
                )
            );

            // Générer le PDF
            const pdfBlob = generatePDFBlob(demande);
            
            // Préparer les données à envoyer
            const formData = new FormData();
            formData.append('file', pdfBlob, `Rapport_Intervention_${demande.id}.pdf`);
            formData.append('interventionId', demande.id.toString());
            formData.append('description', demande.description);
            
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.idUtilisateur) {
                formData.append('demandeurId', user.idUtilisateur.toString());
            }

            // Envoyer à l'API
            const response = await api.post('/api/documents/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 200 || response.status === 201) {
                // Mettre à jour le statut à "envoyé"
                setDemandes(prevDemandes =>
                    prevDemandes.map(d =>
                        d.id === id ? { ...d, statusIntervention: 'sent' } : d
                    )
                );
                
                showNotification('Document envoyé avec succès à l\'administration!', 'success');
            } else {
                throw new Error('Erreur lors de l\'envoi du document');
            }
        } catch (error) {
            console.error("Erreur envoi admin:", error);
            
            let errorMessage = 'Erreur lors de l\'envoi du document';
            if (error.response) {
                if (error.response.status === 404) {
                    errorMessage = 'Service de documents non disponible';
                } else if (error.response.status === 500) {
                    errorMessage = 'Erreur serveur lors de l\'envoi';
                } else {
                    errorMessage = `Erreur ${error.response.status}: ${error.response.data?.message || 'Erreur inconnue'}`;
                }
            } else if (error.request) {
                errorMessage = 'Impossible de contacter le serveur';
            }
            
            showNotification(errorMessage, 'error');
            
            // Remettre le statut à "non envoyé"
            setDemandes(prevDemandes =>
                prevDemandes.map(d =>
                    d.id === id ? { ...d, statusIntervention: 'not-sent' } : d
                )
            );
        }
    };

    // Fonction pour envoyer tous les documents en attente
    const sendAllToAdmin = async () => {
        const unsentDemandes = demandes.filter(demande => demande.statusIntervention === 'not-sent');
        
        if (unsentDemandes.length === 0) {
            showNotification('Aucun document en attente d\'envoi!', 'error');
            return;
        }

        const confirmSend = window.confirm(
            `Voulez-vous envoyer ${unsentDemandes.length} document(s) à l'administration? Les documents seront disponibles dans la section Documents des interventions.`
        );
        
        if (!confirmSend) {
            return;
        }

        setShowProgressBar(true);
        let successCount = 0;
        let errorCount = 0;
        const total = unsentDemandes.length;

        for (let i = 0; i < unsentDemandes.length; i++) {
            const demande = unsentDemandes[i];
            try {
                await sendToAdmin(demande.id);
                successCount++;
            } catch (error) {
                errorCount++;
                console.error(`Erreur pour la demande ${demande.id}:`, error);
            }
            
            // Mettre à jour la barre de progression
            const progress = ((i + 1) / total) * 100;
            setGlobalProgress(progress);
            
            // Petite pause entre chaque envoi
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        setShowProgressBar(false);
        setGlobalProgress(0);

        // Message de résultat
        if (successCount > 0 && errorCount === 0) {
            showNotification(
                `${successCount} document(s) envoyé(s) avec succès! Ils sont maintenant disponibles dans la section Documents.`, 
                'success'
            );
        } else if (successCount > 0 && errorCount > 0) {
            showNotification(
                `${successCount} document(s) envoyé(s), ${errorCount} erreur(s). Vérifiez la section Documents.`, 
                'warning'
            );
        } else {
            showNotification(`Échec de l'envoi de tous les documents`, 'error');
        }
    };

    // Fonction pour générer un PDF local (téléchargement direct)
    const generateSinglePDF = async (id) => {
        const demande = demandes.find(d => d.id === id);
        if (!demande) {
            showNotification('Demande introuvable', 'error');
            return;
        }

        try {
            const pdfBlob = generatePDFBlob(demande);
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Rapport_Intervention_${demande.id}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
            
            showNotification('PDF téléchargé avec succès!', 'success');
        } catch (error) {
            console.error("Erreur génération PDF:", error);
            showNotification('Erreur lors de la génération du PDF', 'error');
        }
    };

    const deleteDemande = (id) => {
    console.log("ID à supprimer:", id, "Type:", typeof id); // Debug
    showModal('Voulez-vous vraiment supprimer cette demande ?', async () => {
        try {
            const response = await api.delete(`/api/interventions/${id}`);
            console.log("Réponse suppression:", response.data); // Debug
            setDemandes(prev => prev.filter(d => d.id !== id));
            showNotification('Suppression réussie!', 'success');
        } catch (error) {
            console.error("Erreur complète:", {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            showNotification(
                error.response?.data?.message || "Échec de la suppression", 
                'error'
            );
        }
    });
};

    const refreshData = () => {
        loadDemandes();
    };

    // Fonction modifiée pour afficher seulement les notifications d'affectation
    const getRecentNotifications = () => {
        const notifications = [];
        
        // Afficher seulement les demandes récemment affectées à un technicien
        const recentlyAssigned = demandes.filter(d => 
            d.technicien !== 'Non assigné' && 
            d.statusIntervention !== 'sent'
        );
        
        recentlyAssigned.forEach(demande => {
            notifications.push({
                id: `Demande #${demande.id.toString().padStart(3, '0')}`,
                message: `Assignée au technicien ${demande.technicien}`,
                icon: '👨‍🔧'
            });
        });
        
        return notifications.slice(0, 3);
    };

    const filteredDemandes = demandes.filter(demande =>
        filterStatus === 'all' ? true : demande.statusIntervention === filterStatus
    );

    const totalDocs = demandes.length;
    const sentDocs = demandes.filter(demande => demande.statusIntervention === 'sent').length;
    const pendingDocs = demandes.filter(demande => demande.statusIntervention === 'not-sent').length;
    const assignedDocs = demandes.filter(demande => demande.technicien !== 'Non assigné').length; // Nouvelles stat pour les affectations
    const successRate = totalDocs > 0 ? Math.round((sentDocs / totalDocs) * 100) : 0;

    return (
        <div className="container">
            <div className="header">
                <h1>📄 Gestion des Demandes d'Intervention</h1>
                <p>Système de suivi et de transfert des demandes vers l'administration</p>
            </div>

            {/* Section Notifications - Affiche seulement les affectations */}
            <div className="notifications-section">
                <h3>Affectations récentes</h3>
                <div className="notifications-list">
                    {getRecentNotifications().length > 0 ? (
                        getRecentNotifications().map((notif, index) => (
                            <div key={index} className="notification-item">
                                <span className="notification-icon">{notif.icon}</span>
                                <div className="notification-content">
                                    <span className="notification-id">{notif.id}</span>
                                    <span className="notification-message"> – {notif.message}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="notification-item">
                            <span className="notification-icon">ℹ️</span>
                            <div className="notification-content">
                                <span className="notification-message">Aucune affectation récente</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="controls-section">
                <div className="controls-header">
                    <h3>Actions Globales</h3>
                    <div className="global-actions">
                        
                        <button className="btn btn-warning" onClick={refreshData}>
                            🔄 Actualiser
                        </button>
                        <button className="btn btn-info" onClick={() => navigate('/demandeur/demande')}>
                            ➕ Ajouter une demande
                        </button>
                        <button className="chatbot-button" onClick={() => navigate('/chatbot')}>
                            💬 Besoin d'aide ?
                        </button>
                    </div>
                </div>
            </div>

            {notification.message && (
                <div className={`notification ${notification.type} show`}>
                    {notification.message}
                </div>
            )}

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-value">{totalDocs}</div>
                    <div className="stat-label">Total Demandes</div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">👨‍🔧</div>
                    <div className="stat-value">{assignedDocs}</div>
                    <div className="stat-label">Assignées</div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-value">{pendingDocs}</div>
                    <div className="stat-label">En Attente</div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-value">{successRate}%</div>
                    <div className="stat-label">Taux de Réussite</div>
                </div>
            </div>

            <div className="documents-section">
                <div className="section-header">
                    <h3>Liste des Demandes</h3>
                    <div className="filter-controls">
                        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="all">Tous les statuts</option>
                            <option value="sent">Terminées</option>
                            <option value="not-sent">En attente</option>
                            <option value="generating">En cours</option>
                        </select>
                    </div>
                </div>

                {showProgressBar && (
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${globalProgress}%` }}></div>
                    </div>
                )}

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Chargement des demandes...</p>
                    </div>
                ) : filteredDemandes.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📄</div>
                        <div className="empty-state-text">
                            {demandes.length === 0 ? 'Aucune demande trouvée' : 'Aucune demande avec ce filtre'}
                        </div>
                        <p>
                            {demandes.length === 0 
                                ? 'Créez votre première demande d\'intervention.' 
                                : 'Essayez un autre filtre ou actualisez les données.'
                            }
                        </p>
                        <div>
                            {demandes.length === 0 && (
                                <button className="btn btn-info" onClick={() => navigate('/create-demande')}>
                                    ➕ Créer une demande
                                </button>
                            )}
                            <button className="btn btn-warning" onClick={refreshData}>
                                🔄 Actualiser
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="documents-grid">
                        {filteredDemandes.map(demande => (
                            <div className="document-card" key={demande.id}>
                                <div className="document-header">
                                    <div>
                                        <div className="document-id">Demande #{demande.id}</div>
                                        <div className="document-date">{formatDate(demande.date)}</div>
                                    </div>
                                    <div className={`status-icon ${getStatusClass(demande.statusIntervention)}`} title={getStatusTitle(demande.statusIntervention)}>
                                        {getStatusIcon(demande.statusIntervention)}
                                    </div>
                                </div>
                                <div className="document-description">
                                    {demande.description}
                                </div>
                                <div className="document-meta">
                                    <div className="meta-item">
                                        <span>🔧</span>
                                        <span>{demande.equipement}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span>⚙️</span>
                                        <span>{demande.statusEquipement}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span>📍</span>
                                        <span>{demande.localisation}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span>👨‍🔧</span>
                                        <span style={{
                                            fontWeight: demande.technicien !== 'Non assigné' ? 'bold' : 'normal',
                                            color: demande.technicien !== 'Non assigné' ? '#28A745' : '#6c757d'
                                        }}>
                                            {demande.technicien}
                                        </span>
                                    </div>
                                    <div className="meta-item">
                                        <span>⚡</span>
                                        <span>{demande.priority}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span>📊</span>
                                        <span>{getStatusText(demande.statusIntervention)}</span>
                                    </div>
                                </div>
                                <div className="document-actions">
                                    <button
                                        className="btn btn-primary btn-small"
                                        onClick={() => generateSinglePDF(demande.id)}
                                        disabled={demande.statusIntervention === 'generating'}
                                    >
                                        {demande.statusIntervention === 'generating' ? '⏳ Génération...' : '📄 Générer PDF'}
                                    </button>
                                    
                                    {/* Removed the condition 'demande.statusIntervention === 'not-sent'' */}
                                    <button className="btn btn-danger btn-small" onClick={() => deleteDemande(demande.id)}>
                                        🗑️ Supprimer
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="modal show" onClick={(e) => { if (e.target.classList.contains('modal')) { closeModal(); } }}>
                    <div className="modal-content">
                        <h3>Confirmation</h3>
                        <p>{modalMessage}</p>
                        <div className="modal-actions">
                            <button className="btn btn-primary" onClick={confirmAction}>Confirmer</button>
                            <button className="btn" onClick={closeModal}>Annuler</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DashboardDemandeur;