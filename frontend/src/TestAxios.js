import React, { useEffect, useState } from 'react';
import axios from 'axios';

function TestAxios() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Exemple d'appel API : ici, on interroge un test public
    axios.get('https://jsonplaceholder.typicode.com/posts/1')
      .then(response => {
        console.log(response.data); // affiché dans la console
        setData(response.data);
      })
      .catch(error => {
        console.error('Erreur Axios :', error);
      });
  }, []);

  return (
    <div>
      <h2>Test Axios</h2>
      {data ? (
        <div>
          <p><strong>Titre :</strong> {data.title}</p>
          <p><strong>Contenu :</strong> {data.body}</p>
        </div>
      ) : (
        <p>Chargement...</p>
      )}
    </div>
  );
}

export default TestAxios;
