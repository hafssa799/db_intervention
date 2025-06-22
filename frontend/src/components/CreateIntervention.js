"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import moment from "moment"
import "./CreateIntervention.css"

const CreateIntervention = () => {
  const [formData, setFormData] = useState({
    description: "",
    date: "",
    equipementId: "",
    technicienId: "",
    demandeurId: "",
    priorite: "NORMALE",
    dateDebut: "",
    dateFin: "",
    localisation: "",
  })

  const [equipements, setEquipements] = useState([])
  const [techniciens, setTechniciens] = useState([])
  const [demandeurs, setDemandeurs] = useState([])
  const [scrolled, setScrolled] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState("FR")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    fetchData()
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

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [equipRes, techRes, demRes] = await Promise.all([
        api.get("/api/equipements"),
        api.get("/api/utilisateurs?role=TECHNICIEN"),
        api.get("/api/utilisateurs?role=DEMANDEUR"),
      ])

      setEquipements(equipRes.data || [])
      setTechniciens(techRes.data || [])
      setDemandeurs(demRes.data || [])
      setIsLoading(false)
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err)
      setError("Erreur lors du chargement des données: " + (err.response?.data?.message || err.message))
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    if (!formData.description.trim()) {
      setError("La description est obligatoire")
      return false
    }

    if (!formData.date) {
      setError("La date prévue est obligatoire")
      return false
    }

    if (new Date(formData.date) < new Date().setHours(0, 0, 0, 0)) {
      setError("La date ne peut pas être dans le passé")
      return false
    }

    if (formData.dateDebut && formData.dateFin) {
      if (new Date(formData.dateDebut) >= new Date(formData.dateFin)) {
        setError("La date de début doit être antérieure à la date de fin")
        return false
      }
    }

    if (!formData.equipementId) {
      setError("Veuillez sélectionner un équipement")
      return false
    }

    if (!formData.demandeurId) {
      setError("Veuillez sélectionner un demandeur")
      return false
    }

    if (!formData.localisation.trim()) {
      setError("La localisation est obligatoire")
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // Création d'un objet FormData pour l'envoi multipart/form-data
      const submitData = new FormData()
      submitData.append("description", formData.description.trim())
      submitData.append("equipementId", formData.equipementId)
      submitData.append("demandeurId", formData.demandeurId)
      submitData.append("priorite", formData.priorite)
      submitData.append("localisation", formData.localisation.trim())

      if (formData.dateDebut) {
        submitData.append("dateDebut", formData.dateDebut)
      }
      if (formData.dateFin) {
        submitData.append("dateFin", formData.dateFin)
      }
      if (formData.date) {
        submitData.append("dateDemande", formData.date)
      }
      if (formData.technicienId) {
        submitData.append("technicienId", formData.technicienId)
      }

      const response = await axios.post("http://localhost:8083/api/interventions", submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      if (response.status === 200 || response.status === 201) {
        setSuccessMessage("Intervention créée avec succès !")
        setTimeout(() => navigate("/interventions"), 2000)
      }
    } catch (err) {
      console.error("Erreur lors de la création:", err)
      setError(err.response?.data?.message || "Une erreur est survenue lors de la création")
    } finally {
      setIsSubmitting(false)
    }
  }

  const changeLanguage = (lang) => {
    setCurrentLanguage(lang)
  }

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "BASSE":
        return "ocp-admin-priority-low"
      case "NORMALE":
        return "ocp-admin-priority-normal"
      case "HAUTE":
        return "ocp-admin-priority-high"
      case "URGENTE":
        return "ocp-admin-priority-urgent"
      default:
        return ""
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


      {/* Breadcrumb */}
      <div className="ocp-admin-breadcrumb">
        <div className="ocp-admin-breadcrumb-content">
          <a href="#" onClick={() => navigate("/interventions")}>
            Interventions
          </a>
          <span>&gt;</span>
          <span className="ocp-admin-current">Créer une intervention</span>
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
            <h2 className="ocp-admin-title">Nouvelle Intervention</h2>
            <div className="ocp-admin-title-actions">
              <button
                className="ocp-admin-btn ocp-admin-btn-secondary"
                onClick={() => navigate("/interventions")}
                disabled={isSubmitting}
              >
                <i className="fas fa-arrow-left"></i>
                Retour à la liste
              </button>
            </div>
          </div>

          {/* Message de chargement */}
          {isLoading && (
            <div className="ocp-admin-loading-message">
              <div className="ocp-admin-loading-spinner"></div>
              <p>Chargement des données...</p>
            </div>
          )}

          {/* Formulaire de création */}
          {!isLoading && (
            <div className="ocp-admin-form-container ocp-admin-animate-slide-in">
              <div className="ocp-admin-form-header">
                <h3>Informations de l'intervention</h3>
                <p>Remplissez tous les champs obligatoires pour créer une nouvelle intervention</p>
              </div>

              <form onSubmit={handleSubmit} className="ocp-admin-create-form">
                <div className="ocp-admin-form-grid">
                  {/* Description */}
                  <div className="ocp-admin-form-group ocp-admin-full-width">
                    <label htmlFor="description">
                      <i className="fas fa-edit"></i>
                      Description du problème *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Décrivez en détail le problème rencontré..."
                      required
                      disabled={isSubmitting}
                      rows="4"
                    />
                  </div>

                  {/* Localisation */}
                  <div className="ocp-admin-form-group ocp-admin-full-width">
                    <label htmlFor="localisation">
                      <i className="fas fa-map-marker-alt"></i>
                      Localisation *
                    </label>
                    <input
                      type="text"
                      id="localisation"
                      name="localisation"
                      value={formData.localisation}
                      onChange={handleInputChange}
                      placeholder="Ex: Bloc technique A, Bâtiment administratif, Zone de production..."
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Date prévue */}
                  <div className="ocp-admin-form-group">
                    <label htmlFor="date">
                      <i className="fas fa-calendar"></i>
                      Date prévue *
                    </label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                      min={moment().format("YYYY-MM-DD")}
                    />
                  </div>

                  {/* Priorité */}
                  <div className="ocp-admin-form-group">
                    <label htmlFor="priorite">
                      <i className="fas fa-exclamation-triangle"></i>
                      Priorité *
                    </label>
                    <select
                      id="priorite"
                      name="priorite"
                      value={formData.priorite}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                      className={getPriorityClass(formData.priorite)}
                    >
                      <option value="BASSE">🟢 Basse</option>
                      <option value="NORMALE">🟡 Normale</option>
                      <option value="HAUTE">🟠 Haute</option>
                      <option value="URGENTE">🔴 Urgente</option>
                    </select>
                  </div>

                  {/* Date de début */}
                  <div className="ocp-admin-form-group">
                    <label htmlFor="dateDebut">
                      <i className="fas fa-play"></i>
                      Date de début
                    </label>
                    <input
                      type="datetime-local"
                      id="dateDebut"
                      name="dateDebut"
                      value={formData.dateDebut}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Date de fin */}
                  <div className="ocp-admin-form-group">
                    <label htmlFor="dateFin">
                      <i className="fas fa-stop"></i>
                      Date de fin
                    </label>
                    <input
                      type="datetime-local"
                      id="dateFin"
                      name="dateFin"
                      value={formData.dateFin}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      min={formData.dateDebut}
                    />
                  </div>

                  {/* Équipement */}
                  <div className="ocp-admin-form-group">
                    <label htmlFor="equipementId">
                      <i className="fas fa-cog"></i>
                      Équipement concerné *
                    </label>
                    <select
                      id="equipementId"
                      name="equipementId"
                      value={formData.equipementId}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                    >
                      <option value="">-- Sélectionner un équipement --</option>
                      {equipements.map((eq) => (
                        <option key={eq.idEquipement} value={eq.idEquipement}>
                          {eq.typeEquipement} {eq.modele && `- ${eq.modele}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Technicien */}
                  <div className="ocp-admin-form-group">
                    <label htmlFor="technicienId">
                      <i className="fas fa-user-cog"></i>
                      Technicien assigné
                    </label>
                    <select
                      id="technicienId"
                      name="technicienId"
                      value={formData.technicienId}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    >
                      <option value="">-- Assignation automatique --</option>
                      {techniciens.map((tech) => (
                        <option key={tech.idUtilisateur} value={tech.idUtilisateur}>
                          {tech.prenom} {tech.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Demandeur */}
                  <div className="ocp-admin-form-group">
                    <label htmlFor="demandeurId">
                      <i className="fas fa-user"></i>
                      Demandeur *
                    </label>
                    <select
                      id="demandeurId"
                      name="demandeurId"
                      value={formData.demandeurId}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                    >
                      <option value="">-- Sélectionner un demandeur --</option>
                      {demandeurs.map((dem) => (
                        <option key={dem.idUtilisateur} value={dem.idUtilisateur}>
                          {dem.prenom} {dem.nom} {dem.email && `(${dem.email})`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="ocp-admin-form-buttons">
                  <button
                    type="button"
                    className="ocp-admin-btn-cancel"
                    onClick={() => navigate("/interventions")}
                    disabled={isSubmitting}
                  >
                    <i className="fas fa-times"></i>
                    Annuler
                  </button>
                  <button type="submit" className="ocp-admin-btn-submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save"></i>
                        Créer l'intervention
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
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

export default CreateIntervention
