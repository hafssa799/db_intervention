import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ChatbotPage.css';

const ChatbotPage = () => {
    const [messages, setMessages] = useState([
        { type: 'bot', content: "Bonjour ! Comment puis-je vous aider aujourd'hui ?" }
    ]);
    const [input, setInput] = useState('');
    const [historique, setHistorique] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [currentItem, setCurrentItem] = useState(null);
    const [sharePopupVisible, setSharePopupVisible] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);
    const conversationRef = useRef(null);
    const shareInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchHistorique();
    }, []);

    useEffect(() => {
        if (conversationRef.current) {
            conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
        }
    }, [messages]);

    // Gestionnaire pour fermer le menu contextuel lorsqu'on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeMenu !== null && !event.target.closest('.menu-container')) {
                setActiveMenu(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeMenu]);

    // Focus sur l'input de partage quand le popup est visible
    useEffect(() => {
        if (sharePopupVisible && shareInputRef.current) {
            shareInputRef.current.select();
        }
    }, [sharePopupVisible]);

    const fetchHistorique = async () => {
        try {
            const response = await axios.get('http://localhost:8083/api/chatbot/historique');
            if (response.data && Array.isArray(response.data)) {
                setHistorique(response.data);
            } else {
                setError("Erreur de format dans l'historique");
            }
        } catch (err) {
            console.error("Erreur lors du chargement de l'historique:", err);
            setError("Erreur lors du chargement de l'historique");
        }
    };

    const handleSendMessage = async () => {
        if (input.trim() === '') return;

        const userMessage = input.trim();
        setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.post('http://localhost:8083/api/chatbot/question', {
                question: userMessage,
            });

            const botResponse = response?.data?.reponse?.trim();
            if (
                !botResponse ||
                botResponse.toLowerCase().includes("je ne sais pas") ||
                botResponse.toLowerCase().includes("désolé") ||
                botResponse.toLowerCase().includes("je n'ai pas trouvé de solution")
            ) {
                const redirectMessage = "Je suis désolé, je n'ai pas trouvé de solution à votre problème. Je vous redirige vers la page de création d'une demande...";

                setMessages(prev => [...prev, { type: 'bot', content: redirectMessage }]);

                setTimeout(() => {
                    navigate('/demandeur/demande', {
                        state: {
                            description: userMessage
                        }
                    });
                }, 3000);
            } else {
                setMessages(prev => [...prev, {
                    type: 'bot',
                    content: botResponse,
                    isHTML: botResponse.includes('<')
                }]);
            }

            fetchHistorique();
        } catch (err) {
            console.error("Erreur lors de l'envoi de la question:", err);
            setMessages(prev => [...prev, {
                type: 'bot',
                content: "Désolé, une erreur s'est produite. Veuillez réessayer plus tard."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleHistoryItemClick = (item) => {
        if (!item?.question) return;
        setMessages([
            { type: 'bot', content: "Bonjour ! Comment puis-je vous aider aujourd'hui ?" },
            { type: 'user', content: item.question },
            {
                type: 'bot',
                content: item.reponse || "Pas de réponse disponible",
                isHTML: item.reponse?.includes('<')
            }
        ]);
    };

    // Générer l'URL partageable pour une conversation
    const generateShareableUrl = (itemId) => {
        const baseUrl = window.location.origin;
        return `${baseUrl}/conversation/${itemId}`;
    };

    // Fonctions pour le menu contextuel
    const toggleMenu = (index, event) => {
        event.preventDefault();
        event.stopPropagation();
        setActiveMenu(activeMenu === index ? null : index);
    };

    const handleShare = (item) => {
        const shareableUrl = generateShareableUrl(item.id);
        setShareUrl(shareableUrl);
        setSharePopupVisible(true);
        setActiveMenu(null);
        setCopySuccess(false);
    };

    // Fonction pour copier directement le lien sans ouvrir la popup
    const handleQuickCopy = (item, event) => {
        event.stopPropagation();
        const shareableUrl = generateShareableUrl(item.id);
        navigator.clipboard.writeText(shareableUrl).then(
            () => {
                // Afficher une notification temporaire
                const notification = document.createElement('div');
                notification.className = 'copy-notification';
                notification.textContent = 'Lien copié !';
                document.body.appendChild(notification);

                // Supprimer la notification après 2 secondes
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 2000);
            },
            (err) => {
                console.error('Erreur lors de la copie :', err);
            }
        );
    };

    const handleCopyLink = () => {
        if (shareInputRef.current) {
            shareInputRef.current.select();
            document.execCommand('copy');
            // Utilisation de l'API Clipboard moderne
            navigator.clipboard.writeText(shareUrl).then(
                () => {
                    setCopySuccess(true);
                    // Réinitialiser le message de succès après 3 secondes
                    setTimeout(() => setCopySuccess(false), 3000);
                },
                (err) => {
                    console.error('Erreur lors de la copie :', err);
                    setCopySuccess(false);
                }
            );
        }
    };

    const closeSharePopup = () => {
        setSharePopupVisible(false);
    };

    const startRenaming = (item, event) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        setIsRenaming(true);
        setNewTitle(item.question);
        setCurrentItem(item);
        setActiveMenu(null);
    };

    const handleRename = async () => {
        if (!currentItem || !newTitle.trim()) {
            setIsRenaming(false);
            return;
        }

        try {
            const response = await axios.put(`http://localhost:8083/api/chatbot/historique/${currentItem.id}`, {
                question: newTitle.trim(),
                reponse: currentItem.reponse,
                dateCreation: currentItem.dateCreation
            });

            console.log("Réponse du serveur après renommage:", response);

            setHistorique(prevHistorique =>
                prevHistorique.map(item =>
                    item.id === currentItem.id
                        ? { ...item, question: newTitle.trim() }
                        : item
                )
            );

            setIsRenaming(false);
            setNewTitle('');
            setCurrentItem(null);
        } catch (err) {
            console.error("Erreur lors du renommage:", err);
            alert(`Erreur lors du renommage: ${err.response?.data?.message || err.message}`);
            setError(`Erreur lors du renommage de la conversation: ${err.message}`);
        }
    };

    const handleDelete = async (item, event) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette conversation ?")) {
            try {
                console.log("Tentative de suppression de l'item:", item.id);
                const response = await axios.delete(`http://localhost:8083/api/chatbot/historique/${item.id}`);
                console.log("Réponse du serveur après suppression:", response);

                setHistorique(prevHistorique =>
                    prevHistorique.filter(histItem => histItem.id !== item.id)
                );

                alert("La conversation a été supprimée avec succès.");
            } catch (err) {
                console.error("Erreur lors de la suppression:", err);
                alert(`Erreur lors de la suppression: ${err.response?.data?.message || err.message}`);
                setError(`Erreur lors de la suppression de la conversation: ${err.message}`);
            }
        }
        setActiveMenu(null);
    };

    // --- New Conversation Handler ---
    const handleNewConversation = () => {
        setMessages([{ type: 'bot', content: "Bonjour ! Comment puis-je vous aider aujourd'hui ?" }]);
        setInput('');
        setError(null);
        setIsLoading(false);
        setActiveMenu(null); // Close any open menus
        setIsRenaming(false); // Close renaming dialog
        setNewTitle('');
        setCurrentItem(null);
        setSharePopupVisible(false); // Close share popup
        setShareUrl('');
        setCopySuccess(false);
    };

    return (
        <div className="chatbot-container">
            <div className="chatbot-header">
                <h1>Chatbot d'Assistance Technique</h1>
                {error && <div className="error-message">{error}</div>}
            </div>

            <div className="chatbot-content">
                <div className="conversation" ref={conversationRef}>
                    {messages.map((msg, i) => (
                        <div key={i} className={`message ${msg.type}-message`}>
                            {msg.isHTML ? (
                                <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                            ) : (
                                <div>{msg.content}</div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="message bot-message">
                            <div className="loader"></div>
                        </div>
                    )}
                </div>

                <div className="historique">
                    <h3>Historique des Conversations</h3>
                    {/* --- New Conversation Button --- */}
                    <button className="new-conversation-button" onClick={handleNewConversation}>
                        + Nouvelle Conversation
                    </button>
                    {/* ---------------------------------- */}
                    {isRenaming && (
                        <div className="rename-dialog">
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleRename()}
                                autoFocus
                            />
                            <div className="rename-actions">
                                <button onClick={handleRename}>Renommer</button>
                                <button onClick={() => {
                                    setIsRenaming(false);
                                    setNewTitle('');
                                    setCurrentItem(null);
                                }}>Annuler</button>
                            </div>
                        </div>
                    )}
                    <div className="historique-list">
                        {historique.length === 0 ? (
                            <p>Aucun historique disponible</p>
                        ) : (
                            historique.map((item, index) => (
                                <div
                                    key={item.id || index}
                                    className="historique-item"
                                    onClick={() => handleHistoryItemClick(item)}
                                >
                                    <div className="historique-content">
                                        <div className="historique-question">
                                            {item.question?.length > 30
                                                ? `${item.question.substring(0, 30)}...`
                                                : item.question || "Question inconnue"}
                                        </div>
                                        <div className="historique-timestamp">
                                            {item.dateCreation && new Date(item.dateCreation).toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="historique-actions">


                                        <div className="menu-container">
                                            <button
                                                className="menu-dots"
                                                onClick={(e) => toggleMenu(index, e)}
                                                aria-label="Options"
                                            >
                                                ⋮
                                            </button>

                                            {activeMenu === index && (
                                                <div className="menu-dropdown">
                                                    <button onClick={() => handleShare(item)}>
                                                        <span className="menu-icon">📤</span> Partager
                                                    </button>
                                                    <button onClick={(e) => startRenaming(item, e)}>
                                                        <span className="menu-icon">✏️</span> Renommer
                                                    </button>
                                                    <button onClick={(e) => handleDelete(item, e)}>
                                                        <span className="menu-icon">🗑️</span> Supprimer
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="chatbot-input">
                <input
                    type="text"
                    placeholder="Tapez votre question ici..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button onClick={handleSendMessage} disabled={isLoading}>
                    Envoyer
                </button>
            </div>

            {/* Popup de partage */}
            {sharePopupVisible && (
                <>
                    <div className="overlay" onClick={closeSharePopup}></div>
                    <div className="share-popup">
                        <div className="share-popup-header">
                            <h3>Partager cette conversation</h3>
                            <button className="share-popup-close" onClick={closeSharePopup}>×</button>
                        </div>
                        <div className="share-link-container">
                            <input
                                ref={shareInputRef}
                                type="text"
                                value={shareUrl}
                                readOnly
                            />
                            <button onClick={handleCopyLink}>
                                {copySuccess ? 'Copié !' : 'Copier'}
                            </button>

                        </div>
                        {copySuccess && (
                            <div className="share-link-success">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#00a388" />
                                </svg>
                                Lien copié dans le presse-papier!
                            </div>

                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ChatbotPage;