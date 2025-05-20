import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import Navbar from '../components/Navbar';

const EditTask = () => {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(false);
  const [priority, setPriority] = useState('low'); // Добавляем состояние для приоритета
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTask = async () => {
      const response = await fetchWithAuth(`http://localhost:8000/api/v1/tasks/${id}/`);

      const data = await response.json();

      if (response.ok) {
        setTask(data);
        setTitle(data.title);
        setDescription(data.description);
        setStatus(data.status);
        setPriority(data.priority); 
      } else {
        alert(data.detail || 'Ошибка при загрузке задачи');
      }
    };

    fetchTask();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();

    const response = await fetchWithAuth(`http://localhost:8000/api/v1/tasks/${id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, description, status, priority }), // Добавляем приоритет в запрос
    });

    const data = await response.json();

    if (response.ok) {
      alert('Задача успешно обновлена!');
      navigate('/tasks');
    } else {
      alert(data.detail || 'Ошибка при обновлении задачи');
    }
  };

  if (!task) return <p>Загрузка...</p>;

  return (
    <div className="container">
      <Navbar />
      <h2>Редактирование задачи</h2>
      <div className="task-edit-form">
      <form onSubmit={handleUpdate}>
        <div className="mb-3">
          <label>Название:</label>
          <input
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label>Описание:</label>
          <textarea
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            checked={status}
            onChange={(e) => setStatus(e.target.checked)}
          />
          <label className="form-check-label">Complete</label>
        </div>

        <div className="mb-3">
          <label>Приоритет:</label>
          <select
            className="form-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value)} // Обработчик изменения приоритета
            required
          >
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary">
          Сохранить
        </button>
      </form>
      </div>
    </div>
  );
};

export default EditTask;
