import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ChatbotPage.css';

// Dictionnaire des traductions
const translations = {
    fr: {
        title: "Chatbot d'Assistance Technique",
        greeting: "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
        placeholder: "Tapez votre question ici...",
        send: "Envoyer",
        history: "Historique des Conversations",
        newConversation: "+ Nouvelle Conversation",
        noHistory: "Aucun historique disponible",
        unknownQuestion: "Question inconnue",
        share: "Partager",
        rename: "Renommer",
        delete: "Supprimer",
        shareTitle: "Partager cette conversation",
        copy: "Copier",
        copied: "Copié !",
        linkCopied: "Lien copié dans le presse-papier!",
        confirmDelete: "Êtes-vous sûr de vouloir supprimer cette conversation ?",
        deleteSuccess: "La conversation a été supprimée avec succès.",
        errorOccurred: "Désolé, une erreur s'est produite. Veuillez réessayer plus tard.",
        noSolution: "Je suis désolé, je n'ai pas trouvé de solution à votre problème. Je vous redirige vers la page de création d'une demande...",
        profile: "Profil",
        settings: "Paramètres",
        language: "Langue",
        theme: "Thème",
        logout: "Déconnexion",
        cancel: "Annuler",
        save: "Sauvegarder",
        editProfile: "Modifier le profil",
        changeAvatar: "Changer l'avatar",
        notifications: "Notifications",
        privacy: "Confidentialité",
        help: "Aide",
        about: "À propos",
        darkMode: "Mode sombre",
        lightMode: "Mode clair",
        autoMode: "Mode automatique",
        emailNotifications: "Notifications par email",
        soundNotifications: "Notifications sonores",
        desktopNotifications: "Notifications bureau",
        accountInfo: "Informations du compte",
        preferences: "Préférences",
        security: "Sécurité",
        changePassword: "Changer le mot de passe",
        twoFactorAuth: "Authentification à deux facteurs",
        loginHistory: "Historique des connexions",
        deleteAccount: "Supprimer le compte",
        exportData: "Exporter les données",
        importData: "Importer les données",
        fontSize: "Taille de police",
        small: "Petite",
        medium: "Moyenne",
        large: "Grande",
        chatSettings: "Paramètres de chat",
        autoSave: "Sauvegarde automatique",
        showTimestamps: "Afficher les horodatages",
        compactMode: "Mode compact"
    },
    en: {
        title: "Technical Support Chatbot",
        greeting: "Hello! How can I help you today?",
        placeholder: "Type your question here...",
        send: "Send",
        history: "Conversation History",
        newConversation: "+ New Conversation",
        noHistory: "No history available",
        unknownQuestion: "Unknown question",
        share: "Share",
        rename: "Rename",
        delete: "Delete",
        shareTitle: "Share this conversation",
        copy: "Copy",
        copied: "Copied!",
        linkCopied: "Link copied to clipboard!",
        confirmDelete: "Are you sure you want to delete this conversation?",
        deleteSuccess: "The conversation has been successfully deleted.",
        errorOccurred: "Sorry, an error occurred. Please try again later.",
        noSolution: "I'm sorry, I couldn't find a solution to your problem. I'm redirecting you to the request creation page...",
        profile: "Profile",
        settings: "Settings",
        language: "Language",
        theme: "Theme",
        logout: "Logout",
        cancel: "Cancel",
        save: "Save",
        editProfile: "Edit Profile",
        changeAvatar: "Change Avatar",
        notifications: "Notifications",
        privacy: "Privacy",
        help: "Help",
        about: "About",
        darkMode: "Dark Mode",
        lightMode: "Light Mode",
        autoMode: "Auto Mode",
        emailNotifications: "Email Notifications",
        soundNotifications: "Sound Notifications",
        desktopNotifications: "Desktop Notifications",
        accountInfo: "Account Information",
        preferences: "Preferences",
        security: "Security",
        changePassword: "Change Password",
        twoFactorAuth: "Two-Factor Authentication",
        loginHistory: "Login History",
        deleteAccount: "Delete Account",
        exportData: "Export Data",
        importData: "Import Data",
        fontSize: "Font Size",
        small: "Small",
        medium: "Medium",
        large: "Large",
        chatSettings: "Chat Settings",
        autoSave: "Auto Save",
        showTimestamps: "Show Timestamps",
        compactMode: "Compact Mode"
    },
    ar: {
        title: "روبوت الدعم الفني",
        greeting: "مرحبا! كيف يمكنني مساعدتك اليوم؟",
        placeholder: "اكتب سؤالك هنا...",
        send: "إرسال",
        history: "تاريخ المحادثات",
        newConversation: "+ محادثة جديدة",
        noHistory: "لا يوجد تاريخ متاح",
        unknownQuestion: "سؤال غير معروف",
        share: "مشاركة",
        rename: "إعادة تسمية",
        delete: "حذف",
        shareTitle: "مشاركة هذه المحادثة",
        copy: "نسخ",
        copied: "تم النسخ!",
        linkCopied: "تم نسخ الرابط إلى الحافظة!",
        confirmDelete: "هل أنت متأكد من أنك تريد حذف هذه المحادثة؟",
        deleteSuccess: "تم حذف المحادثة بنجاح.",
        errorOccurred: "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى لاحقاً.",
        noSolution: "أعتذر، لم أتمكن من إيجاد حل لمشكلتك. سأقوم بتوجيهك إلى صفحة إنشاء طلب...",
        profile: "الملف الشخصي",
        settings: "الإعدادات",
        language: "اللغة",
        theme: "المظهر",
        logout: "تسجيل الخروج",
        cancel: "إلغاء",
        save: "حفظ",
        editProfile: "تعديل الملف الشخصي",
        changeAvatar: "تغيير الصورة الشخصية",
        notifications: "الإشعارات",
        privacy: "الخصوصية",
        help: "المساعدة",
        about: "حول",
        darkMode: "الوضع الداكن",
        lightMode: "الوضع الفاتح",
        autoMode: "الوضع التلقائي",
        emailNotifications: "إشعارات البريد الإلكتروني",
        soundNotifications: "الإشعارات الصوتية",
        desktopNotifications: "إشعارات سطح المكتب",
        accountInfo: "معلومات الحساب",
        preferences: "التفضيلات",
        security: "الأمان",
        changePassword: "تغيير كلمة المرور",
        twoFactorAuth: "المصادقة الثنائية",
        loginHistory: "تاريخ تسجيل الدخول",
        deleteAccount: "حذف الحساب",
        exportData: "تصدير البيانات",
        importData: "استيراد البيانات",
        fontSize: "حجم الخط",
        small: "صغير",
        medium: "متوسط",
        large: "كبير",
        chatSettings: "إعدادات الدردشة",
        autoSave: "الحفظ التلقائي",
        showTimestamps: "إظهار الطوابع الزمنية",
        compactMode: "الوضع المضغوط"
    }
};

const ChatbotPage = () => {
    const [messages, setMessages] = useState([]);
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
    
    // États pour les nouvelles fonctionnalités
    const [currentLanguage, setCurrentLanguage] = useState('fr');
    const [showProfile, setShowProfile] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    
    // Profil utilisateur avec plus de données
    const [userProfile, setUserProfile] = useState({
        name: 'Ahmed Benali',
        email: 'ahmed.benali@example.com',
        avatar: null,
        theme: 'light',
        joinDate: '2024-01-15',
        lastLogin: new Date().toISOString(),
        role: 'Demandeur',
        department: 'Informatique',
        phone: '+212 6 12 34 56 78',
        location: 'Fès, Maroc',
        status: 'Actif',
        // Préférences
        preferences: {
            emailNotifications: true,
            soundNotifications: false,
            desktopNotifications: true,
            fontSize: 'medium',
            autoSave: true,
            showTimestamps: true,
            compactMode: false
        },
        // Statistiques
        stats: {
            totalConversations: 0,
            totalQuestions: 0,
            averageResponseTime: '2.3s',
            favoriteTopics: ['Installation', 'Configuration', 'Dépannage']
        }
    });

    const conversationRef = useRef(null);
    const shareInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    // Récupérer les initiales du nom
   // Remplacer la fonction existante par :
const getInitials = (name) => {
    return name.trim().charAt(0).toUpperCase();
};

    // Générer une couleur basée sur le nom
   // Remplacer la fonction existante par :
const getAvatarColor = (name) => {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726', '#AB47BC',
        '#26A69A', '#EF5350', '#42A5F5', '#66BB6A', '#FF7043'
    ];
    return colors[name.charCodeAt(0) % colors.length];
};

    // Initialiser les messages avec la langue actuelle
    useEffect(() => {
        setMessages([{ 
            type: 'bot', 
            content: translations[currentLanguage].greeting 
        }]);
    }, [currentLanguage]);

    useEffect(() => {
        fetchHistorique();
        loadUserProfile();
    }, []);

    useEffect(() => {
        if (conversationRef.current) {
            conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
        }
    }, [messages]);

    // Gestionnaire pour fermer les menus et popups
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeMenu !== null && !event.target.closest('.menu-container')) {
                setActiveMenu(null);
            }
            if (showProfile && !event.target.closest('.profile-dropdown') && !event.target.closest('.profile-button')) {
                setShowProfile(false);
            }
            if (showSettings && !event.target.closest('.settings-modal') && !event.target.closest('.settings-btn')) {
                setShowSettings(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeMenu, showProfile, showSettings]);

    // Focus sur l'input de partage quand le popup est visible
    useEffect(() => {
        if (sharePopupVisible && shareInputRef.current) {
            shareInputRef.current.select();
        }
    }, [sharePopupVisible]);

    // Charger le profil utilisateur (simulation)
    const loadUserProfile = async () => {
        try {
            // Ici vous feriez un appel API réel
            // const response = await axios.get('http://localhost:8083/api/user/profile');
            
            // Simulation de données utilisateur
            const userData = {
                name: 'Mohamed Alami',
                email: 'mohamed.alami@techsupport.ma',
                role: 'Demandeur',
                department: 'Service Informatique',
                phone: '+212 6 12 34 56 78',
                location: 'Fès, Maroc',
                joinDate: '2023-09-15',
                lastLogin: new Date().toISOString(),
                status: 'Actif'
            };
            
            setUserProfile(prev => ({
                ...prev,
                ...userData
            }));
            
            // Mettre à jour les statistiques
            updateUserStats();
        } catch (error) {
            console.error('Erreur lors du chargement du profil:', error);
        }
    };

    // Mettre à jour les statistiques utilisateur
    const updateUserStats = () => {
        setUserProfile(prev => ({
            ...prev,
            stats: {
                ...prev.stats,
                totalConversations: historique.length,
                totalQuestions: historique.reduce((acc, item) => acc + 1, 0)
            }
        }));
    };

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
                language: currentLanguage
            });

            const botResponse = response?.data?.reponse?.trim();
            if (
                !botResponse ||
                botResponse.toLowerCase().includes("je ne sais pas") ||
                botResponse.toLowerCase().includes("i don't know") ||
                botResponse.toLowerCase().includes("لا أعرف") ||
                botResponse.toLowerCase().includes("désolé") ||
                botResponse.toLowerCase().includes("sorry") ||
                botResponse.toLowerCase().includes("آسف")
            ) {
                const redirectMessage = translations[currentLanguage].noSolution;
                setMessages(prev => [...prev, { type: 'bot', content: redirectMessage }]);

                setTimeout(() => {
                    navigate('/demandeur/demande', {
                        state: { description: userMessage }
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
                content: translations[currentLanguage].errorOccurred
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleHistoryItemClick = (item) => {
        if (!item?.question) return;
        setMessages([
            { type: 'bot', content: translations[currentLanguage].greeting },
            { type: 'user', content: item.question },
            {
                type: 'bot',
                content: item.reponse || "Pas de réponse disponible",
                isHTML: item.reponse?.includes('<')
            }
        ]);
    };

    // Génération URL partageable
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

    const handleCopyLink = () => {
        if (shareInputRef.current) {
            shareInputRef.current.select();
            navigator.clipboard.writeText(shareUrl).then(
                () => {
                    setCopySuccess(true);
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
        }
    };

    const handleDelete = async (item, event) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (window.confirm(translations[currentLanguage].confirmDelete)) {
            try {
                await axios.delete(`http://localhost:8083/api/chatbot/historique/${item.id}`);
                setHistorique(prevHistorique =>
                    prevHistorique.filter(histItem => histItem.id !== item.id)
                );
                alert(translations[currentLanguage].deleteSuccess);
            } catch (err) {
                console.error("Erreur lors de la suppression:", err);
                alert(`Erreur lors de la suppression: ${err.response?.data?.message || err.message}`);
            }
        }
        setActiveMenu(null);
    };

    const handleNewConversation = () => {
        setMessages([{ type: 'bot', content: translations[currentLanguage].greeting }]);
        setInput('');
        setError(null);
        setIsLoading(false);
        setActiveMenu(null);
        setIsRenaming(false);
        setNewTitle('');
        setCurrentItem(null);
        setSharePopupVisible(false);
        setShareUrl('');
        setCopySuccess(false);
    };

    const handleLanguageChange = (lang) => {
        setCurrentLanguage(lang);
        setShowProfile(false);
    };

    const handleProfileUpdate = (field, value) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setUserProfile(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setUserProfile(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    // Gestion du changement d'avatar
    const handleAvatarChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUserProfile(prev => ({
                    ...prev,
                    avatar: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Gestion de la déconnexion
    const handleLogout = () => {
        if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            // Ici vous pourriez faire un appel API pour déconnecter
            // Puis rediriger vers la page de connexion
            navigate('/login');
        }
    };

    const t = translations[currentLanguage];

    return (
        <div className={`chatbot-container ${currentLanguage === 'ar' ? 'rtl' : 'ltr'} theme-${userProfile.theme} font-${userProfile.preferences.fontSize}`}>
            <div className="chatbot-header">
                <div className="header-content">
                    <h1>{t.title}</h1>
                    
                    {/* Section Profil améliorée */}
                    <div className="profile-section">
                        <button 
                            className="profile-button"
                            onClick={() => setShowProfile(!showProfile)}
                        >
                            {userProfile.avatar ? (
                                <img src={userProfile.avatar} alt="Avatar" className="avatar" />
                            ) : (
                                <div 
                                    className="avatar-placeholder"
                                    style={{ backgroundColor: getAvatarColor(userProfile.name) }}
                                >
                                    {getInitials(userProfile.name)}
                                </div>
                            )}
                            <div className="profile-info">
                                <span className="profile-name">{userProfile.name}</span>
                                <span className="profile-role">{userProfile.role}</span>
                            </div>
                            <span className="dropdown-arrow">▼</span>
                        </button>

                        {showProfile && (
                            <div className="profile-dropdown">
                                <div className="profile-header">
                                    <div className="profile-avatar-section">
                                        {userProfile.avatar ? (
                                            <img src={userProfile.avatar} alt="Avatar" className="profile-avatar-large" />
                                        ) : (
                                            <div 
                                                className="avatar-placeholder-large"
                                                style={{ backgroundColor: getAvatarColor(userProfile.name) }}
                                            >
                                                {getInitials(userProfile.name)}
                                            </div>
                                        )}
                                        <button 
                                            className="change-avatar-btn"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            📷
                                        </button>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef}
                                            onChange={handleAvatarChange}
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                    <div className="profile-details">
                                        <h3>{userProfile.name}</h3>
                                        <p className="profile-email">{userProfile.email}</p>
                                        <span className="profile-status active">{userProfile.status}</span>
                                    </div>
                                </div>

                                <div className="profile-stats">
                                    <div className="stat-item">
                                        <span className="stat-number">{userProfile.stats.totalConversations}</span>
                                        <span className="stat-label">Conversations</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-number">{userProfile.stats.totalQuestions}</span>
                                        <span className="stat-label">Questions</span>
                                    </div>
                                </div>
                                
                                <div className="profile-quick-settings">
                                    <div className="setting-item">
                                        <label>{t.language}:</label>
                                        <select 
                                            value={currentLanguage} 
                                            onChange={(e) => handleLanguageChange(e.target.value)}
                                        >
                                            <option value="fr">🇫🇷 Français</option>
                                            <option value="en">🇺🇸 English</option>
                                            <option value="ar">🇲🇦 العربية</option>
                                        </select>
                                    </div>
                                    
                                    <div className="setting-item">
                                        <label>{t.theme}:</label>
                                        <select 
                                            value={userProfile.theme} 
                                            onChange={(e) => handleProfileUpdate('theme', e.target.value)}
                                        >
                                            <option value="light">☀️ {t.lightMode}</option>
                                            <option value="dark">🌙 {t.darkMode}</option>
                                            <option value="auto">🔄 {t.autoMode}</option>
                                        </select>
                                    </div>
                                </div>
                                
                               
                            </div>
                        )}
                    </div>
                </div>
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
                            {userProfile.preferences.showTimestamps && (
                                <div className="message-timestamp">
                                    {new Date().toLocaleTimeString()}
                                </div>
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
                    <h3>{t.history}</h3>
                    <button className="new-conversation-button" onClick={handleNewConversation}>
                        {t.newConversation}
                    </button>
                    
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
                                <button onClick={handleRename}>{t.save}</button>
                                <button onClick={() => {
                                    setIsRenaming(false);
                                    setNewTitle('');
                                    setCurrentItem(null);
                                }}>{t.cancel}</button>
                            </div>
                        </div>
                    )}
                    
                    <div className="historique-list">
                        {historique.length === 0 ? (
                            <p>{t.noHistory}</p>
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
                                                : item.question || t.unknownQuestion}
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
                                                        <span className="menu-icon">📤</span> {t.share}
                                                    </button>
                                                    <button onClick={(e) => startRenaming(item, e)}>
                                                        <span className="menu-icon">✏️</span> {t.rename}
                                                    </button>
                                                    <button onClick={(e) => handleDelete(item, e)}>
                                                        <span className="menu-icon">🗑️</span> {t.delete}
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
                    placeholder={t.placeholder}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button onClick={handleSendMessage} disabled={isLoading}>
                    {t.send}
                </button>
            </div>

            {/* Popup de partage */}
            {sharePopupVisible && (
                <>
                    <div className="overlay" onClick={closeSharePopup}></div>
                    <div className="share-popup">
                        <div className="share-popup-header">
                            <h3>{t.shareTitle}</h3>
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
                                {copySuccess ? t.copied : t.copy}
                            </button>
                        </div>
                        {copySuccess && (
                            <div className="share-link-success">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#00a388" />
                                </svg>
                                {t.linkCopied}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ChatbotPage;