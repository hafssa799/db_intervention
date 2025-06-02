import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Import du composant Link
import './Dashboard.css';
const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:8083/api/dashboard')
            .then(response => {
                setDashboardData(response.data);
            })
            .catch(error => {
                console.error('Erreur lors de la récupération des données:', error);
            });
    }, []);

    if (!dashboardData) {
        return <div>Chargement...</div>;
    }

    return (
        <div>
            <h1>Tableau de Bord</h1>
            <div>
                <p>Total des interventions: {dashboardData.totalInterventions}</p>
                <p>Interventions en cours: {dashboardData.interventionsEnCours}</p>
                <p>Interventions terminées: {dashboardData.interventionsTerminees}</p>
                <p>Techniciens disponibles: {dashboardData.techniciensDisponibles}</p>
            </div>

            {/* Liens vers les autres pages */}
            <div style={{ marginTop: '20px' }}>
                <Link to="/equipements" className="dashboard-link">🔧 Voir les équipements</Link>
                <br />
                <Link to="/interventions" className="dashboard-link">🛠️ Gérer les interventions</Link>
            </div>
        </div>
    );
};

export default Dashboard;
