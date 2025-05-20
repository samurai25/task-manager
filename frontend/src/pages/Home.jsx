import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Home = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Проверяем, есть ли токен в localStorage
    const accessToken = localStorage.getItem('access');
    
    // Если токен есть, считаем пользователя авторизованным
    if (accessToken) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  return (
    <div className="container">
      {isAuthenticated && (<><Navbar /></>)}
      <h2>Добро пожаловать в Task Manager</h2>
      <p>Это приложение для управления задачами.</p>
      <p>Вы можете создавать, редактировать и удалять задачи.</p>

      {/* Показываем кнопки, если пользователь не авторизован */}
      {!isAuthenticated && (
        <>
          <p>Пожалуйста, войдите или зарегистрируйтесь, чтобы начать.</p>
          <Link to="/login" className="btn btn-primary mb-3">
            Войти
          </Link>
          <br />
          <Link to="/register" className="btn btn-secondary mb-3 ms-2">
            Регистрация
          </Link>
        </>
      )}
    </div>
  );
};

export default Home;
