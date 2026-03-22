import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Form = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');
  const [responsible, setResponsible] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const validateForm = () => {
    if (title.trim().length < 3) {
      setError('Название должно содержать минимум 3 символа.');
      return false;
    }

    if (description.trim().length < 5) {
      setError('Описание должно содержать минимум 5 символов.');
      return false;
    }

    if (location.trim().length < 2) {
      setError('Укажите место происшествия.');
      return false;
    }

    if (!date) {
      setError('Выберите дату.');
      return false;
    }

    if (status.trim().length < 2) {
      setError('Укажите статус инцидента.');
      return false;
    }

    if (responsible.trim().length < 2) {
      setError('Укажите ответственного.');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    axios.post('http://localhost:5000/incidents', {
      title,
      description,
      location,
      date,
      status,
      responsible
    })
      .then(() => navigate('/'))
      .catch(() => {
        setError('Не удалось добавить инцидент. Проверьте работу сервера.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div>
      <h1>Добавление инцидента</h1>

      {loading && <p>Сохранение данных...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Название"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <br />

        <input
          placeholder="Описание"
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
        />
        <br />

        <input
          placeholder="Место"
          value={location}
          onChange={e => setLocation(e.target.value)}
          required
        />
        <br />

        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
        <br />

        <input
          placeholder="Статус"
          value={status}
          onChange={e => setStatus(e.target.value)}
          required
        />
        <br />

        <input
          placeholder="Ответственный"
          value={responsible}
          onChange={e => setResponsible(e.target.value)}
          required
        />
        <br />

        <button type="submit" disabled={loading}>
          {loading ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>
    </div>
  );
};

export default Form;