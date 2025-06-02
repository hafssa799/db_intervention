import React, { useEffect, useState } from 'react';
import api from '../api';

export default function UserList() {
  const [users, setUsers]  = useState([]);
  const [loading, setLoad] = useState(true);

  useEffect(() => {
    api.get('/')
      .then(res => {
        console.log('✅ Data reçue :', res.data);
        setUsers(res.data);
      })
      .catch(err => {
        console.error('❌ Erreur fetch users :', err);
      })
      .finally(() => {
        setLoad(false);
      });
  }, []);

  if (loading) return <p>Chargement…</p>;
  if (!loading && users.length === 0) return <p>Aucun utilisateur trouvé.</p>;

  return (
    <table border="1" cellPadding="8" style={{ margin: '20px auto' }}>
      <thead>
        <tr>
          <th>ID</th><th>Nom</th><th>Prénom</th><th>Email</th><th>Rôle</th>
        </tr>
      </thead>
      <tbody>
        {users.map(u => (
          <tr key={u.idUtilisateur}>
            <td>{u.idUtilisateur}</td>
            <td>{u.nom}</td>
            <td>{u.prenom}</td>
            <td>{u.email}</td>
            <td>{u.role}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
