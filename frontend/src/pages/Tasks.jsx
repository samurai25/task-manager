import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import Navbar from "../components/Navbar";
import '../styles/styles.css';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchTasks = async (page = 1) => {
    setIsLoading(true);
    let url = `http://localhost:8000/api/v1/tasks/?page=${page}`;

    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    if (priorityFilter) params.append('priority', priorityFilter);
    if (dateFilter) params.append('created_at', dateFilter);

    if (params.toString()) {
      url += `&${params.toString()}`;
    }

    try {
      const response = await fetchWithAuth(url);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.results);
        setTotalPages(Math.ceil(data.count / 8));
      } else {
        throw new Error("Ошибка при получении задач");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Добавьте функцию для обновления статуса задачи
  const handleStatusChange = async (taskId, currentStatus) => {
    const newStatus = !currentStatus;
    try {
      const response = await fetchWithAuth(`http://localhost:8000/api/v1/tasks/${taskId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Обновите локальное состояние задач после изменения статуса
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId ? { ...task, status: newStatus } : task
          )
        );
      } else {
        throw new Error("Ошибка при изменении статуса задачи");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchTasks(currentPage);
  }, [statusFilter, priorityFilter, dateFilter, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const isNextPageDisabled = currentPage >= totalPages || tasks.length === 0;

  const generatePageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  if (error) {
    return <p>{error}</p>;
  }

  const priorityLabels = {
    low: "Низкий",
    medium: "Средний",
    high: "Высокий",
  };

  return (
    <div className="container">
      <Navbar />
      <h2>Мои задачи</h2>
      {/* Фильтры */}
      <div className="filters mb-4">
        <select
          className="form-select ms-2"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Все статусы</option>
          <option value="true">Выполнена</option>
          <option value="false">Не выполнена</option>
        </select>

        <select
          className="form-select ms-2"
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Все приоритеты</option>
          <option value="low">Низкий</option>
          <option value="medium">Средний</option>
          <option value="high">Высокий</option>
        </select>

        <input
          type="date"
          lang="en"
          className="form-control ms-2"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <Link to="/tasks/create" className="btn btn-primary mb-3">
        Создать задачу
      </Link>

      <div className="tasks-container">
        {isLoading ? (
          <p>Загрузка...</p>
        ) : tasks.length > 0 ? (
          tasks.map((task) => (
            <div className="task-item" key={task.id}>
              <Link to={`/tasks/${task.id}/`}>
                <h4>Название: {task.title.length < 7 ? task.title : <p>{task.title}</p>}</h4>
                <p>Описание: {task.description}</p>
                <p>Статус: {task.status ? "Задача выполнена" : "Задача не выполнена"}</p>
                <p>Приоритет: {priorityLabels[task.priority] || "Неизвестный"}</p>
              </Link>

              {/* Кнопка для изменения статуса */}
              <button
                className="btn btn-secondary"
                onClick={() => handleStatusChange(task.id, task.status)}
              >
                {task.status ? "Задача не выполнена" : "Задача выполнена"}
              </button>
            </div>
          ))
        ) : (
          <p>Нету задач для отображения</p>
        )}
      </div>

      {/* Пагинация */}
      <div className="pagination">
        <button
          className="btn btn-secondary"
          disabled={currentPage <= 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          Назад
        </button>

        <div className="page-numbers">
          {generatePageNumbers().map((pageNumber) => (
            <button
              key={pageNumber}
              className={`btn ${pageNumber === currentPage ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handlePageChange(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
        </div>

        <button
          className="btn btn-secondary"
          disabled={isNextPageDisabled}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Вперед
        </button>
      </div>
    </div>
  );
};

export default Tasks;
