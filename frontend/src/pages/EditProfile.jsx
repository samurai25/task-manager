import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from "../utils/fetchWithAuth";
import Navbar from "../components/Navbar";

const EditProfile = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetchWithAuth("http://localhost:8000/api/v1/users/me/");
        if (response.ok) {
          const data = await response.json();
          setUser(data);
          setUsername(data.username);
          setEmail(data.email);
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

  const handleAvatarChange = (e) => {
    setAvatarFile(e.target.files[0]);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    try {
      const token = localStorage.getItem("access");
      const response = await fetch("http://localhost:8000/api/v1/users/update-profile/", {
        method: "PUT",
        headers: {
          Authorization: `JWT ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setMessage("Профиль успешно обновлён.");
        setMessageType("success");
      } else {
        setMessage("Ошибка при обновлении профиля.");
        setMessageType("danger");
      }
    } catch (err) {
      setMessage("Произошла ошибка.");
      setMessageType("danger");
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      const token = localStorage.getItem("access");
      const response = await fetch("http://localhost:8000/api/v1/users/delete-avatar/", {
        method: "DELETE",
        headers: {
          Authorization: `JWT ${token}`,
        },
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setMessage("Аватар удалён.");
        setMessageType("success");
      } else {
        setMessage("Не удалось удалить аватар.");
        setMessageType("danger");
      }
    } catch (err) {
      setMessage("Произошла ошибка при удалении аватара.");
      setMessageType("danger");
    }
  };

  if (error) return <p>{error}</p>;
  if (!user) return <p>Загрузка...</p>;

  return (
    <div className="container">
      <Navbar />
      <h2>Редактирование профиля</h2>

      {message && (
        <div className={`alert alert-${messageType} mt-3`} role="alert">
          {message}
        </div>
      )}

      <div className="profile mt-3">
        <img
          src={user.avatar ? `http://localhost:8000${user.avatar}` : "/images/default-avatar.png"}
          alt="Аватар"
          style={{ width: "120px", borderRadius: "50%", marginBottom: "10px", objectFit: "cover" }}
        />

        {user.avatar && (
          <button className="btn btn-sm btn-outline-danger mb-3" onClick={handleDeleteAvatar}>
            Удалить аватар
          </button>
        )}

        <form onSubmit={handleProfileUpdate}>
          <div className="mb-3 mt-3">
            <label for="image_uploads">Загрузить аватар (PNG, JPG)</label>
            <input type="file" lang="en" className="form-control" accept=".jpg, .jpeg, .png" onChange={handleAvatarChange} />
          </div>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">Имя пользователя</label>
            <input
              type="text"
              className="form-control"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Почта</label>
            <input
              type="email"
              className="form-control"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Сохранить
          </button>
        </form>
      </div>

      <button className="btn btn-danger mt-4" onClick={handleLogout}>
        Выйти
      </button>
    </div>
  );
};

export default EditProfile;
