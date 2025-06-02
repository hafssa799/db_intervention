import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Login.css';

export default function LoginForm({ setUser }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation de l'email avant de soumettre
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email invalide');
      return;
    }

    try {
      const res = await api.post('/api/utilisateurs/login', { email, motDePasse, role });
      const userData = res.data;
      localStorage.setItem('token', userData.token);
      localStorage.setItem('role', userData.role);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);  // Mettre à jour l'état user

    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError(err.response?.data?.message || 'Erreur réseau');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>Connexion</h2>
      {error && <div className="error">{error}</div>}
      <div>
        <label>Email :</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div>
        <label>Mot de passe :</label>
        <input type="password" value={motDePasse} onChange={e => setMotDePasse(e.target.value)} required />
      </div>
      <div>
        <label>Rôle :</label>
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="ADMIN">Admin</option>
          <option value="TECHNICIEN">Technicien</option>
          <option value="DEMANDEUR">Demandeur</option>
        </select>
      </div>
      <button type="submit">Se connecter</button>
    </form>
  );
}
