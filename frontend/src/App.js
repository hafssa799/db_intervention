import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import DashboardDemandeur from './components/DashboardDemandeur';
import CreateDemande from './components/CreateDemande';


import MesInterventions from './components/MesInterventions';
// Importation des composants
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import EquipementList from './components/EquipementList';
import EquipementForm from './components/EquipementForm';
import EquipementInterventions from './components/EquipementInterventions';
import InterventionList from './components/InterventionList';
import CreateIntervention from './components/CreateIntervention';
import EditIntervention from './components/EditIntervention';
import DashboardTechnicien from './components/DashboardTechnicien';
import ChatbotPage from './components/ChatbotPage'; 


function App() {
  const [user, setUser] = useState(null); // Authentification simple

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <Routes>

            {/* Connexion */}
            <Route 
              path="/login" 
              element={
                user ? (
                  user.role === 'ADMIN' ? <Navigate to="/dashboard" /> :
                  user.role === 'TECHNICIEN' ? <Navigate to="/interventions" /> :
                  user.role === 'DEMANDEUR' ? <Navigate to="/demandeur/dashboard" /> :
                  <Navigate to="/login" />
                ) : (
                  <LoginForm setUser={setUser} />
                )
              }
              
            />

            {/* Redirection depuis la racine */}
            <Route 
              path="/" 
              element={<Navigate to={user ? "/dashboard" : "/login"} />} 
            />

            {/* Tableau de bord */}
            <Route 
              path="/dashboard" 
              element={user ? <Dashboard /> : <Navigate to="/login" />} 
            />
<Route 
  path="/demandeur/dashboard" 
  element={user ? <DashboardDemandeur /> : <Navigate to="/login" />} 
/>
<Route 
  path="/technicien/dashboard"
  element={user ? <Dashboard/> : <Navigate to="/login" />} 
/>

<Route 
  path="/demandeur/demande" 
  element={user ? <CreateDemande /> : <Navigate to="/login" />} 
/>
<Route 
  path="/demandeur/mes-interventions" 
  element={user ? <MesInterventions /> : <Navigate to="/login" />} 
/>

            {/* Gestion des interventions */}
            <Route 
              path="/interventions" 
              element={user ? <InterventionList /> : <Navigate to="/login" />} 
            />
          

            <Route 
              path="/create-intervention" 
              element={user ? <CreateIntervention /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/admin/interventions/edit/:id" 
              element={user ? <EditIntervention /> : <Navigate to="/login" />} 
            />

            {/* Gestion des équipements */}
            <Route 
              path="/equipements" 
              element={user ? <EquipementList /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/equipements/add" 
              element={user ? <EquipementForm /> : <Navigate to="/login" />} 
            />
            
            <Route 
              path="/equipements/edit/:id" 
              element={user ? <EquipementForm /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/equipements/:id/interventions" 
              element={user ? <EquipementInterventions /> : <Navigate to="/login" />} 
            />
<Route path="/chatbot" element={<ChatbotPage />} />

          </Routes>
        </header>
      </div>
    </Router>
  );
  
}

export default App;
