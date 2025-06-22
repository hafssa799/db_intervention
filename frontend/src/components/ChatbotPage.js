"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import moment from "moment"
import "./ChatbotPage.css"

// Dictionnaire des traductions
const translations = {
  fr: {
    title: "Assistant Technique OCP",
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
    noSolution:
      "Je suis désolé, je n'ai pas trouvé de solution à votre problème. Je vous redirige vers la page de création d'une demande...",
    profile: "Profil",
    settings: "Paramètres",
    language: "Langue",
    theme: "Thème",
    logout: "Déconnexion",
    cancel: "Annuler",
    save: "Sauvegarder",
    darkMode: "Mode sombre",
    lightMode: "Mode clair",
    autoMode: "Mode automatique",
  },
  en: {
    title: "OCP Technical Assistant",
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
    noSolution:
      "I'm sorry, I couldn't find a solution to your problem. I'm redirecting you to the request creation page...",
    profile: "Profile",
    settings: "Settings",
    language: "Language",
    theme: "Theme",
    logout: "Logout",
    cancel: "Cancel",
    save: "Save",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    autoMode: "Auto Mode",
  },
  ar: {
    title: "مساعد OCP التقني",
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
    darkMode: "الوضع الداكن",
    lightMode: "الوضع الفاتح",
    autoMode: "الوضع التلقائي",
  },
}

const ChatbotPage = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [historique, setHistorique] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState("")
  const [activeMenu, setActiveMenu] = useState(null)
  const [isRenaming, setIsRenaming] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [currentItem, setCurrentItem] = useState(null)
  const [sharePopupVisible, setSharePopupVisible] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [copySuccess, setCopySuccess] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // États pour les nouvelles fonctionnalités
  const [currentLanguage, setCurrentLanguage] = useState("fr")
  const [showProfile, setShowProfile] = useState(false)

  // Profil utilisateur
  const [userProfile, setUserProfile] = useState({
    name: "Ahmed Benali",
    email: "ahmed.benali@ocp.ma",
    avatar: null,
    theme: "light",
    joinDate: "2024-01-15",
    lastLogin: new Date().toISOString(),
    role: "Demandeur",
    department: "Service Technique",
    phone: "+212 6 12 34 56 78",
    location: "Casablanca, Maroc",
    status: "Actif",
    preferences: {
      emailNotifications: true,
      soundNotifications: false,
      desktopNotifications: true,
      fontSize: "medium",
      autoSave: true,
      showTimestamps: true,
      compactMode: false,
    },
    stats: {
      totalConversations: 0,
      totalQuestions: 0,
      averageResponseTime: "2.3s",
      favoriteTopics: ["Installation", "Configuration", "Dépannage"],
    },
  })

  const conversationRef = useRef(null)
  const shareInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const api = axios.create({
    baseURL: "http://localhost:8083",
    headers: { "Content-Type": "application/json" },
  })

  // Gestionnaire de défilement pour l'animation de la navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Récupérer les initiales du nom
  const getInitials = (name) => {
    return name.trim().charAt(0).toUpperCase()
  }

  // Générer une couleur basée sur le nom
  const getAvatarColor = (name) => {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA726",
      "#AB47BC",
      "#26A69A",
      "#EF5350",
      "#42A5F5",
      "#66BB6A",
      "#FF7043",
    ]
    return colors[name.charCodeAt(0) % colors.length]
  }

  // Initialiser les messages avec la langue actuelle
  useEffect(() => {
    setMessages([
      {
        type: "bot",
        content: translations[currentLanguage].greeting,
      },
    ])
  }, [currentLanguage])

  useEffect(() => {
    fetchHistorique()
    loadUserProfile()
  }, [])

  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight
    }
  }, [messages])

  // Effet pour les messages de succès - disparition après 3 secondes
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("")
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Effet pour les messages d'erreur - disparition après 3 secondes
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("")
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Gestionnaire pour fermer les menus et popups
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeMenu !== null && !event.target.closest(".menu-container")) {
        setActiveMenu(null)
      }
      if (showProfile && !event.target.closest(".profile-dropdown") && !event.target.closest(".profile-button")) {
        setShowProfile(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [activeMenu, showProfile])

  // Focus sur l'input de partage quand le popup est visible
  useEffect(() => {
    if (sharePopupVisible && shareInputRef.current) {
      shareInputRef.current.select()
    }
  }, [sharePopupVisible])

  // Charger le profil utilisateur
  const loadUserProfile = async () => {
    try {
      const userData = {
        name: "Mohamed Alami",
        email: "mohamed.alami@ocp.ma",
        role: "Demandeur",
        department: "Service Technique",
        phone: "+212 6 12 34 56 78",
        location: "Casablanca, Maroc",
        joinDate: "2023-09-15",
        lastLogin: new Date().toISOString(),
        status: "Actif",
      }

      setUserProfile((prev) => ({
        ...prev,
        ...userData,
      }))

      updateUserStats()
    } catch (error) {
      console.error("Erreur lors du chargement du profil:", error)
    }
  }

  // Mettre à jour les statistiques utilisateur
  const updateUserStats = () => {
    setUserProfile((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        totalConversations: historique.length,
        totalQuestions: historique.reduce((acc, item) => acc + 1, 0),
      },
    }))
  }

  const fetchHistorique = async () => {
    try {
      const response = await api.get("/api/chatbot/historique")
      if (response.data && Array.isArray(response.data)) {
        setHistorique(response.data)
      } else {
        setError("Erreur de format dans l'historique")
      }
    } catch (err) {
      console.error("Erreur lors du chargement de l'historique:", err)
      setError("Erreur lors du chargement de l'historique")
    }
  }

  const handleSendMessage = async () => {
    if (input.trim() === "") return

    const userMessage = input.trim()
    setMessages((prev) => [...prev, { type: "user", content: userMessage }])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      const response = await api.post("/api/chatbot/question", {
        question: userMessage,
        language: currentLanguage,
      })

      const botResponse = response?.data?.reponse?.trim()
      if (
        !botResponse ||
        botResponse.toLowerCase().includes("je ne sais pas") ||
        botResponse.toLowerCase().includes("i don't know") ||
        botResponse.toLowerCase().includes("لا أعرف") ||
        botResponse.toLowerCase().includes("désolé") ||
        botResponse.toLowerCase().includes("sorry") ||
        botResponse.toLowerCase().includes("آسف")
      ) {
        const redirectMessage = translations[currentLanguage].noSolution
        setMessages((prev) => [...prev, { type: "bot", content: redirectMessage }])

        setTimeout(() => {
          navigate("/demandeur/demande", {
            state: { description: userMessage },
          })
        }, 3000)
      } else {
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            content: botResponse,
            isHTML: botResponse.includes("<"),
          },
        ])
      }

      fetchHistorique()
    } catch (err) {
      console.error("Erreur lors de l'envoi de la question:", err)
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content: translations[currentLanguage].errorOccurred,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleHistoryItemClick = (item) => {
    if (!item?.question) return
    setMessages([
      { type: "bot", content: translations[currentLanguage].greeting },
      { type: "user", content: item.question },
      {
        type: "bot",
        content: item.reponse || "Pas de réponse disponible",
        isHTML: item.reponse?.includes("<"),
      },
    ])
  }

  const generateShareableUrl = (itemId) => {
    const baseUrl = window.location.origin
    return `${baseUrl}/conversation/${itemId}`
  }

  const toggleMenu = (index, event) => {
    event.preventDefault()
    event.stopPropagation()
    setActiveMenu(activeMenu === index ? null : index)
  }

  const handleShare = (item) => {
    const shareableUrl = generateShareableUrl(item.id)
    setShareUrl(shareableUrl)
    setSharePopupVisible(true)
    setActiveMenu(null)
    setCopySuccess(false)
  }

  const handleCopyLink = () => {
    if (shareInputRef.current) {
      shareInputRef.current.select()
      navigator.clipboard.writeText(shareUrl).then(
        () => {
          setCopySuccess(true)
          setTimeout(() => setCopySuccess(false), 3000)
        },
        (err) => {
          console.error("Erreur lors de la copie :", err)
          setCopySuccess(false)
        },
      )
    }
  }

  const closeSharePopup = () => {
    setSharePopupVisible(false)
  }

  const startRenaming = (item, event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    setIsRenaming(true)
    setNewTitle(item.question)
    setCurrentItem(item)
    setActiveMenu(null)
  }

  const handleRename = async () => {
    if (!currentItem || !newTitle.trim()) {
      setIsRenaming(false)
      return
    }

    try {
      await api.put(`/api/chatbot/historique/${currentItem.id}`, {
        question: newTitle.trim(),
        reponse: currentItem.reponse,
        dateCreation: currentItem.dateCreation,
      })

      setHistorique((prevHistorique) =>
        prevHistorique.map((item) => (item.id === currentItem.id ? { ...item, question: newTitle.trim() } : item)),
      )

      setIsRenaming(false)
      setNewTitle("")
      setCurrentItem(null)
      setSuccessMessage("Conversation renommée avec succès")
    } catch (err) {
      console.error("Erreur lors du renommage:", err)
      setError(`Erreur lors du renommage: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleDelete = async (item, event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    if (window.confirm(translations[currentLanguage].confirmDelete)) {
      try {
        await api.delete(`/api/chatbot/historique/${item.id}`)
        setHistorique((prevHistorique) => prevHistorique.filter((histItem) => histItem.id !== item.id))
        setSuccessMessage(translations[currentLanguage].deleteSuccess)
      } catch (err) {
        console.error("Erreur lors de la suppression:", err)
        setError(`Erreur lors de la suppression: ${err.response?.data?.message || err.message}`)
      }
    }
    setActiveMenu(null)
  }

  const handleNewConversation = () => {
    setMessages([{ type: "bot", content: translations[currentLanguage].greeting }])
    setInput("")
    setError(null)
    setIsLoading(false)
    setActiveMenu(null)
    setIsRenaming(false)
    setNewTitle("")
    setCurrentItem(null)
    setSharePopupVisible(false)
    setShareUrl("")
    setCopySuccess(false)
  }

  const handleLanguageChange = (lang) => {
    setCurrentLanguage(lang)
    setShowProfile(false)
  }

  const handleProfileUpdate = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".")
      setUserProfile((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }))
    } else {
      setUserProfile((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const handleAvatarChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUserProfile((prev) => ({
          ...prev,
          avatar: reader.result,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLogout = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      navigate("/login")
    }
  }

  const changeLanguage = (lang) => {
    setCurrentLanguage(lang)
  }

  const t = translations[currentLanguage]

  return (
    <div className="ocp-admin-app-container">
      {/* Header avec navbar OCP */}
      <header className={`ocp-admin-header ${scrolled ? "ocp-admin-header-scrolled" : ""}`}>
        <div className="ocp-admin-navbar">
          <div className="ocp-admin-logo">
            <img src="https://ammoniaenergy.org/wp-content/uploads/2019/09/OCP_Group.svg.png" alt="Logo OCP" />
          </div>
          
          
          <div className="ocp-admin-search-icon">
            <i className="fa fa-search"></i>
          </div>
        </div>
      </header>

      {/* Hero Section inspirée des dunes OCP */}
      <section className="ocp-admin-hero-section-chatbot">
        <div className="ocp-admin-hero-content">
          <h1>{t.title}</h1>
          <p>Intelligence artificielle au service de la maintenance</p>
          <p className="ocp-admin-hero-description">
            Assistant virtuel intelligent pour le support technique et la résolution de problèmes avec redirection
            automatique vers la création de demandes d'intervention.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="ocp-admin-breadcrumb">
        <div className="ocp-admin-breadcrumb-content">
          <a href="#" onClick={() => navigate("/demandeur/dashboard")}>
            Dashboard
          </a>
          <span>&gt;</span>
          <span className="ocp-admin-current">Assistant Technique</span>
        </div>
      </div>

      {/* Messages de notification */}
      {successMessage && (
        <div className="ocp-admin-success-message ocp-admin-animate-slide-in">
          <i className="fas fa-check-circle"></i>
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="ocp-admin-error-message ocp-admin-animate-slide-in">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Contenu principal */}
      <div className="ocp-admin-main-content">
        <div className="ocp-admin-container">
          <div className="ocp-admin-chatbot-layout">
            {/* Section Chat */}
            <div className="ocp-admin-chat-section">
              <div className="ocp-admin-chat-header">
                <div className="ocp-admin-chat-title">
                  <i className="fas fa-robot"></i>
                  <h3>Conversation</h3>
                </div>
                <div className="ocp-admin-profile-section">
                  <button className="ocp-admin-profile-button" onClick={() => setShowProfile(!showProfile)}>
                    {userProfile.avatar ? (
                      <img src={userProfile.avatar || "/placeholder.svg"} alt="Avatar" className="ocp-admin-avatar" />
                    ) : (
                      <div
                        className="ocp-admin-avatar-placeholder"
                        style={{ backgroundColor: getAvatarColor(userProfile.name) }}
                      >
                        {getInitials(userProfile.name)}
                      </div>
                    )}
                    <div className="ocp-admin-profile-info">
                      <span className="ocp-admin-profile-name">{userProfile.name}</span>
                      <span className="ocp-admin-profile-role">{userProfile.role}</span>
                    </div>
                    <span className="ocp-admin-dropdown-arrow">▼</span>
                  </button>

                  {showProfile && (
                    <div className="ocp-admin-profile-dropdown">
                      <div className="ocp-admin-profile-header">
                        <div className="ocp-admin-profile-avatar-section">
                          {userProfile.avatar ? (
                            <img
                              src={userProfile.avatar || "/placeholder.svg"}
                              alt="Avatar"
                              className="ocp-admin-profile-avatar-large"
                            />
                          ) : (
                            <div
                              className="ocp-admin-avatar-placeholder-large"
                              style={{ backgroundColor: getAvatarColor(userProfile.name) }}
                            >
                              {getInitials(userProfile.name)}
                            </div>
                          )}
                          <button className="ocp-admin-change-avatar-btn" onClick={() => fileInputRef.current?.click()}>
                            📷
                          </button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarChange}
                            accept="image/*"
                            style={{ display: "none" }}
                          />
                        </div>
                        <div className="ocp-admin-profile-details">
                          <h3>{userProfile.name}</h3>
                          <p className="ocp-admin-profile-email">{userProfile.email}</p>
                          <span className="ocp-admin-profile-status active">{userProfile.status}</span>
                        </div>
                      </div>

                      <div className="ocp-admin-profile-stats">
                        <div className="ocp-admin-stat-item">
                          <span className="ocp-admin-stat-number">{userProfile.stats.totalConversations}</span>
                          <span className="ocp-admin-stat-label">Conversations</span>
                        </div>
                        <div className="ocp-admin-stat-item">
                          <span className="ocp-admin-stat-number">{userProfile.stats.totalQuestions}</span>
                          <span className="ocp-admin-stat-label">Questions</span>
                        </div>
                      </div>

                      <div className="ocp-admin-profile-quick-settings">
                        <div className="ocp-admin-setting-item">
                          <label>{t.language}:</label>
                          <select value={currentLanguage} onChange={(e) => handleLanguageChange(e.target.value)}>
                            <option value="fr">🇫🇷 Français</option>
                            <option value="en">🇺🇸 English</option>
                            <option value="ar">🇲🇦 العربية</option>
                          </select>
                        </div>

                        <div className="ocp-admin-setting-item">
                          <label>{t.theme}:</label>
                          <select
                            value={userProfile.theme}
                            onChange={(e) => handleProfileUpdate("theme", e.target.value)}
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

              <div className="ocp-admin-conversation" ref={conversationRef}>
                {messages.map((msg, i) => (
                  <div key={i} className={`ocp-admin-message ocp-admin-${msg.type}-message`}>
                    <div className="ocp-admin-message-avatar">
                      {msg.type === "bot" ? (
                        <div className="ocp-admin-bot-avatar">
                          <i className="fas fa-robot"></i>
                        </div>
                      ) : (
                        <div
                          className="ocp-admin-user-avatar"
                          style={{ backgroundColor: getAvatarColor(userProfile.name) }}
                        >
                          {getInitials(userProfile.name)}
                        </div>
                      )}
                    </div>
                    <div className="ocp-admin-message-content">
                      {msg.isHTML ? (
                        <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                      ) : (
                        <div>{msg.content}</div>
                      )}
                      {userProfile.preferences.showTimestamps && (
                        <div className="ocp-admin-message-timestamp">{moment().format("HH:mm")}</div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="ocp-admin-message ocp-admin-bot-message">
                    <div className="ocp-admin-message-avatar">
                      <div className="ocp-admin-bot-avatar">
                        <i className="fas fa-robot"></i>
                      </div>
                    </div>
                    <div className="ocp-admin-message-content">
                      <div className="ocp-admin-typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="ocp-admin-chat-input">
                <div className="ocp-admin-input-container">
                  <input
                    type="text"
                    placeholder={t.placeholder}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    disabled={isLoading}
                  />
                  <button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
                    <i className="fas fa-paper-plane"></i>
                    <span>{t.send}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Section Historique */}
            <div className="ocp-admin-history-section">
              <div className="ocp-admin-history-header">
                <h3>
                  <i className="fas fa-history"></i>
                  {t.history}
                </h3>
                <button className="ocp-admin-btn ocp-admin-btn-primary" onClick={handleNewConversation}>
                  <i className="fas fa-plus"></i>
                  {t.newConversation}
                </button>
              </div>

              {isRenaming && (
                <div className="ocp-admin-rename-dialog">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleRename()}
                    autoFocus
                  />
                  <div className="ocp-admin-rename-actions">
                    <button className="ocp-admin-btn ocp-admin-btn-primary" onClick={handleRename}>
                      {t.save}
                    </button>
                    <button
                      className="ocp-admin-btn ocp-admin-btn-secondary"
                      onClick={() => {
                        setIsRenaming(false)
                        setNewTitle("")
                        setCurrentItem(null)
                      }}
                    >
                      {t.cancel}
                    </button>
                  </div>
                </div>
              )}

              <div className="ocp-admin-history-list">
                {historique.length === 0 ? (
                  <div className="ocp-admin-empty-history">
                    <i className="fas fa-comments"></i>
                    <p>{t.noHistory}</p>
                  </div>
                ) : (
                  historique.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="ocp-admin-history-item"
                      onClick={() => handleHistoryItemClick(item)}
                    >
                      <div className="ocp-admin-history-content">
                        <div className="ocp-admin-history-question">
                          {item.question?.length > 30
                            ? `${item.question.substring(0, 30)}...`
                            : item.question || t.unknownQuestion}
                        </div>
                        <div className="ocp-admin-history-timestamp">
                          {item.dateCreation && moment(item.dateCreation).format("DD/MM/YYYY HH:mm")}
                        </div>
                      </div>

                      <div className="ocp-admin-history-actions">
                        <div className="ocp-admin-menu-container">
                          <button
                            className="ocp-admin-menu-dots"
                            onClick={(e) => toggleMenu(index, e)}
                            aria-label="Options"
                          >
                            ⋮
                          </button>

                          {activeMenu === index && (
                            <div className="ocp-admin-menu-dropdown">
                              <button onClick={() => handleShare(item)}>
                                <span className="ocp-admin-menu-icon">📤</span> {t.share}
                              </button>
                              <button onClick={(e) => startRenaming(item, e)}>
                                <span className="ocp-admin-menu-icon">✏️</span> {t.rename}
                              </button>
                              <button onClick={(e) => handleDelete(item, e)}>
                                <span className="ocp-admin-menu-icon">🗑️</span> {t.delete}
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
        </div>
      </div>

      {/* Popup de partage */}
      {sharePopupVisible && (
        <>
          <div className="ocp-admin-modal-overlay" onClick={closeSharePopup}></div>
          <div className="ocp-admin-share-popup">
            <div className="ocp-admin-share-popup-header">
              <h3>{t.shareTitle}</h3>
              <button className="ocp-admin-btn-close" onClick={closeSharePopup}>
                ×
              </button>
            </div>
            <div className="ocp-admin-share-link-container">
              <input ref={shareInputRef} type="text" value={shareUrl} readOnly />
              <button className="ocp-admin-btn ocp-admin-btn-primary" onClick={handleCopyLink}>
                {copySuccess ? t.copied : t.copy}
              </button>
            </div>
            {copySuccess && (
              <div className="ocp-admin-share-link-success">
                <i className="fas fa-check-circle"></i>
                {t.linkCopied}
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer style OCP */}
      <footer className="ocp-admin-footer">
        <div className="ocp-admin-footer-content">
          <div className="ocp-admin-footer-logo">
            <img src="https://ammoniaenergy.org/wp-content/uploads/2019/09/OCP_Group.svg.png" alt="Logo OCP" />
          </div>
          <div className="ocp-admin-footer-links">
            <div className="ocp-admin-footer-column">
              <h4>OCP en action</h4>
              <a href="#">À propos</a>
              <a href="#">Stratégie</a>
              <a href="#">Produits et solutions</a>
              <a href="#">Investisseurs</a>
              <a href="#">Médias</a>
              <a href="#">Carrières</a>
              <a href="#">Contact</a>
            </div>
            <div className="ocp-admin-footer-column">
              <h4>Pages populaires</h4>
              <a href="#">Innovation</a>
              <a href="#">Qu'est-ce que le phosphate ?</a>
              <a href="#">Processus de customisation</a>
              <a href="#">Histoire</a>
              <a href="#">Mission et vision</a>
            </div>
            <div className="ocp-admin-footer-column">
              <h4>Stories</h4>
              <a href="#">Codification, créativité et liberté</a>
              <a href="#">Un sport, des milliers de vies changées transformées</a>
              <a href="#">Une nouvelle culture, un nouvel avenir</a>
            </div>
          </div>
        </div>
        <div className="ocp-admin-footer-bottom">
          <div className="ocp-admin-social-icons">
            <a href="#">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="#">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#">
              <i className="fab fa-linkedin-in"></i>
            </a>
            <a href="#">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="#">
              <i className="fab fa-youtube"></i>
            </a>
          </div>
          <div className="ocp-admin-copyright">
            <p>© OCP Group 2023</p>
            <a href="#">Fournisseurs</a>
            <a href="#">Mentions légales</a>
            <a href="#">Conditions d'utilisation</a>
            <a href="#">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default ChatbotPage
