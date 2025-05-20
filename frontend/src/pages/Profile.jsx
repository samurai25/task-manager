import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from "../utils/fetchWithAuth";  // Твоя функция для работы с авторизацией
import { Navigate } from 'react-router-dom';
import Navbar from "../components/Navbar";
import { Link } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const navigate = useNavigate();
  const isAuthenticated = true;

  useEffect(() => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
  }, [isAuthenticated]);

  // Получаем данные пользователя
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetchWithAuth("http://localhost:8000/api/v1/users/me/");
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          throw new Error("Ошибка получения данных пользователя");
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUsername('');
    navigate('/login');
  };

  if (error) {
    return <p>{error}</p>;
  }

  if (!user) {
    return <p>Загрузка...</p>;
  }


  const defaultAvatar = "/images/default-avatar.png"; 

  return (
    <div className="container">
      <Navbar />
      <h2>Профиль</h2>
      <div className="profile">
        <img
          src={user.avatar ? `http://localhost:8000${user.avatar}` : defaultAvatar}
          alt="Avatar"
          style={{ width: "120px", borderRadius: "50%", marginBottom: "10px" }}
        />
        <p><strong>Имя пользователя:</strong> {user.username}</p>
        <p><strong>Почта:</strong> {user.email}</p>

        <Link to="/edit-profile" className="btn btn-primary mt-3">
          Редактировать
        </Link>
      </div>

      <button className="btn btn-danger mt-3" onClick={handleLogout}>
        Выйти
      </button>
    </div>
  );
};

export default Profile;
