import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const titleRef = useRef(null);
  const descriptionRef = useRef(null);
  const locationRef = useRef(null);
  const dateRef = useRef(null);
  const statusRef = useRef(null);
  const responsibleRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    axios.get(`http://localhost:5000/incidents/${id}`)
      .then(response => {
        const item = response.data;

        if (titleRef.current) {
          titleRef.current.value = item.title || '';
          descriptionRef.current.value = item.description || '';
          locationRef.current.value = item.location || '';
          dateRef.current.value = item.date || '';
          statusRef.current.value = item.status || '';
          responsibleRef.current.value = item.responsible || '';
        }
      })
      .catch(() => {
        setError('Не удалось загрузить данные инцидента.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const validateForm = () => {
    if (!titleRef.current.value.trim() || titleRef.current.value.trim().length < 3) {
      setError('Название должно содержать минимум 3 символа.');
      return false;
    }

    if (!descriptionRef.current.value.trim() || descriptionRef.current.value.trim().length < 5) {
      setError('Описание должно содержать минимум 5 символов.');
      return false;
    }

    if (!locationRef.current.value.trim() || locationRef.current.value.trim().length < 2) {
      setError('Укажите место происшествия.');
      return false;
    }

    if (!dateRef.current.value) {
      setError('Выберите дату.');
      return false;
    }

    if (!statusRef.current.value.trim() || statusRef.current.value.trim().length < 2) {
      setError('Укажите статус инцидента.');
      return false;
    }

    if (!responsibleRef.current.value.trim() || responsibleRef.current.value.trim().length < 2) {
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

    const updatedData = {
      title: titleRef.current.value,
      description: descriptionRef.current.value,
      location: locationRef.current.value,
      date: dateRef.current.value,
      status: statusRef.current.value,
      responsible: responsibleRef.current.value
    };

    setSaving(true);
    setError('');

    axios.put(`http://localhost:5000/incidents/${id}`, updatedData)
      .then(() => {
        alert('Инцидент обновлен!');
        navigate('/');
      })
      .catch(() => {
        setError('Не удалось обновить инцидент. Проверьте работу сервера.');
      })
      .finally(() => {
        setSaving(false);
      });
  };

  return (
    <div>
      <h1>Редактирование инцидента</h1>

      {loading && <p>Загрузка данных...</p>}
      {saving && <p>Сохранение данных...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && (
        <form onSubmit={handleSubmit}>
          <input ref={titleRef} placeholder="Название" required /><br />
          <input ref={descriptionRef} placeholder="Описание" required /><br />
          <input ref={locationRef} placeholder="Место" required /><br />
          <input type="date" ref={dateRef} required /><br />
          <input ref={statusRef} placeholder="Статус" required /><br />
          <input ref={responsibleRef} placeholder="Ответственный" required /><br />

          <button type="submit" disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>
      )}
    </div>
  );
};

export default Detail;