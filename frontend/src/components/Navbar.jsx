import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem('access');

    if (accessToken) {
      setIsAuthenticated(true);

      // Получаем данные пользователя, включая аватар
      fetch("http://localhost:8000/api/v1/users/me/", {
        method: "GET",
        headers: {
          Authorization: `JWT ${accessToken}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Ошибка при загрузке профиля");
          return res.json();
        })
        .then((data) => {
          setUsername(data.username);
          setAvatarUrl(data.avatar ? `http://localhost:8000${data.avatar}` : null);
          localStorage.setItem('username', data.username);
        })
        .catch((err) => {
          console.error(err);
          setIsAuthenticated(false);
        });
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUsername('');
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg bg-dark navbar-dark border-bottom border-body" data-bs-theme="dark">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">Task Manager</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
          <ul className="navbar-nav ms-auto d-flex align-items-center gap-3">
            {isAuthenticated ? (
              <>
                <li className="nav-item d-flex align-items-center">
                  {avatarUrl && (
                    <img
                      src={avatarUrl}
                      alt="avatar"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        marginRight: '8px',
                      }}
                    />
                  )}
                  <Link className="nav-link active" to="/profile">{username}</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/tasks">Мои Задачи</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/">О Сайте</Link>
                </li>
                <li className="nav-item">
                  <button className="btn btn-outline-light" onClick={handleLogout}>Выйти</button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Войти</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">Регистрация</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
