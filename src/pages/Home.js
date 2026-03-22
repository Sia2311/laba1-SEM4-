import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    axios.get('http://localhost:5000/incidents')
      .then(response => {
        setData(response.data);
        console.log('Данные загружены:', response.data);
      })
      .catch(() => {
        setError('Не удалось загрузить список инцидентов.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function deleteItem(id) {
    setDeletingId(id);
    setError('');
  
    setTimeout(() => {
      axios.delete(`http://localhost:5000/incidents/${id}`)
        .then(() => {
          setData(prevData => prevData.filter(item => item.id !== id));
        })
        .catch(() => {
          setError('Не удалось удалить инцидент.');
        })
        .finally(() => {
          setDeletingId(null);
        });
    }, 1000);
  }

  return (
    <div>
      <h1>Список инцидентов</h1>

      {loading && <p>Загрузка данных...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && data.length === 0 && <p>Список инцидентов пуст.</p>}

      {!loading && data.length > 0 && (
        <ul>
          {data.map(item => (
            <li key={item.id}>
              <Link to={`/detail/${item.id}`}>{item.title}</Link>
              <button
                onClick={() => deleteItem(item.id)}
                style={{ marginLeft: '10px' }}
                disabled={deletingId === item.id}
              >
                {deletingId === item.id ? 'Удаление...' : 'Удалить'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Link to="/add">Добавить инцидент</Link>
    </div>
  );
};

export default Home;