import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from "../utils/fetchWithAuth";
import Navbar from "../components/Navbar";
import '../styles/styles.css';

const CreateTask = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(false);
  const [priority, setPriority] = useState("low");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const taskData = { title, description, status, priority };

    try {
      const response = await fetchWithAuth('http://localhost:8000/api/v1/tasks/', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        navigate('/tasks');
      } else {
        throw new Error("Ошибка при создании задачи");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <Navbar />
      <h2>Создание задачи</h2>

      {error && <p className="text-danger">{error}</p>}

      <div className="create-task-form">
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="title" className="form-label">Название</label>
          <input
            type="text"
            className="form-control"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="description" className="form-label">Описание</label>
          <textarea
            className="form-control"
            id="description"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

        <div className="mb-3">
          <label htmlFor="priority" className="form-label">Приоритет</label>
          <select
            id="priority"
            className="form-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="status" className="form-label">Статус</label>
          <input
            type="checkbox"
            className="form-check-input"
            id="status"
            checked={status}
            onChange={(e) => setStatus(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="status">
            Выполнена
          </label>
        </div>

        <button type="submit" className="btn btn-primary">Создать задачу</button>
      </form>
      </div>
    </div>
  );
};

export default CreateTask;
