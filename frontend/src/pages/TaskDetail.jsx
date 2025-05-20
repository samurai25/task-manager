import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import '../styles/styles.css';
import Navbar from "../components/Navbar";

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await fetchWithAuth(`http://localhost:8000/api/v1/tasks/${id}/`);
        if (response.ok) {
          const data = await response.json();
          setTask(data);
        } else {
          setError("Ошибка при загрузке задачи");
        }
      } catch (error) {
        setError("Произошла ошибка при загрузке данных");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Удалить задачу?")) return;

    try {
      const response = await fetchWithAuth(`http://localhost:8000/api/v1/tasks/${id}/`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Задача удалена");
        navigate("/tasks");
      } else {
        alert("Ошибка при удалении задачи");
      }
    } catch (error) {
      console.error("Ошибка при удалении задачи", error);
      alert("Произошла ошибка");
    }
  };

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="container">
    <Navbar />
    <h2>Задача</h2>
    <div className="task-detail">
      <h2>{task.title}</h2>
      <p><strong>Описание:</strong> {task.description || "Нет описания"}</p>
      <p><strong>Приоритет:</strong> {task.priority}</p>
      <p><strong>Создана:</strong> {task.created_at}</p>
      <p><strong>Статус:</strong> {task.status ? "Задача выполнена" : "Задача не выполнена"}</p>

      <div className="task-buttons mt-3">
        <Link to={`/tasks/${task.id}/edit`} className="btn btn-primary">
          Редактировать
        </Link>
        <button className="btn btn-danger" onClick={handleDelete}>
          Удалить
        </button>
      </div>

      <button onClick={() => navigate("/tasks")} className="btn btn-link mt-3">
        ← Назад
      </button>
    </div>
    </div>
  );
};

export default TaskDetail;
