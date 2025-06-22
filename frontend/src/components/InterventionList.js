"use client"

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { Link } from 'react-router-dom'
import moment from 'moment'
import autoTable from 'jspdf-autotable'
import './InterventionList.css'

const InterventionList = () => {
  const [interventions, setInterventions] = useState([])
  const [filteredInterventions, setFilteredInterventions] = useState([])
  const [allInterventions, setAllInterventions] = useState([])
  const [utilisateurs, setUtilisateurs] = useState({})
  const [equipements, setEquipements] = useState({})
  const [scrolled, setScrolled] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState("FR")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(null)

  const [searchParams, setSearchParams] = useState({
    searchField: "description",
    searchValue: "",
    statusFilter: "",
  })

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
    fetchUtilisateurs()
    fetchEquipements()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [allInterventions, searchParams])

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
      const response = await api.get("/api/interventions")
      setAllInterventions(response.data || [])
      setIsLoading(false)
    } catch (err) {
      console.error("Erreur lors du chargement des interventions:", err)
      setError("Erreur lors du chargement des interventions: " + (err.response?.data?.message || err.message))
      setIsLoading(false)
    }
  }

  const fetchUtilisateurs = async () => {
    try {
      const res = await api.get('/api/utilisateurs')
      const usersMap = res.data.reduce((acc, user) => {
        acc[user.idUtilisateur] = user
        return acc
      }, {})
      setUtilisateurs(usersMap)
    } catch (err) {
      console.error('Erreur chargement utilisateurs :', err)
    }
  }

  const fetchEquipements = async () => {
    try {
      const res = await api.get('/api/equipements')
      const eqMap = res.data.reduce((acc, eq) => {
        acc[eq.idEquipement] = eq
        return acc
      }, {})
      setEquipements(eqMap)
    } catch (err) {
      console.error('Erreur chargement équipements :', err)
    }
  }

  const applyFilters = () => {
    let filtered = [...allInterventions]

    // Filtre par statut
    if (searchParams.statusFilter && searchParams.statusFilter.trim() !== "") {
      filtered = filtered.filter((intervention) => intervention.statut === searchParams.statusFilter)
    }

    // Filtre par terme de recherche
    if (searchParams.searchValue && searchParams.searchValue.trim() !== "") {
      const searchTerm = searchParams.searchValue.toLowerCase().trim()

      filtered = filtered.filter((intervention) => {
        if (searchParams.searchField === "description") {
          return (intervention.description || "").toLowerCase().includes(searchTerm)
        } else if (searchParams.searchField === "technicien") {
          const technicienName = intervention.technicien 
            ? `${intervention.technicien.prenom || ""} ${intervention.technicien.nom || ""}`.toLowerCase()
            : ""
          return technicienName.includes(searchTerm)
        } else if (searchParams.searchField === "equipement") {
          return (intervention.equipement?.typeEquipement || "").toLowerCase().includes(searchTerm)
        }
        return true
      })
    }

    setFilteredInterventions(filtered)
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
    setSearchParams({ searchField: "description", searchValue: "", statusFilter: "" })
  }

  const handleDeleteClick = (interventionId) => {
    setConfirmDelete(interventionId)
  }

  const confirmDeleteAction = async () => {
    try {
      setIsLoading(true)
      await api.delete(`/api/interventions/${confirmDelete}`)
      setSuccessMessage("Intervention supprimée avec succès")
      await fetchData()
      setConfirmDelete(null)
      setIsLoading(false)
    } catch (err) {
      console.error("Erreur lors de la suppression:", err)
      setError("Erreur lors de la suppression: " + (err.response?.data?.message || err.message))
      setIsLoading(false)
    }
  }

  const exportInterventionToPDF = async (intervention) => {
    try {
      const doc = new jsPDF()

      try {
        const logoUrl = "https://upload.wikimedia.org/wikipedia/commons/d/d9/Ocp-group.png"
        doc.addImage(logoUrl, "PNG", 75, 10, 60, 20)
      } catch (logoError) {
        console.warn("Impossible de charger le logo:", logoError)
      }

      doc.setDrawColor(0, 153, 76)
      doc.setLineWidth(1.2)
      doc.line(15, 35, 195, 35)

      doc.setFontSize(18)
      doc.setTextColor(34, 47, 62)
      doc.setFont("helvetica", "bold")
      doc.text("Fiche détaillée d'intervention", 105, 45, { align: "center" })

      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100)
      doc.text(`Généré le ${moment().format("DD/MM/YYYY à HH:mm")}`, 105, 53, { align: "center" })

      const tableData = [
        [" Identifiant", `#${intervention.idIntervention || "N/A"}`],
        [" Description", intervention.description || "N/A"],
        [" Date de demande", intervention.dateDemande ? moment(intervention.dateDemande).format("DD/MM/YYYY à HH:mm") : "N/A"],
        [" Statut", translateStatus(intervention.statut) || "N/A"],
        [" Technicien", intervention.technicien ? `${intervention.technicien.prenom} ${intervention.technicien.nom}` : "Non assigné"],
        [" Demandeur", intervention.demandeur ? `${intervention.demandeur.prenom} ${intervention.demandeur.nom}` : "Non spécifié"],
        [" Équipement", intervention.equipement ? `${intervention.equipement.typeEquipement} - ${intervention.equipement.modele || 'N/A'}` : "Aucun équipement"],
      ]

      autoTable(doc, {
        startY: 65,
        head: [["Champ", "Valeur"]],
        body: tableData,
        theme: "striped",
        styles: { fontSize: 11, cellPadding: 4 },
        headStyles: { fillColor: [0, 153, 76], textColor: [255, 255, 255], fontStyle: "bold" },
        bodyStyles: { textColor: [44, 62, 80] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: { 0: { fontStyle: "bold", textColor: [34, 47, 62] } },
        margin: { left: 20, right: 20 },
      })

      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(9)
        doc.setTextColor(120)
        doc.text("© OCP Group – Rapport confidentiel", 20, doc.internal.pageSize.height - 12)
        doc.text(`Page ${i} sur ${pageCount}`, 200, doc.internal.pageSize.height - 12, { align: "right" })
      }

      const fileName = `Rapport_Intervention_OCP_${intervention.idIntervention}_${moment().format("YYYYMMDD_HHmmss")}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error)
      setError("Erreur lors de l'export PDF")
    }
  }

  const exportInterventionToExcel = (intervention) => {
    try {
      const interventionData = {
        "ID Intervention": intervention.idIntervention || "N/A",
        "Description": intervention.description || "N/A",
        "Date de demande": intervention.dateDemande ? moment(intervention.dateDemande).format("DD/MM/YYYY HH:mm") : "N/A",
        "Statut": translateStatus(intervention.statut) || "N/A",
        "Technicien": intervention.technicien ? `${intervention.technicien.prenom} ${intervention.technicien.nom}` : "Non assigné",
        "Demandeur": intervention.demandeur ? `${intervention.demandeur.prenom} ${intervention.demandeur.nom}` : "Non spécifié",
        "Équipement": intervention.equipement ? `${intervention.equipement.typeEquipement} - ${intervention.equipement.modele || 'N/A'}` : "Aucun équipement",
        "Date d'export": moment().format("DD/MM/YYYY HH:mm"),
        "Exporté par": "Système OCP",
      }

      const worksheet = XLSX.utils.json_to_sheet([interventionData])
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Intervention OCP")

      const fileName = `OCP_Intervention_${intervention.idIntervention}_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
      XLSX.writeFile(workbook, fileName)
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error)
      setError("Erreur lors de l'export Excel")
    }
  }

  const exportAllInterventionsToPDF = async () => {
    try {
      const doc = new jsPDF()

      try {
        const logoUrl = "https://upload.wikimedia.org/wikipedia/commons/d/d9/Ocp-group.png"
        doc.addImage(logoUrl, "PNG", 75, 10, 60, 20)
      } catch (logoError) {
        console.warn("Impossible de charger le logo:", logoError)
      }

      doc.setDrawColor(0, 153, 76)
      doc.setLineWidth(1.2)
      doc.line(15, 35, 195, 35)

      doc.setFontSize(18)
      doc.setTextColor(34, 47, 62)
      doc.setFont("helvetica", "bold")
      doc.text("Liste des interventions OCP", 105, 45, { align: "center" })

      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100)
      doc.text(`Généré le ${moment().format("DD/MM/YYYY à HH:mm")}`, 105, 53, { align: "center" })

      doc.setFontSize(12)
      doc.setTextColor(44, 62, 80)
      doc.setFont("helvetica", "bold")
      doc.text("Rapport de gestion des interventions", 15, 65)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.setTextColor(80)
      doc.text(`Nombre total : ${filteredInterventions.length}`, 15, 72)

      const tableData = filteredInterventions.map((intervention, index) => [
        `#${intervention.idIntervention || index + 1}`,
        intervention.description || "N/A",
        translateStatus(intervention.statut) || "N/A",
        intervention.technicien ? `${intervention.technicien.prenom} ${intervention.technicien.nom}` : "Non assigné",
        intervention.dateDemande ? moment(intervention.dateDemande).format("DD/MM/YY") : "N/A",
      ])

      autoTable(doc, {
        startY: 80,
        head: [["ID", "Description", "Statut", "Technicien", "Date"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [0, 153, 76], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 10 },
        bodyStyles: { fontSize: 9, textColor: [44, 62, 80] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: { 0: { fontStyle: "bold", halign: "center" } },
        margin: { left: 15, right: 15 },
      })

      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setDrawColor(0, 153, 76)
        doc.setLineWidth(0.5)
        doc.line(15, doc.internal.pageSize.height - 25, 195, doc.internal.pageSize.height - 25)

        doc.setFontSize(9)
        doc.setTextColor(127, 140, 141)
        doc.text("© OCP Group – Document confidentiel", 20, doc.internal.pageSize.height - 15)
        doc.text(`Page ${i} sur ${pageCount}`, 195, doc.internal.pageSize.height - 10, { align: "right" })
      }

      const fileName = `OCP_Interventions_List_${moment().format("YYYYMMDD_HHmmss")}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error)
      setError("Erreur lors de l'export PDF")
    }
  }

  const changeLanguage = (lang) => {
    setCurrentLanguage(lang)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Date non définie'
    return moment(dateString).format("DD/MM/YYYY à HH:mm")
  }

  const translateStatus = (status) => {
    switch(status) {
      case 'EN_ATTENTE': return 'En attente'
      case 'EN_COURS': return 'En cours'
      case 'TERMINEE': return 'Terminée'
      default: return status
    }
  }

  const getStatusClass = (status) => {
    switch(status) {
      case 'EN_ATTENTE': return 'ocp-admin-status-waiting'
      case 'EN_COURS': return 'ocp-admin-status-progress'
      case 'TERMINEE': return 'ocp-admin-status-completed'
      default: return ''
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
      <section className="ocp-admin-hero-section-intervention">
        <div className="ocp-admin-hero-content">
          <h1>Gestion des Interventions</h1>
          <p>Suivi et maintenance technique</p>
          <p className="ocp-admin-hero-description">
            Interface de gestion des interventions techniques avec suivi des statuts, assignation des techniciens et 
            fonctionnalités d'export pour une maintenance efficace des équipements OCP.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="ocp-admin-breadcrumb">
        <div className="ocp-admin-breadcrumb-content">
          <a href="#">Administration</a>
          <span>&gt;</span>
          <span className="ocp-admin-current">Gestion des interventions</span>
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
            <h2 className="ocp-admin-title">Liste des Interventions</h2>
            <div className="ocp-admin-title-actions">
              <button
                className="ocp-admin-btn ocp-admin-btn-secondary"
                onClick={exportAllInterventionsToPDF}
                disabled={isLoading || filteredInterventions.length === 0}
              >
                <i className="fas fa-file-pdf"></i>
                Exporter la liste
              </button>
              <Link
                to="/create-intervention"
                className="ocp-admin-btn ocp-admin-btn-primary"
              >
                <i className="fas fa-plus"></i>
                Nouvelle intervention
              </Link>
            </div>
          </div>

          {/* Barre de filtrage */}
          <div className="ocp-admin-search-section">
            <form onSubmit={handleSearchSubmit}>
              <div className="ocp-admin-search-filters">
                <div className="ocp-admin-filter-group">
                  <label>Champ de recherche</label>
                  <select name="searchField" value={searchParams.searchField} onChange={handleSearchChange}>
                    <option value="description">Description</option>
                    <option value="technicien">Technicien</option>
                    <option value="equipement">Équipement</option>
                  </select>
                </div>

                <div className="ocp-admin-filter-group">
                  <label>
                    {searchParams.searchField === "description" ? "Rechercher par description" : 
                     searchParams.searchField === "technicien" ? "Rechercher par technicien" : 
                     "Rechercher par équipement"}
                  </label>
                  <input
                    type="text"
                    name="searchValue"
                    value={searchParams.searchValue}
                    onChange={handleSearchChange}
                    placeholder={
                      searchParams.searchField === "description" ? "Tapez la description..." :
                      searchParams.searchField === "technicien" ? "Tapez le nom du technicien..." :
                      "Tapez le type d'équipement..."
                    }
                  />
                </div>

                <div className="ocp-admin-filter-group">
                  <label>Filtrer par statut</label>
                  <select name="statusFilter" value={searchParams.statusFilter} onChange={handleSearchChange}>
                    <option value="">Tous les statuts</option>
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="TERMINEE">Terminée</option>
                  </select>
                </div>
              </div>

              <div className="ocp-admin-search-buttons">
                <button
                  type="button"
                  className="ocp-admin-btn ocp-admin-btn-secondary"
                  onClick={resetFilters}
                  disabled={isLoading}
                >
                  <i className="fas fa-sync-alt"></i>
                  Réinitialiser
                </button>
                <button type="submit" className="ocp-admin-btn ocp-admin-btn-primary" disabled={isLoading}>
                  <i className="fas fa-search"></i>
                  Rechercher
                </button>
              </div>
            </form>
          </div>

          {/* Statistiques de filtrage */}
          <div className="ocp-admin-filter-stats">
            <p>
              <strong>{filteredInterventions.length}</strong> intervention{filteredInterventions.length > 1 ? "s" : ""} affichée
              {filteredInterventions.length > 1 ? "s" : ""} sur <strong>{allInterventions.length}</strong> au total
              {(searchParams.searchValue || searchParams.statusFilter) && (
                <span className="ocp-admin-filter-info">
                  (Filtré par {searchParams.searchField}: "{searchParams.searchValue}"
                  {searchParams.statusFilter && ` - Statut: ${translateStatus(searchParams.statusFilter)}`})
                </span>
              )}
            </p>
          </div>

          {/* Message de chargement */}
          {isLoading && (
            <div className="ocp-admin-loading-message">
              <div className="ocp-admin-loading-spinner"></div>
              <p>Chargement des données...</p>
            </div>
          )}

          {/* Message aucun résultat */}
          {!isLoading && filteredInterventions.length === 0 && allInterventions.length > 0 && (
            <div className="ocp-admin-no-results-message">
              <p>Aucune intervention trouvée pour les critères de recherche spécifiés.</p>
            </div>
          )}

          {/* Dialogue de confirmation de suppression */}
          {confirmDelete && (
            <div className="ocp-admin-modal-overlay">
              <div className="ocp-admin-modal ocp-admin-modal-confirm">
                <div className="ocp-admin-edit-form-header">
                  <h3>Confirmer la suppression</h3>
                  <button className="ocp-admin-btn-close" onClick={() => setConfirmDelete(null)}>
                    ×
                  </button>
                </div>

                <div className="ocp-admin-modal-body">
                  <div className="ocp-admin-alert-icon">
                    <i className="fas fa-exclamation-triangle"></i>
                  </div>
                  <p>Êtes-vous sûr de vouloir supprimer cette intervention ? Cette action est irréversible.</p>
                </div>

                <div className="ocp-admin-form-buttons">
                  <button className="ocp-admin-btn-cancel" onClick={() => setConfirmDelete(null)} disabled={isLoading}>
                    Annuler
                  </button>
                  <button
                    className="ocp-admin-btn ocp-admin-btn-delete"
                    onClick={confirmDeleteAction}
                    disabled={isLoading}
                  >
                    {isLoading ? "Suppression..." : "Supprimer"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tableau des interventions style OCP */}
          {!isLoading && filteredInterventions.length > 0 && (
            <div className="ocp-admin-table-container ocp-admin-animate-slide-in">
              <table className="ocp-admin-styled-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Description</th>
                    <th>Statut</th>
                    <th>Technicien</th>
                    <th>Équipement</th>
                    <th>Date demande</th>
                    <th>Actions</th>
                    <th>Export</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterventions.map((intervention) => (
                    <tr key={intervention.idIntervention}>
                      <td className="ocp-admin-number-cell">#{intervention.idIntervention}</td>
                      <td>
                        <div className="ocp-admin-intervention-info">
                          <strong>{intervention.description || "Sans description"}</strong>
                        </div>
                      </td>
                      <td>
                        <span className={`ocp-admin-connection-status ${getStatusClass(intervention.statut)}`}>
                          {translateStatus(intervention.statut)}
                        </span>
                      </td>
                      <td>
                        <div className="ocp-admin-user-info">
                          <div className="ocp-admin-avatar">
                            {intervention.technicien?.nom?.charAt(0) || "?"}
                            {intervention.technicien?.prenom?.charAt(0) || ""}
                          </div>
                          <span>
                            {intervention.technicien 
                              ? `${intervention.technicien.prenom} ${intervention.technicien.nom}` 
                              : 'Non assigné'}
                          </span>
                        </div>
                      </td>
                      <td>
                        {intervention.equipement 
                          ? `${intervention.equipement.typeEquipement} - ${intervention.equipement.modele || 'N/A'}` 
                          : 'Aucun équipement'}
                      </td>
                      <td>
                        <div className="ocp-admin-connection-date">
                          {formatDate(intervention.dateDemande)}
                        </div>
                      </td>
                      <td>
                        <Link
                          to={`/admin/interventions/edit/${intervention.idIntervention}`}
                          className="ocp-admin-btn ocp-admin-btn-edit"
                          disabled={isLoading}
                        >
                          <i className="fas fa-edit"></i>
                          Modifier
                        </Link>
                        <button
                          className="ocp-admin-btn ocp-admin-btn-delete"
                          onClick={() => handleDeleteClick(intervention.idIntervention)}
                          disabled={isLoading}
                        >
                          <i className="fas fa-trash-alt"></i>
                          Supprimer
                        </button>
                      </td>
                      <td>
                        <button
                          className="ocp-admin-btn ocp-admin-btn-export"
                          onClick={() => exportInterventionToPDF(intervention)}
                          disabled={isLoading}
                        >
                          <i className="fas fa-file-pdf"></i>
                          PDF
                        </button>
                        <button
                          className="ocp-admin-btn ocp-admin-btn-export"
                          onClick={() => exportInterventionToExcel(intervention)}
                          disabled={isLoading}
                        >
                          <i className="fas fa-file-excel"></i>
                          Excel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* État vide */}
          {!isLoading && filteredInterventions.length === 0 && allInterventions.length === 0 && (
            <div className="ocp-admin-empty-state">
              <i className="fas fa-tools"></i>
              <p>Aucune intervention trouvée.</p>
              <Link
                to="/create-intervention"
                className="ocp-admin-btn ocp-admin-btn-primary"
              >
                Créer la première intervention
              </Link>
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

export default InterventionList
