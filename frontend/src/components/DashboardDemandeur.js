"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"
import "./DashboardDemandeur.css"
import jsPDF from "jspdf"

function DashboardDemandeur() {
  const navigate = useNavigate()
  const [demandes, setDemandes] = useState([])
  const [filteredDemandes, setFilteredDemandes] = useState([])
  const [filterStatus, setFilterStatus] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [pendingAction, setPendingAction] = useState(null)
  const [globalProgress, setGlobalProgress] = useState(0)
  const [showProgressBar, setShowProgressBar] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState({ message: "", type: "" })
  const [affectations, setAffectations] = useState([])
  const [scrolled, setScrolled] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState("FR")
  const [searchParams, setSearchParams] = useState({
    searchField: "description",
    searchValue: "",
  })

  // Gestionnaire de défilement pour l'animation de la navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    loadDemandes()
    const interval = setInterval(checkForNewAffectations, 30000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    applyFilters()
  }, [demandes, searchParams, filterStatus])

  // Effet pour les messages - disparition après 3 secondes
  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => {
        setNotification({ message: "", type: "" })
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const applyFilters = () => {
    let filtered = [...demandes]

    // Filtre par statut
    if (filterStatus !== "all") {
      filtered = filtered.filter((demande) => demande.statusIntervention === filterStatus)
    }

    // Filtre par recherche
    if (searchParams.searchValue && searchParams.searchValue.trim() !== "") {
      const searchTerm = searchParams.searchValue.toLowerCase().trim()

      filtered = filtered.filter((demande) => {
        if (searchParams.searchField === "description") {
          return (demande.description || "").toLowerCase().includes(searchTerm)
        } else if (searchParams.searchField === "equipement") {
          return (demande.equipement || "").toLowerCase().includes(searchTerm)
        } else if (searchParams.searchField === "technicien") {
          return (demande.technicien || "").toLowerCase().includes(searchTerm)
        }
        return true
      })
    }

    setFilteredDemandes(filtered)
  }

  const handleSearchChange = (e) => {
    const { name, value } = e.target
    setSearchParams((prev) => ({ ...prev, [name]: value }))
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    applyFilters()
  }

  const resetFilters = () => {
    setSearchParams({ searchField: "description", searchValue: "" })
    setFilterStatus("all")
  }

  function generatePDFBlob(intervention) {
    const doc = new jsPDF()

    // Palette de couleurs inspirée d'OCP
    const primaryColor = "#2E7D32"
    const secondaryColor = "#4CAF50"
    const accentColor = "#8BC34A"
    const darkText = "#263238"
    const lightText = "#607D8B"
    const white = "#FFFFFF"

    const pageWidth = doc.internal.pageSize.width
    const margin = 15
    const contentWidth = pageWidth - 2 * margin
    let yPosition = 20

    // En-tête avec logo
    doc.setFillColor(primaryColor)
    doc.rect(0, 0, pageWidth, 60, "F")

    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(white)
    doc.text("OCP", margin, 30)

    doc.setFontSize(12)
    doc.text("Office Chérifien des Phosphates", margin, 38)

    doc.setDrawColor(accentColor)
    doc.setLineWidth(0.5)
    doc.line(margin, 45, pageWidth - margin, 45)

    // Titre principal
    yPosition = 70
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(primaryColor)
    doc.text("RAPPORT D'INTERVENTION TECHNIQUE", pageWidth / 2, yPosition, { align: "center" })

    doc.setFontSize(14)
    doc.setTextColor(secondaryColor)
    doc.text(
      `Référence : INT-${intervention.id?.toString().padStart(5, "0") || "N/A"}`,
      pageWidth / 2,
      yPosition + 10,
      { align: "center" },
    )

    // Section Informations Générales
    yPosition += 25
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(white)
    doc.setFillColor(secondaryColor)
    doc.rect(margin, yPosition - 5, contentWidth, 8, "F")
    doc.text("1. INFORMATIONS GÉNÉRALES", margin + 5, yPosition)

    yPosition += 10
    doc.setFont("helvetica", "normal")
    doc.setTextColor(darkText)

    const addDataRow = (label, value, offset = 0) => {
      const displayValue = value || "Non spécifié"
      doc.setFont("helvetica", "bold")
      doc.text(`${label}:`, margin + offset, yPosition)
      doc.setFont("helvetica", "normal")
      doc.text(displayValue, margin + offset + 30, yPosition)
      yPosition += 6
    }

    addDataRow("Date de création", intervention.date ? formatDate(intervention.date) : "Non spécifiée")
    addDataRow("Statut", getStatusText(intervention.statusIntervention))
    addDataRow("Priorité", intervention.priority)

    const demandeurName = intervention.idDemandeur
      ? `${intervention.idDemandeur.prenom || ""} ${intervention.idDemandeur.nom || ""}`.trim()
      : "Non spécifié"
    addDataRow("Demandeur", demandeurName)

    // Section Description
    yPosition += 5
    doc.setFont("helvetica", "bold")
    doc.setTextColor(white)
    doc.setFillColor(secondaryColor)
    doc.rect(margin, yPosition - 5, contentWidth, 8, "F")
    doc.text("2. DESCRIPTION DE L'INTERVENTION", margin + 5, yPosition)

    yPosition += 10
    doc.setFont("helvetica", "normal")
    doc.setTextColor(darkText)
    const description = intervention.description || "Aucune description fournie"
    const splitDescription = doc.splitTextToSize(description, contentWidth)
    doc.text(splitDescription, margin, yPosition)
    yPosition += splitDescription.length * 6 + 5

    // Section Équipement
    doc.setFont("helvetica", "bold")
    doc.setTextColor(white)
    doc.setFillColor(secondaryColor)
    doc.rect(margin, yPosition - 5, contentWidth, 8, "F")
    doc.text("3. ÉQUIPEMENT CONCERNÉ", margin + 5, yPosition)

    yPosition += 10
    doc.setFont("helvetica", "normal")
    doc.setTextColor(darkText)

    addDataRow("Type", intervention.equipement)
    addDataRow("Statut", intervention.statusEquipement)
    addDataRow("Localisation", intervention.localisation)
    addDataRow("Numéro de série", intervention.numeroSerie || "N/A")

    // Section Technicien
    yPosition += 5
    doc.setFont("helvetica", "bold")
    doc.setTextColor(white)
    doc.setFillColor(secondaryColor)
    doc.rect(margin, yPosition - 5, contentWidth, 8, "F")
    doc.text("4. TECHNICIEN ASSIGNÉ", margin + 5, yPosition)

    yPosition += 10
    doc.setFont("helvetica", "normal")
    doc.setTextColor(darkText)

    addDataRow("Nom", intervention.technicien)
    addDataRow("Matricule", intervention.matriculeTechnicien || "N/A")
    addDataRow("Date intervention", formatDate(intervention.dateIntervention || new Date()))

    // Pied de page
    const footerY = doc.internal.pageSize.height - 20
    doc.setFontSize(10)
    doc.setTextColor(lightText)
    doc.setFont("helvetica", "italic")
    doc.text(
      "Document généré automatiquement par le système de gestion des interventions OCP",
      pageWidth / 2,
      footerY,
      { align: "center" },
    )

    doc.text(`Page 1/1`, pageWidth - margin, footerY, { align: "right" })

    // Filigrane
    doc.setFontSize(60)
    doc.setTextColor(230, 230, 230)
    doc.setFont("helvetica", "bold")
    doc.text("OCP", pageWidth / 2, doc.internal.pageSize.height / 2, { align: "center", angle: 45 })

    return doc.output("blob")
  }

  const loadDemandes = async () => {
    setLoading(true)
    try {
      const user = JSON.parse(localStorage.getItem("user"))
      if (!user || !user.idUtilisateur) {
        showNotification("Utilisateur non connecté", "error")
        navigate("/login")
        return
      }
      const response = await api.get(`/api/interventions/demandeur/${user.idUtilisateur}`)

      const transformedData = response.data.map((intervention) => ({
        id: intervention.idIntervention,
        description: intervention.description,
        date: intervention.dateDemande,
        equipement: intervention.equipement
          ? `${intervention.equipement.typeEquipement} - ${intervention.equipement.modele}`
          : "Équipement non défini",
        statusEquipement: intervention.equipement ? intervention.equipement.statut : "Non défini",
        localisation: intervention.localisation || "Non définie",
        technicien: intervention.technicien
          ? `${intervention.technicien.nom} ${intervention.technicien.prenom}`
          : "Non assigné",
        priority: intervention.priorite,
        statusIntervention: mapStatusToUI(intervention.statut),
        statutOriginal: intervention.statut,
        technicienId: intervention.technicien?.idTechnicien || null,
        dateAffectation: intervention.dateAffectation || null,
      }))

      checkForNewAffectations(transformedData)
      setDemandes(transformedData)
      showNotification("Demandes chargées avec succès", "success")
    } catch (error) {
      console.error("Erreur lors du chargement des demandes:", error)
      if (error.response?.status === 401) {
        showNotification("Session expirée, veuillez vous reconnecter", "error")
        navigate("/login")
      } else {
        showNotification("Erreur lors du chargement des demandes", "error")
      }
    } finally {
      setLoading(false)
    }
  }

  const checkForNewAffectations = async (newDemandes = null) => {
    try {
      const currentDemandes = newDemandes || demandes
      const previousAffectations = JSON.parse(localStorage.getItem("previousAffectations") || "[]")

      const nouvellesAffectations = []

      currentDemandes.forEach((demande) => {
        if (demande.technicienId && demande.technicien !== "Non assigné") {
          const previousAffectation = previousAffectations.find((prev) => prev.id === demande.id)

          if (!previousAffectation || previousAffectation.technicienId !== demande.technicienId) {
            nouvellesAffectations.push({
              id: demande.id,
              technicien: demande.technicien,
              description: demande.description,
              dateAffectation: new Date().toISOString(),
            })
          }
        }
      })

      if (nouvellesAffectations.length > 0) {
        nouvellesAffectations.forEach((affectation) => {
          showNotification(`📋 Demande #${affectation.id} assignée au technicien ${affectation.technicien}`, "info")
        })

        setAffectations((prev) => [...prev, ...nouvellesAffectations])
      }

      const currentAffectations = currentDemandes
        .filter((d) => d.technicienId && d.technicien !== "Non assigné")
        .map((d) => ({
          id: d.id,
          technicienId: d.technicienId,
          technicien: d.technicien,
        }))

      localStorage.setItem("previousAffectations", JSON.stringify(currentAffectations))
    } catch (error) {
      console.error("Erreur lors de la vérification des affectations:", error)
    }
  }

  const mapStatusToUI = (apiStatus) => {
    switch (apiStatus) {
      case "EN_ATTENTE":
        return "not-sent"
      case "EN_COURS":
        return "generating"
      case "TERMINEE":
        return "sent"
      case "ANNULEE":
        return "not-sent"
      default:
        return "not-sent"
    }
  }

  const getStatusClass = (statusIntervention) => {
    switch (statusIntervention) {
      case "sent":
        return "ocp-demandeur-status-sent"
      case "generating":
        return "ocp-demandeur-status-generating"
      default:
        return "ocp-demandeur-status-not-sent"
    }
  }

  const getStatusIcon = (statusIntervention) => {
    switch (statusIntervention) {
      case "sent":
        return "✓"
      case "generating":
        return "⏳"
      default:
        return "✗"
    }
  }

  const getStatusTitle = (statusIntervention) => {
    switch (statusIntervention) {
      case "sent":
        return "Document envoyé à l'administration"
      case "generating":
        return "Envoi en cours..."
      default:
        return "En attente d'envoi"
    }
  }

  const getStatusText = (statusIntervention) => {
    switch (statusIntervention) {
      case "sent":
        return "Terminé"
      case "generating":
        return "En cours"
      default:
        return "En attente"
    }
  }

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
    return new Date(dateString).toLocaleDateString("fr-FR", options)
  }

  const showNotification = (message, type = "success") => {
    setNotification({ message, type })
  }

  const showModal = (message, callback) => {
    setModalMessage(message)
    setIsModalOpen(true)
    setPendingAction(() => callback)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setPendingAction(null)
  }

  const confirmAction = () => {
    if (pendingAction) {
      pendingAction()
    }
    closeModal()
  }

  const sendToAdmin = async (id) => {
    try {
      const demande = demandes.find((d) => d.id === id)
      if (!demande) {
        showNotification("Demande introuvable", "error")
        return
      }

      setDemandes((prevDemandes) =>
        prevDemandes.map((d) => (d.id === id ? { ...d, statusIntervention: "generating" } : d)),
      )

      const pdfBlob = generatePDFBlob(demande)

      const formData = new FormData()
      formData.append("file", pdfBlob, `Rapport_Intervention_${demande.id}.pdf`)
      formData.append("interventionId", demande.id.toString())
      formData.append("description", demande.description)

      const user = JSON.parse(localStorage.getItem("user"))
      if (user && user.idUtilisateur) {
        formData.append("demandeurId", user.idUtilisateur.toString())
      }

      const response = await api.post("/api/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      if (response.status === 200 || response.status === 201) {
        setDemandes((prevDemandes) => prevDemandes.map((d) => (d.id === id ? { ...d, statusIntervention: "sent" } : d)))

        showNotification("Document envoyé avec succès à l'administration!", "success")
      } else {
        throw new Error("Erreur lors de l'envoi du document")
      }
    } catch (error) {
      console.error("Erreur envoi admin:", error)

      let errorMessage = "Erreur lors de l'envoi du document"
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = "Service de documents non disponible"
        } else if (error.response.status === 500) {
          errorMessage = "Erreur serveur lors de l'envoi"
        } else {
          errorMessage = `Erreur ${error.response.status}: ${error.response.data?.message || "Erreur inconnue"}`
        }
      } else if (error.request) {
        errorMessage = "Impossible de contacter le serveur"
      }

      showNotification(errorMessage, "error")

      setDemandes((prevDemandes) =>
        prevDemandes.map((d) => (d.id === id ? { ...d, statusIntervention: "not-sent" } : d)),
      )
    }
  }

  const generateSinglePDF = async (id) => {
    const demande = demandes.find((d) => d.id === id)
    if (!demande) {
      showNotification("Demande introuvable", "error")
      return
    }

    try {
      const pdfBlob = generatePDFBlob(demande)
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Rapport_Intervention_${demande.id}.pdf`
      a.click()
      URL.revokeObjectURL(url)

      showNotification("PDF téléchargé avec succès!", "success")
    } catch (error) {
      console.error("Erreur génération PDF:", error)
      showNotification("Erreur lors de la génération du PDF", "error")
    }
  }

  const deleteDemande = (id) => {
    showModal("Voulez-vous vraiment supprimer cette demande ?", async () => {
      try {
        const response = await api.delete(`/api/interventions/${id}`)
        setDemandes((prev) => prev.filter((d) => d.id !== id))
        showNotification("Suppression réussie!", "success")
      } catch (error) {
        console.error("Erreur complète:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        })
        showNotification(error.response?.data?.message || "Échec de la suppression", "error")
      }
    })
  }

  const refreshData = () => {
    loadDemandes()
  }

  const changeLanguage = (lang) => {
    setCurrentLanguage(lang)
  }

  const getRecentNotifications = () => {
    const notifications = []

    const recentlyAssigned = demandes.filter((d) => d.technicien !== "Non assigné" && d.statusIntervention !== "sent")

    recentlyAssigned.forEach((demande) => {
      notifications.push({
        id: `Demande #${demande.id.toString().padStart(3, "0")}`,
        message: `Assignée au technicien ${demande.technicien}`,
        icon: "👨‍🔧",
      })
    })

    return notifications.slice(0, 3)
  }

  const totalDocs = demandes.length
  const sentDocs = demandes.filter((demande) => demande.statusIntervention === "sent").length
  const pendingDocs = demandes.filter((demande) => demande.statusIntervention === "not-sent").length
  const assignedDocs = demandes.filter((demande) => demande.technicien !== "Non assigné").length
  const successRate = totalDocs > 0 ? Math.round((sentDocs / totalDocs) * 100) : 0

  return (
    <div className="ocp-demandeur-app-container">
      {/* Header avec navbar OCP */}
      <header className={`ocp-demandeur-header ${scrolled ? "ocp-demandeur-header-scrolled" : ""}`}>
        <div className="ocp-demandeur-navbar">
          <div className="ocp-demandeur-logo">
            <img src="https://ammoniaenergy.org/wp-content/uploads/2019/09/OCP_Group.svg.png" alt="Logo OCP" />
          </div>
         
          
          <div className="ocp-demandeur-search-icon">
            <i className="fa fa-search"></i>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="ocp-demandeur-hero-section">
        <div className="ocp-demandeur-hero-content">
          <h1>Gestion des Demandes d'Intervention</h1>
          <p>Tableau de bord demandeur</p>
          <p className="ocp-demandeur-hero-description">
            Interface de suivi et gestion de vos demandes d'intervention avec fonctionnalités d'export et notifications
            en temps réel pour une gestion efficace de vos équipements OCP.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="ocp-demandeur-breadcrumb">
        <div className="ocp-demandeur-breadcrumb-content">
          <a href="#">Demandeur</a>
          <span>&gt;</span>
          <span className="ocp-demandeur-current">Mes demandes</span>
        </div>
      </div>

      {/* Messages de notification */}
      {notification.message && (
        <div className={`ocp-demandeur-${notification.type}-message ocp-demandeur-animate-slide-in`}>
          <i
            className={`fas ${
              notification.type === "success"
                ? "fa-check-circle"
                : notification.type === "error"
                  ? "fa-exclamation-circle"
                  : "fa-info-circle"
            }`}
          ></i>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Contenu principal */}
      <div className="ocp-demandeur-main-content">
        <div className="ocp-demandeur-container">
          {/* Section Statistiques */}
          <div className="ocp-demandeur-stats-section">
            <div className="ocp-demandeur-stat-card">
              <div className="ocp-demandeur-stat-icon">📋</div>
              <div className="ocp-demandeur-stat-value">{totalDocs}</div>
              <div className="ocp-demandeur-stat-label">Total Demandes</div>
            </div>

            <div className="ocp-demandeur-stat-card">
              <div className="ocp-demandeur-stat-icon">👨‍🔧</div>
              <div className="ocp-demandeur-stat-value">{assignedDocs}</div>
              <div className="ocp-demandeur-stat-label">Assignées</div>
            </div>

            <div className="ocp-demandeur-stat-card">
              <div className="ocp-demandeur-stat-icon">⏳</div>
              <div className="ocp-demandeur-stat-value">{pendingDocs}</div>
              <div className="ocp-demandeur-stat-label">En Attente</div>
            </div>

            <div className="ocp-demandeur-stat-card">
              <div className="ocp-demandeur-stat-icon">📊</div>
              <div className="ocp-demandeur-stat-value">{successRate}%</div>
              <div className="ocp-demandeur-stat-label">Taux de Réussite</div>
            </div>
          </div>

          {/* Section Notifications */}
          <div className="ocp-demandeur-notifications-section">
            <h3>Affectations récentes</h3>
            <div className="ocp-demandeur-notifications-list">
              {getRecentNotifications().length > 0 ? (
                getRecentNotifications().map((notif, index) => (
                  <div key={index} className="ocp-demandeur-notification-item">
                    <span className="ocp-demandeur-notification-icon">{notif.icon}</span>
                    <div className="ocp-demandeur-notification-content">
                      <span className="ocp-demandeur-notification-id">{notif.id}</span>
                      <span className="ocp-demandeur-notification-message"> – {notif.message}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="ocp-demandeur-notification-item">
                  <span className="ocp-demandeur-notification-icon">ℹ️</span>
                  <div className="ocp-demandeur-notification-content">
                    <span className="ocp-demandeur-notification-message">Aucune affectation récente</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="ocp-demandeur-title-section">
            <h2 className="ocp-demandeur-title">Liste des Demandes d'Intervention</h2>
            <div className="ocp-demandeur-title-actions">
              <button
                className="ocp-demandeur-btn ocp-demandeur-btn-secondary"
                onClick={refreshData}
                disabled={loading}
              >
                <i className="fas fa-sync-alt"></i>
                Actualiser
              </button>
              <button
                className="ocp-demandeur-btn ocp-demandeur-btn-primary"
                onClick={() => navigate("/demandeur/demande")}
                disabled={loading}
              >
                <i className="fas fa-plus"></i>
                Nouvelle demande
              </button>
              <button className="ocp-demandeur-btn ocp-demandeur-btn-info" onClick={() => navigate("/chatbot")}>
                <i className="fas fa-comments"></i>
                Besoin d'aide ?
              </button>
            </div>
          </div>

          {/* Barre de filtrage */}
          <div className="ocp-demandeur-search-section">
            <form onSubmit={handleSearchSubmit}>
              <div className="ocp-demandeur-search-filters">
                <div className="ocp-demandeur-filter-group">
                  <label>Champ de recherche</label>
                  <select name="searchField" value={searchParams.searchField} onChange={handleSearchChange}>
                    <option value="description">Description</option>
                    <option value="equipement">Équipement</option>
                    <option value="technicien">Technicien</option>
                  </select>
                </div>

                <div className="ocp-demandeur-filter-group">
                  <label>
                    {searchParams.searchField === "description"
                      ? "Rechercher par description"
                      : searchParams.searchField === "equipement"
                        ? "Rechercher par équipement"
                        : "Rechercher par technicien"}
                  </label>
                  <input
                    type="text"
                    name="searchValue"
                    value={searchParams.searchValue}
                    onChange={handleSearchChange}
                    placeholder={
                      searchParams.searchField === "description"
                        ? "Tapez la description..."
                        : searchParams.searchField === "equipement"
                          ? "Tapez le nom de l'équipement..."
                          : "Tapez le nom du technicien..."
                    }
                  />
                </div>

                <div className="ocp-demandeur-filter-group">
                  <label>Statut</label>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">Tous les statuts</option>
                    <option value="sent">Terminées</option>
                    <option value="not-sent">En attente</option>
                    <option value="generating">En cours</option>
                  </select>
                </div>
              </div>

              <div className="ocp-demandeur-search-buttons">
                <button
                  type="button"
                  className="ocp-demandeur-btn ocp-demandeur-btn-secondary"
                  onClick={resetFilters}
                  disabled={loading}
                >
                  <i className="fas fa-sync-alt"></i>
                  Réinitialiser
                </button>
                <button type="submit" className="ocp-demandeur-btn ocp-demandeur-btn-primary" disabled={loading}>
                  <i className="fas fa-search"></i>
                  Rechercher
                </button>
              </div>
            </form>
          </div>

          {/* Statistiques de filtrage */}
          <div className="ocp-demandeur-filter-stats">
            <p>
              <strong>{filteredDemandes.length}</strong> demande{filteredDemandes.length > 1 ? "s" : ""} affichée
              {filteredDemandes.length > 1 ? "s" : ""} sur <strong>{demandes.length}</strong> au total
              {(searchParams.searchValue || filterStatus !== "all") && (
                <span className="ocp-demandeur-filter-info">
                  (Filtré
                  {searchParams.searchValue ? ` par ${searchParams.searchField}: "${searchParams.searchValue}"` : ""}
                  {filterStatus !== "all" ? ` - Statut: ${getStatusText(filterStatus)}` : ""})
                </span>
              )}
            </p>
          </div>

          {/* Barre de progression */}
          {showProgressBar && (
            <div className="ocp-demandeur-progress-bar">
              <div className="ocp-demandeur-progress-fill" style={{ width: `${globalProgress}%` }}></div>
            </div>
          )}

          {/* Message de chargement */}
          {loading && (
            <div className="ocp-demandeur-loading-message">
              <div className="ocp-demandeur-loading-spinner"></div>
              <p>Chargement des demandes...</p>
            </div>
          )}

          {/* Message aucun résultat */}
          {!loading && filteredDemandes.length === 0 && demandes.length > 0 && (
            <div className="ocp-demandeur-no-results-message">
              <p>Aucune demande trouvée pour les critères de recherche spécifiés.</p>
            </div>
          )}

          {/* Tableau des demandes style OCP */}
          {!loading && filteredDemandes.length > 0 && (
            <div className="ocp-demandeur-table-container ocp-demandeur-animate-slide-in">
              <table className="ocp-demandeur-styled-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Équipement</th>
                    <th>Localisation</th>
                    <th>Technicien</th>
                    <th>Priorité</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDemandes.map((demande) => (
                    <tr key={demande.id}>
                      <td className="ocp-demandeur-number-cell">#{demande.id}</td>
                      <td>
                        <div className="ocp-demandeur-description-cell">
                          {demande.description.length > 50
                            ? `${demande.description.substring(0, 50)}...`
                            : demande.description}
                        </div>
                      </td>
                      <td>{formatDate(demande.date)}</td>
                      <td>
                        <div className="ocp-demandeur-equipment-cell">
                          <div className="ocp-demandeur-equipment-type">{demande.equipement}</div>
                          <div className="ocp-demandeur-equipment-status">{demande.statusEquipement}</div>
                        </div>
                      </td>
                      <td>{demande.localisation}</td>
                      <td>
                        <span
                          className={`ocp-demandeur-technicien-status ${
                            demande.technicien !== "Non assigné"
                              ? "ocp-demandeur-assigned"
                              : "ocp-demandeur-not-assigned"
                          }`}
                        >
                          {demande.technicien}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`ocp-demandeur-priority ocp-demandeur-priority-${demande.priority?.toLowerCase()}`}
                        >
                          {demande.priority}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`ocp-demandeur-status ${getStatusClass(demande.statusIntervention)}`}
                          title={getStatusTitle(demande.statusIntervention)}
                        >
                          {getStatusIcon(demande.statusIntervention)} {getStatusText(demande.statusIntervention)}
                        </span>
                      </td>
                      <td>
                        <div className="ocp-demandeur-action-buttons">
                          <button
                            className="ocp-demandeur-btn ocp-demandeur-btn-export"
                            onClick={() => generateSinglePDF(demande.id)}
                            disabled={demande.statusIntervention === "generating"}
                            title="Télécharger PDF"
                          >
                            <i className="fas fa-file-pdf"></i>
                          </button>

                          <button
                            className="ocp-demandeur-btn ocp-demandeur-btn-delete"
                            onClick={() => deleteDemande(demande.id)}
                            title="Supprimer"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* État vide */}
          {!loading && filteredDemandes.length === 0 && demandes.length === 0 && (
            <div className="ocp-demandeur-empty-state">
              <i className="fas fa-clipboard-list"></i>
              <p>Aucune demande d'intervention trouvée.</p>
              <button
                className="ocp-demandeur-btn ocp-demandeur-btn-primary"
                onClick={() => navigate("/demandeur/demande")}
              >
                Créer votre première demande
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmation */}
      {isModalOpen && (
        <div className="ocp-demandeur-modal-overlay">
          <div className="ocp-demandeur-modal ocp-demandeur-modal-confirm">
            <div className="ocp-demandeur-edit-form-header">
              <h3>Confirmation</h3>
              <button className="ocp-demandeur-btn-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="ocp-demandeur-modal-body">
              <div className="ocp-demandeur-alert-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <p>{modalMessage}</p>
            </div>

            <div className="ocp-demandeur-form-buttons">
              <button className="ocp-demandeur-btn-cancel" onClick={closeModal} disabled={loading}>
                Annuler
              </button>
              <button className="ocp-demandeur-btn ocp-demandeur-btn-delete" onClick={confirmAction} disabled={loading}>
                {loading ? "Suppression..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer style OCP */}
      <footer className="ocp-demandeur-footer">
        <div className="ocp-demandeur-footer-content">
          <div className="ocp-demandeur-footer-logo">
            <img src="https://ammoniaenergy.org/wp-content/uploads/2019/09/OCP_Group.svg.png" alt="Logo OCP" />
          </div>
          <div className="ocp-demandeur-footer-links">
            <div className="ocp-demandeur-footer-column">
              <h4>OCP en action</h4>
              <a href="#">À propos</a>
              <a href="#">Stratégie</a>
              <a href="#">Produits et solutions</a>
              <a href="#">Investisseurs</a>
              <a href="#">Médias</a>
              <a href="#">Carrières</a>
              <a href="#">Contact</a>
            </div>
            <div className="ocp-demandeur-footer-column">
              <h4>Pages populaires</h4>
              <a href="#">Innovation</a>
              <a href="#">Qu'est-ce que le phosphate ?</a>
              <a href="#">Processus de customisation</a>
              <a href="#">Histoire</a>
              <a href="#">Mission et vision</a>
            </div>
            <div className="ocp-demandeur-footer-column">
              <h4>Support</h4>
              <a href="#">Centre d'aide</a>
              <a href="#">Documentation</a>
              <a href="#">Formation</a>
              <a href="#">Contact support</a>
            </div>
          </div>
        </div>
        <div className="ocp-demandeur-footer-bottom">
          <div className="ocp-demandeur-social-icons">
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
          <div className="ocp-demandeur-copyright">
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

export default DashboardDemandeur
