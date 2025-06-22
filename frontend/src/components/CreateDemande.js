"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import "./CreateDemande.css"

const CreateDemande = () => {
  const [equipements, setEquipements] = useState([])
  const [selectedEquipement, setSelectedEquipement] = useState(null)
  const [fileName, setFileName] = useState("")
  const [scrolled, setScrolled] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState("FR")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState("")

  const [formData, setFormData] = useState({
    equipementId: "",
    description: "",
    priorite: "MOYENNE",
    fichier: null,
    dateDemande: new Date().toISOString(),
    statut: "EN_ATTENTE",
    localisation: "",
  })

  const location = useLocation()
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

  useEffect(() => {
    if (location.state && location.state.description) {
      setFormData((prev) => ({
        ...prev,
        description: location.state.description,
      }))
    }
  }, [location.state])

  useEffect(() => {
    loadEquipements()
  }, [])

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

  const loadEquipements = async () => {
    try {
      setIsLoading(true)
      const response = await api.get("/api/equipements")
      setEquipements(response.data)
      setIsLoading(false)
    } catch (err) {
      console.error("Erreur lors du chargement des équipements:", err)
      setError("Erreur lors du chargement des équipements")
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, files } = e.target

    if (name === "fichier" && files && files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }))
      setFileName(files[0].name)
    } else if (name === "equipementId" && value) {
      const equipementId = Number.parseInt(value)
      const selected = equipements.find((eq) => eq.idEquipement === equipementId)
      setSelectedEquipement(selected)
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        localisation: selected ? selected.localisation || "" : "",
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const user = JSON.parse(localStorage.getItem("user"))

      if (!user || !user.idUtilisateur) {
        setError("Utilisateur non connecté")
        navigate("/login")
        return
      }

      if (!formData.equipementId || !formData.description) {
        setError("Veuillez remplir tous les champs obligatoires")
        setIsLoading(false)
        return
      }

      const data = new FormData()
      data.append("equipementId", formData.equipementId)
      data.append("description", formData.description)
      data.append("priorite", formData.priorite)
      data.append("demandeurId", user.idUtilisateur)
      data.append("localisation", formData.localisation || "")

      if (formData.fichier) {
        data.append("fichier", formData.fichier)
      }

      const response = await axios.post("http://localhost:8083/api/interventions", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      setSuccessMessage("Demande créée avec succès !")

      setTimeout(() => {
        navigate("/demandeur/dashboard")
      }, 2000)
    } catch (err) {
      console.error("Erreur lors de l'envoi:", err)

      let errorMessage = "Une erreur est survenue lors de l'envoi de la demande."

      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = "Équipement ou utilisateur non trouvé."
        } else if (err.response.status === 400) {
          errorMessage = "Données invalides. Vérifiez les informations saisies."
        } else if (err.response.data && typeof err.response.data === "string") {
          errorMessage = err.response.data
        }
      } else if (err.request) {
        errorMessage = "Impossible de contacter le serveur."
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    navigate("/demandeur/dashboard")
  }

  const changeLanguage = (lang) => {
    setCurrentLanguage(lang)
  }

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "CRITIQUE":
        return "ocp-admin-priority-urgent"
      case "HAUTE":
        return "ocp-admin-priority-high"
      case "MOYENNE":
        return "ocp-admin-priority-normal"
      default:
        return "ocp-admin-priority-normal"
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "CRITIQUE":
        return "🔴"
      case "HAUTE":
        return "🟠"
      case "MOYENNE":
        return "🟢"
      default:
        return "🟢"
    }
  }

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
      <section className="ocp-admin-hero-section-demande">
        <div className="ocp-admin-hero-content">
          <h1>Nouvelle Demande</h1>
          <p>Création d'une demande d'intervention</p>
          <p className="ocp-admin-hero-description">
            Interface de création de demandes d'intervention avec sélection d'équipements, définition de priorités et
            upload de documents pour un traitement efficace par les équipes techniques OCP.
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
          <span className="ocp-admin-current">Nouvelle demande</span>
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
          <div className="ocp-admin-title-section">
            <h2 className="ocp-admin-title">Créer une Demande d'Intervention</h2>
            <div className="ocp-admin-title-actions">
              <button className="ocp-admin-btn ocp-admin-btn-secondary" onClick={handleCancel} disabled={isLoading}>
                <i className="fas fa-arrow-left"></i>
                Retour au dashboard
              </button>
            </div>
          </div>

          {/* Message de chargement */}
          {isLoading && (
            <div className="ocp-admin-loading-message">
              <div className="ocp-admin-loading-spinner"></div>
              <p>Traitement en cours...</p>
            </div>
          )}

          {/* Formulaire de création */}
          <div className="ocp-admin-form-container ocp-admin-animate-slide-in">
            <div className="ocp-admin-form-header">
              <h3>Informations de la demande</h3>
              <p>Remplissez tous les champs obligatoires pour créer votre demande d'intervention</p>
            </div>

            <form onSubmit={handleSubmit} className="ocp-admin-create-form">
              {/* Section Équipement */}
              <div className="ocp-admin-form-section">
                <div className="ocp-admin-form-section-title">
                  <i className="fas fa-cog"></i>
                  Informations sur l'équipement
                </div>

                <div className="ocp-admin-form-grid">
                  <div className="ocp-admin-form-group ocp-admin-full-width">
                    <label htmlFor="equipementId">
                      <i className="fas fa-tools"></i>
                      Équipement concerné *
                    </label>
                    <select
                      id="equipementId"
                      name="equipementId"
                      value={formData.equipementId}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                    >
                      <option value="">-- Sélectionnez un équipement --</option>
                      {equipements.map((eq) => (
                        <option key={eq.idEquipement} value={eq.idEquipement}>
                          {eq.typeEquipement} - {eq.modele}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedEquipement && (
                    <>
                      <div className="ocp-admin-form-group">
                        <label htmlFor="equipementStatus">
                          <i className="fas fa-info-circle"></i>
                          Statut de l'équipement
                        </label>
                        <input
                          type="text"
                          id="equipementStatus"
                          value={selectedEquipement.statut || "Non défini"}
                          readOnly
                          className={`ocp-admin-status-badge ${
                            selectedEquipement.statut === "EN_PANNE" ? "status-error" : "status-success"
                          }`}
                        />
                      </div>

                      <div className="ocp-admin-form-group">
                        <label htmlFor="localisation">
                          <i className="fas fa-map-marker-alt"></i>
                          Localisation de l'équipement
                        </label>
                        <input
                          type="text"
                          id="localisation"
                          name="localisation"
                          value={formData.localisation}
                          onChange={handleChange}
                          placeholder="Localisation de l'équipement"
                          disabled={isLoading}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Section Problème */}
              <div className="ocp-admin-form-section">
                <div className="ocp-admin-form-section-title">
                  <i className="fas fa-exclamation-triangle"></i>
                  Détails du problème
                </div>

                <div className="ocp-admin-form-grid">
                  <div className="ocp-admin-form-group ocp-admin-full-width">
                    <label htmlFor="description">
                      <i className="fas fa-edit"></i>
                      Description du problème *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      placeholder="Décrivez le problème avec précision..."
                      disabled={isLoading}
                      rows="4"
                    />
                  </div>

                  <div className="ocp-admin-form-group ocp-admin-full-width">
                    <label>
                      <i className="fas fa-flag"></i>
                      Priorité *
                    </label>
                    <div className="ocp-admin-priority-selector">
                      <div className="ocp-admin-priority-option">
                        <input
                          type="radio"
                          id="priorite-critique"
                          name="priorite"
                          value="CRITIQUE"
                          checked={formData.priorite === "CRITIQUE"}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                        <label htmlFor="priorite-critique" className="ocp-admin-priority-label">
                          <span className="ocp-admin-priority-icon">🔴</span>
                          <span className="ocp-admin-priority-text">Critique</span>
                          <span className="ocp-admin-priority-desc">Arrêt de production</span>
                        </label>
                      </div>

                      <div className="ocp-admin-priority-option">
                        <input
                          type="radio"
                          id="priorite-haute"
                          name="priorite"
                          value="HAUTE"
                          checked={formData.priorite === "HAUTE"}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                        <label htmlFor="priorite-haute" className="ocp-admin-priority-label">
                          <span className="ocp-admin-priority-icon">🟠</span>
                          <span className="ocp-admin-priority-text">Haute</span>
                          <span className="ocp-admin-priority-desc">Impact significatif</span>
                        </label>
                      </div>

                      <div className="ocp-admin-priority-option">
                        <input
                          type="radio"
                          id="priorite-moyenne"
                          name="priorite"
                          value="MOYENNE"
                          checked={formData.priorite === "MOYENNE"}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                        <label htmlFor="priorite-moyenne" className="ocp-admin-priority-label">
                          <span className="ocp-admin-priority-icon">🟢</span>
                          <span className="ocp-admin-priority-text">Moyenne</span>
                          <span className="ocp-admin-priority-desc">Maintenance préventive</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Pièces jointes */}
              <div className="ocp-admin-form-section">
                <div className="ocp-admin-form-section-title">
                  <i className="fas fa-paperclip"></i>
                  Pièces jointes
                </div>

                <div className="ocp-admin-form-grid">
                  <div className="ocp-admin-form-group ocp-admin-full-width">
                    <label>
                      <i className="fas fa-file-upload"></i>
                      Document justificatif (optionnel)
                    </label>
                    <div className="ocp-admin-file-input-container">
                      <label htmlFor="fichier" className="ocp-admin-file-input-label">
                        <i className="fas fa-cloud-upload-alt"></i>
                        <span>{fileName || "Choisir un fichier"}</span>
                        <span className="ocp-admin-file-formats">PDF, DOC, JPG, PNG</span>
                      </label>
                      <input
                        type="file"
                        id="fichier"
                        name="fichier"
                        onChange={handleChange}
                        className="ocp-admin-file-input"
                        disabled={isLoading}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                    </div>
                    {fileName && (
                      <div className="ocp-admin-file-selected">
                        <i className="fas fa-check-circle"></i>
                        <span>Fichier sélectionné: {fileName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="ocp-admin-form-buttons">
                <button type="button" className="ocp-admin-btn-cancel" onClick={handleCancel} disabled={isLoading}>
                  <i className="fas fa-times"></i>
                  Annuler
                </button>
                <button
                  type="submit"
                  className="ocp-admin-btn-submit"
                  disabled={isLoading || !formData.equipementId || !formData.description}
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      Envoyer la demande
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

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

export default CreateDemande
