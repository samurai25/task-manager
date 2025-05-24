### Task Manager

**Task Manager API** — это RESTful API-сервис для управления задачами пользователей, разработанный с использованием **Django**, **Django REST Framework** и **JWT-аутентификации**. Проект предоставляет удобный и безопасный способ для:

- регистрации и входа пользователей,
- создания, редактирования и удаления задач,
- фильтрации задач по дате создания,
- получения задач с пагинацией,
- загрузки и обновления аватара пользователя.

Это универсальное решение может выступать как основа для:
- трекера задач (To-Do),
- системы управления проектами,
- трекера привычек и личной эффективности,
- или встраиваемого API в более крупное приложение.

Для удобства разработчиков доступна автоматически генерируемая документация API через Swagger UI (drf-spectacular).

### Стек технологий

- Backend: Django, Django REST Framework, PostgreSQL

- Frontend: React (Vite), Bootstrap, Fetch API

- DevOps: Docker, GitHub Actions

- Прочее: JWT (аутентификация), dotenv


### File Description
- frontend/public/images/default-avatar.png: image for profile's default avatar.
- frontend/src/components/Navbar.jsx: navbar component
    ```jsx
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
                        <Link className="nav-link" to="/">Home</Link>
                        </li>
                        <li className="nav-item">
                        <Link className="nav-link" to="/tasks">Задачи</Link>
                        </li>
                        <li className="nav-item">
                        <button className="btn btn-outline-light" onClick={handleLogout}>Выйти</button>
                        </li>
                    </>
                    ) : (
                    <>
                        <li className="nav-item">
                        <Link className="nav-link" to="/">Home</Link>
                        </li>
                        <li className="nav-item">
                        <Link className="nav-link" to="/login">Войти</Link>
                        </li>
                        <li className="nav-item">
                        <Link className="nav-link" to="/register">Зарегистрироваться</Link>
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


- frontend/src/components/ProtectedRoute.jsx : component for private routes
    ```jsx
    import React from 'react';
    import { Navigate } from 'react-router-dom';

    const ProtectedRoute = ({ children }) => {
    const accessToken = localStorage.getItem('access');

    if (!accessToken) {
        // Если токен отсутствует, перенаправляем на страницу входа
        return <Navigate to="/login" replace />;
    }

    return children; // Если токен есть, рендерим переданный компонент
    };

    export default ProtectedRoute;

- frontend/src/hooks/useAutoRefreshToken.js: refresh token automatically
    ```js
    import { useEffect } from "react";

    const useAutoRefreshToken = () => {
    useEffect(() => {
        const refresh = localStorage.getItem("refresh");

        if (!refresh) return; // Не запускаем, если пользователь не авторизован

        const refreshToken = () => {
        fetch("http://localhost:8000/api/v1/token/refresh/", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify({ refresh }),
        })
            .then((res) => {
            if (!res.ok) {
                throw new Error("Не удалось обновить токен");
            }
            return res.json();
            })
            .then((data) => {
            localStorage.setItem("access", data.access);
            })
            .catch((err) => {
            console.error("Ошибка при обновлении токена:", err);
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            });
        };

        refreshToken(); // Обновим сразу при запуске

        const interval = setInterval(refreshToken, 5 * 60 * 1000); // каждые 5 минут

        return () => clearInterval(interval); // Очистим интервал при размонтировании
    }, []);
    };

    export default useAutoRefreshToken;


- frontend/src/pages/CreateTask.jsx: page for creating a new task
    ```jsx
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
            <label htmlFor="title" className="form-label">Заголовок</label>
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
                Завершено
            </label>
            </div>

            <button type="submit" className="btn btn-primary">Создать задачу</button>
        </form>
        </div>
        </div>
    );
    };

    export default CreateTask;

- frontend/src/pages/EditProfile.jsx: page for editing a profile
    ```jsx
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
        localStorage.removeItem("access");
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
                <label htmlFor="avatar" className="form-label">Загрузить новый аватар</label>
                <input type="file" className="form-control" onChange={handleAvatarChange} />
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
                <label htmlFor="email" className="form-label">Email</label>
                <input
                type="email"
                className="form-control"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <button type="submit" className="btn btn-primary">
                Сохранить изменения
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


- frontend/src/pages/EditTask.jsx: page for editing a task
    ```jsx
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
            setPriority(data.priority); // Загружаем приоритет
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
                <h2>Редактировать задачу</h2>
                <div className="task-edit-form">
                <form onSubmit={handleUpdate}>
                    <div className="mb-3">
                    <label>Title:</label>
                    <input
                        className="form-control"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    </div>
                    <div className="mb-3">
                    <label>Description:</label>
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

                    {/* Добавляем поле для выбора приоритета */}
                    <div className="mb-3">
                    <label>Priority:</label>
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
                    Save
                    </button>
                </form>
                </div>
            </div>
        );
    };

    export default EditTask;

- frontend/src/pages/Home.jsx: home page
    ```jsx 
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
                Зарегистрироваться
            </Link>
            </>
        )}
        </div>
    );
    };

    export default Home;

- frontend/src/pages/Login.jsx: login page
    ```jsx
    import React, { useState } from 'react';
    import { useNavigate, Link } from 'react-router-dom';
    import Navbar from '../components/Navbar';

    const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // Новый стейт для загрузки
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true); // Показываем спиннер

        try {
        const response = await fetch('http://localhost:8000/api/v1/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('access', data.access);
            localStorage.setItem('refresh', data.refresh);
            localStorage.setItem('username', username);
            navigate('/tasks');
        } else {
            setError(data.detail || 'Неверный логин или пароль');
        }
        } catch (err) {
        setError('Ошибка подключения к серверу');
        console.error('Login error:', err);
        } finally {
        setLoading(false); // Скрываем спиннер
        }
    };

    return (
        <div className="container">
        <Navbar />
        <h2>Вход</h2>
        <div className="login">
            <form onSubmit={handleLogin}>
            <div className="mb-3">
                <label>Логин:</label>
                <input
                className="form-control"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                />
            </div>
            <div className="mb-3">
                <label>Пароль:</label>
                <input
                className="form-control"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                />
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                {error}
                </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                <>
                    <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                    ></span>
                    Вход...
                </>
                ) : (
                'Войти'
                )}
            </button>
            </form>
        </div>
        <div className="mt-3">
            <Link to="/forgot-password">Забыли пароль?</Link>
        </div>
        </div>
    );
    };

    export default Login;

- fronend/src/pages/Home.jsx: home page
    ```jsx
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
                Зарегистрироваться
            </Link>
            </>
        )}
        </div>
    );
    };

    export default Home;


- frontend/src/pages/Profile.jsx: page for user profile
    ```jsx
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
        localStorage.removeItem("access");
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
        <h2>Профиль пользователя</h2>
        <div className="profile">
            <img
            src={user.avatar ? `http://localhost:8000${user.avatar}` : defaultAvatar}
            alt="Аватар"
            style={{ width: "120px", borderRadius: "50%", marginBottom: "10px" }}
            />
            <p><strong>Имя:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>

            <Link to="/edit-profile" className="btn btn-primary mt-3">
            Редактировать профиль
            </Link>
        </div>

        <button className="btn btn-danger mt-3" onClick={handleLogout}>
            Выйти
        </button>
        </div>
    );
    };

    export default Profile;

- frontend/src/pages/Register.jsx: page for register new user
    ```jsx
    import React, { useState } from 'react';
    import { useNavigate } from 'react-router-dom';
    import Navbar from '../components/Navbar';
    const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState(''); 
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== password2) {
        setError('Пароли не совпадают');
        return;
        }

        const userData = { username, email, password, password2 };

        try {
        const response = await fetch('http://localhost:8000/api/v1/register/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (response.ok) {
            navigate('/login');
        } else {
            setError(data.detail || 'Ошибка регистрации');
        }
        } catch (error) {
        setError('Произошла ошибка при регистрации');
        console.error(error);
        }
    };

    return (
        <div className="container">
        <Navbar />
        <h2>Регистрация</h2>
        <div className="register">
        <form onSubmit={handleSubmit}>
            <div>
            <label>Username</label>
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />
            </div>
            <div>
            <label>Email</label>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            </div>
            <div>
            <label>Password</label>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            </div>
            <div>
            <label>Confirm Password</label>
            <input
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
            />
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>} {/* Отображение ошибки */}
            <button type="submit">Зарегистрироваться</button>
        </form>
        </div>
        </div>
    );
    };

    export default Register;

- frontend/src/pages/RequestPasswordReset.jsx: page for sending an email for reseting password
    ```jsx
    import React, { useState } from 'react';
    import Navbar from '../components/Navbar';

    const ResetPassword = () => {
    const [email, setEmail] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMessage('');
        setErrorMessage('');

        try {
        const response = await fetch('http://localhost:8000/api/v1/reset-password/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
            setSuccessMessage('Письмо с инструкцией отправлено на email.');
        } else {
            setErrorMessage(data.detail || 'Ошибка при отправке запроса.');
        }
        } catch (error) {
        console.error('Ошибка:', error);
        setErrorMessage('Ошибка подключения к серверу.');
        }
    };

    return (
        <div className="container">
        <Navbar />
        <h2>Восстановление пароля</h2>
        <div className="reset-password-form">
            <form onSubmit={handleSubmit}>
            <div className="mb-3">
                <label>Email:</label>
                <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                />
            </div>
            <button type="submit" className="btn btn-primary">Отправить</button>
            </form>
        </div>

        {/* Сообщения об успехе и ошибке */}
        {successMessage && (
            <div className="alert alert-success mt-3" role="alert">
            {successMessage}
            </div>
        )}
        {errorMessage && (
            <div className="alert alert-danger mt-3" role="alert">
            {errorMessage}
            </div>
        )}
        </div>
    );
    };

    export default ResetPassword;

- frontend/src/pages/ResetPasswordConfirm.jsx: page for entering new password
    ```jsx
    import React, { useState, useEffect } from 'react';
    import { useParams, useNavigate } from 'react-router-dom';
    import Navbar from '../components/Navbar';

    const ResetPasswordConfirm = () => {
    const { uidb64, token } = useParams(); 
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    console.log('uidb64:', uidb64, 'token:', token);
    useEffect(() => {
        console.log('uidb64:', uidb64);  
        console.log('token:', token); 
    }, [uidb64, token]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Проверка совпадения паролей
        if (password !== confirmPassword) {
        setError('Пароли не совпадают');
        return;
        }

        const data = {
        uid: uidb64,  
        token: token,  
        password: password,  
        };

        console.log('Отправляем данные:', data);
        
        try {
        const response = await fetch('http://localhost:8000/api/v1/reset-password-confirm/', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            setSuccess(true);
            setError('');
            setTimeout(() => {
            navigate('/login'); 
            }, 2000);
        } else {
            const result = await response.json();
            setError(result.detail || 'Ошибка сброса пароля');
        }
        } catch (err) {
        setError('Ошибка соединения');
        }
    };

    return (
        <div className="container">
        <Navbar />
        <h2>Сброс пароля</h2>
        <div className="reset-password-confirm">
        {success ? (
            <div className="alert alert-success">Пароль успешно изменен. Перенаправляем на страницу входа...</div>
        ) : (
            <form onSubmit={handleSubmit}>
            <div className="mb-3">
                <label>Новый пароль</label>
                <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                />
            </div>
            <div className="mb-3">
                <label>Подтвердите новый пароль</label>
                <input
                type="password"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                />
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <button type="submit" className="btn btn-primary">
                Сбросить пароль
            </button>
            </form>
        )}
        </div>
        </div>
    );
    };

    export default ResetPasswordConfirm;


- frontend/src/pages/TaskDetail.jsx: page for viewing task detail
    ```jsx
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
        <h2>Детали задачи</h2>
        <div className="task-detail">
        <h2>{task.title}</h2>
        <p><strong>Описание:</strong> {task.description || "Нет описания"}</p>
        <p><strong>Приоритет:</strong> {task.priority}</p>
        <p><strong>Дата создания:</strong> {task.created_at}</p>
        <p><strong>Статус:</strong> {task.status ? "Завершена" : "Не завершена"}</p>

        <div className="task-buttons mt-3">
            <Link to={`/tasks/${task.id}/edit`} className="btn btn-primary me-2">
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

- frontend/src/pages/Tasks.jsx: page displays tasks
    ```jsx
    import React, { useEffect, useState } from "react";
    import { Link } from "react-router-dom";
    import { fetchWithAuth } from "../utils/fetchWithAuth";
    import Navbar from "../components/Navbar";
    import '../styles/styles.css';

    const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [error, setError] = useState(null);
    const [totalPages, setTotalPages] = useState(10);
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
            setTotalPages(Math.ceil(data.count / 3));
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

    return (
        <div className="container">
        <Navbar />
        <h2>Задачи</h2>
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
            <option value="true">Завершено</option>
            <option value="false">Не завершено</option>
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
                    <h4>Title: {task.title}</h4>
                    <p>Description: {task.description}</p>
                    <p>Status: {task.status ? "Complete" : "Incomplete"}</p>
                    <p>Priority: {task.priority}</p>
                </Link>

                {/* Кнопка для изменения статуса */}
                <button
                    className="btn btn-secondary"
                    onClick={() => handleStatusChange(task.id, task.status)}
                >
                    {task.status ? "Отметить как не завершённую" : "Отметить как завершённую"}
                </button>
                </div>
            ))
            ) : (
            <p>Нет задач для отображения</p>
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

- frontend/src/styles/styles.css: styles for task manager
    ```css
    /* ========== Base ========== */
    html, body {
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: Arial, sans-serif;
    background-color: #333;
    color: #333;
    text-align: center;
    }

    .container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    min-width: 100vw;
    color: white;
    background-color: #333;
    }

    .navbar {
    position: fixed !important;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background-color: #db0909;
    color: #f5f5f5;
    }

    /* ========== Headings ========== */
    h2 {
    font-size: 2rem;
    color: #f5f5f5;
    margin: 40px 0 20px;
    }

    /* ========== Forms (login, register, reset, profile, task forms) ========== */
    .form-box,
    .login,
    .register,
    .reset-password-form,
    .reset-password-confirm,
    .profile,
    .create-task-form,
    .task-edit-form,
    .task-detail {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin: 20px auto 0;
    padding: 20px;
    max-width: 400px;
    background-color: #444;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    }

    .login,
    .register {
    padding: 25px;
    }

    /* Input Fields */
    .login input, .reset-password-form input,
    .register input, .profile input,
    .create-task-form input, .task-edit-form input,
    .create-task-form textarea, .task-edit-form textarea,
    .create-task-form select, .task-edit-form select,
    .container select,
    .container input,
    textarea,
    select {
    background-color: #444;
    color: #f5f5f5;
    border: 1px solid #555;
    border-radius: 4px;
    padding: 10px;
    margin-bottom: 10px;
    font-size: 18px;
    width: 320px;
    }

    .login input:focus, .reset-password-form input:focus,
    .register input:focus, .profile input:focus,
    .create-task-form input:focus, .task-edit-form input:focus,
    .create-task-form textarea:focus, .task-edit-form textarea:focus,
    .create-task-form select:focus, .task-edit-form select:focus,
    .reset-password-confirm input:focus,
    textarea:focus,
    select:focus {
    outline: none;
    border-color: #0088ff;
    box-shadow: 0 0 5px #0088ff;
    background-color: #555;
    color: #f5f5f5;
    }

    /* Buttons */
    button {
    background-color: #0088ff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 18px;
    width: 250px;
    }

    button:hover {
    background-color: #0070d1;
    }

    /* ========== Task View ========== */
    .tasks-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 20px;
    padding: 20px;
    background-color: #333;
    }

    .task-item {
    background-color: #333;
    border: 1px solid #555;
    border-radius: 8px;
    padding: 20px;
    width: 300px;
    color: #f5f5f5;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    transition: background-color 0.3s ease;
    }

    .task-item a {
    text-decoration: none;
    }

    .task-item:hover {
    background-color: #444;
    }

    .task-item input,
    .task-item textarea {
    width: 100%;
    }

    /* Task Title and Description */
    .task-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #f5f5f5;
    }

    .task-detail {
    background-color: #444;
    font-size: 1rem;
    color: #ddd;
    border: 1px solid #555;
    border-radius: 4px;
    padding: 10px;
    max-width: 350px;
    margin: 0 auto;
    position: relative;
    top: 50px;
    text-align: left;
    }

    .task-detail p {
    margin: 0;
    padding: 0;
    color: #f5f5f5;
    line-height: 1.5;
    }

    /* Task Buttons */
    .task-buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
    width: 400px;
    }
    .task-buttons button,  .task-buttons a {
    margin-right: 10px;
    margin-top: 10px;
    width: 200px;
    }

    .task-buttons .btn-primary {
    background-color: #007bff;
    border: 1px solid #007bff;
    }

    .task-buttons .btn-danger {
    background-color: #dc3545;
    border: 1px solid #c82333;
    }

    .task-buttons .btn-danger:hover {
    background-color: #c82333;
    border: 1px solid #bd2130;
    }

    .task-buttons .btn-link {
    color: #f5f5f5;
    }

    /* ========== Filters ========== */
    .filters {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
    flex-wrap: wrap;
    }

    .filters input,
    .filters select,
    .filters .form-control,
    .filters .form-select {
    max-width: 250px;
    width: 200px;
    margin-right: 10px;
    }

    /* ========== Pagination ========== */
    .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
    padding: 20px;
    background-color: #333;
    }

    .pagination button {
    width: 100px;
    }

    .page-numbers {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: row;
    }

    .page-numbers button {
    margin: 0 5px;
    width: 40px;
    }

    .page-numbers button:hover {
    background-color: #0077ff;
    color: white;
    }

    .page-numbers .btn-primary {
    background-color: #00aaff;
    color: white;
    font-weight: bold;
    }

    .page-numbers .btn-secondary {
    background-color: #ebebeb;
    color: #6c757d;
    }

    /* ========== Misc ========== */
    ul {
    list-style: none;
    padding: 0;
    margin: 0;
    }

    .form-check-input {
    width: 10px !important;
    margin: 5px;
    }


    /* ========== Responsive ========== */
    @media only screen and (max-width: 768px) {
    .tasks-container,
    .filters {
        flex-direction: column;
        align-items: center;
        gap: 10px;
    }
    }


- frontend/stc/utils/fetchWithAuth.jsx: This function fetchWithAuth automatically attaches a JWT access token to requests, refreshes the token on a 401 error, and redirects to the login page if the refresh token is invalid.

    ```jsx
    export async function fetchWithAuth(url, options = {}) {
    const access = localStorage.getItem('access');
    const refresh = localStorage.getItem('refresh');

    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `JWT ${access}`,
        'Content-Type': 'application/json',
      },
    });
  
    if (response.status === 401 && refresh) {
      const refreshResponse = await fetch('http://localhost:8000/api/v1/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
  
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        localStorage.setItem('access', data.access);
  
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `JWT ${data.access}`,
            'Content-Type': 'application/json',
          },
        });
      } else {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('username');
        window.location.href = '/login';
      }
    }
  
    return response;
  }

- frontend/src/App.jsx: renders pages
    ```jsx
    import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
    import Navbar from './components/Navbar';
    import Login from './pages/Login';
    import Register from './pages/Register';
    import Tasks from './pages/Tasks';
    import CreateTask from './pages/CreateTask';
    import EditTask from './pages/EditTask';
    import Home from './pages/Home';
    import TaskDetail from './pages/TaskDetail';
    import Profile from "./pages/Profile";
    import EditProfile from './pages/EditProfile';
    import RequestPasswordReset from './pages/RequestPasswordReset';
    import ResetPasswordConfirm from './pages/ResetPasswordConfirm';
    import ProtectedRoute from './components/ProtectedRoute';
    import useAutoRefreshToken from './hooks/useAutoRefreshToken';

    function App() {
        useAutoRefreshToken();
        
        return (
            <div className="container">
                <Router>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
            
                        {/* Защищенные маршруты */}
                        <Route 
                        path="/profile"
                        element={
                            <ProtectedRoute>
                            <Profile />
                            </ProtectedRoute>
                        }
                        />
                        <Route
                        path="/edit-profile"
                        element={
                            <ProtectedRoute>
                            <EditProfile />
                            </ProtectedRoute>
                        }
                        />
                        <Route
                        path="/tasks"
                        element={
                            <ProtectedRoute>
                            <Tasks />
                            </ProtectedRoute>
                        }
                        />
                        <Route
                        path="/tasks/create"
                        element={
                            <ProtectedRoute>
                            <CreateTask />
                            </ProtectedRoute>
                        }
                        />
                        <Route
                        path="/tasks/:id/edit"
                        element={
                            <ProtectedRoute>
                            <EditTask />
                            </ProtectedRoute>
                        }
                        />
                        <Route
                        path="/tasks/:id/"
                        element={
                            <ProtectedRoute>
                            <TaskDetail />
                            </ProtectedRoute>
                        }
                        />
                        <Route path="/forgot-password" element={<RequestPasswordReset />} />
                        <Route path="/reset-password-confirm/:uidb64/:token/" element={<ResetPasswordConfirm />} />
                    </Routes>
                </Router>
            </div>
        );
    }

    export default App;


- frontend/src/main.jsx: renders App.jsx
    ```jsx
    import { StrictMode } from 'react'
    import { createRoot } from 'react-dom/client'
    import App from './App.jsx'

    createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>,
    )

- media/avatars/: folder contains users's avatars

- task_manager: Django project
- task_manager/settings.py: updated settings file
    ```python
    import os
    from pathlib import Path
    from datetime import timedelta
    from decouple import config

    INSTALLED_APPS = [
        'tasks.apps.TasksConfig',
        'django.contrib.admin',
        'django.contrib.auth',
        'django.contrib.contenttypes',
        'django.contrib.sessions',
        'django.contrib.messages',
        'django.contrib.staticfiles',
        'rest_framework',
        'rest_framework.authtoken',
        'rest_framework_simplejwt',
        'django_extensions',
        'corsheaders',
        'users',
        'drf_spectacular',
    ]

    # CORS settings
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
    ]

    # PostgreSQL database settings
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'task_manager'),
            'USER': os.getenv('DB_USER', 'task_manager_user'),
            'PASSWORD': os.getenv('DB_PASSWORD', 'task_manager_password'),
            'HOST': os.getenv('DB_HOST', 'db'),
            'PORT': '5432',
        }
    }

    # Internationalization
    TIME_ZONE = 'Europe/Kyiv'

    # Static files (CSS, JavaScript, Images)
    STATIC_ROOT = BASE_DIR / 'staticfiles'
    STATIC_URL = '/static/'
    STATICFILES_DIRS = [
        BASE_DIR / "static",
    ]

    DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

    # settings for DRF
    REST_FRAMEWORK = {
        'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.LimitOffsetPagination',
        'PAGE_SIZE': 5,
        'DEFAULT_PERMISSION_CLASSES': [
            'rest_framework.permissions.AllowAny',
        ],
        'DEFAULT_AUTHENTICATION_CLASSES': (
            'rest_framework_simplejwt.authentication.JWTAuthentication',
        ),
        'DATETIME_FORMAT': "%d.%m.%Y",
        'EXCEPTION_HANDLER': 'users.utils.custom_exception_handler',
        'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    }

    LOGGING = {
        'version': 1,
        'disable_existing_loggers': False,
        'handlers': {
            'file': {
                'level': 'ERROR',
                'class': 'logging.FileHandler',
                'filename': 'errors.log',
            },
        },
        'loggers': {
            'django': {
                'handlers': ['file'],
                'level': 'ERROR',
                'propagate': True,
            },
        },
    }

    # settings for JWT
    SIMPLE_JWT = {
        "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),
        "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
        "ROTATE_REFRESH_TOKENS": False,
        "BLACKLIST_AFTER_ROTATION": False,
        "UPDATE_LAST_LOGIN": False,

        "ALGORITHM": "HS256",
        "SIGNING_KEY": SECRET_KEY,
        "VERIFYING_KEY": "",
        "AUDIENCE": None,
        "ISSUER": None,
        "JSON_ENCODER": None,
        "JWK_URL": None,
        "LEEWAY": 0,

        "AUTH_HEADER_TYPES": ("JWT",),
        "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
        "USER_ID_FIELD": "id",
        "USER_ID_CLAIM": "user_id",
        "USER_AUTHENTICATION_RULE": "rest_framework_simplejwt.authentication.default_user_authentication_rule",

        "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
        "TOKEN_TYPE_CLAIM": "token_type",
        "TOKEN_USER_CLASS": "rest_framework_simplejwt.models.TokenUser",

        "JTI_CLAIM": "jti",

        "SLIDING_TOKEN_REFRESH_EXP_CLAIM": "refresh_exp",
        "SLIDING_TOKEN_LIFETIME": timedelta(minutes=5),
        "SLIDING_TOKEN_REFRESH_LIFETIME": timedelta(days=1),

        "TOKEN_OBTAIN_SERIALIZER": "rest_framework_simplejwt.serializers.TokenObtainPairSerializer",
        "TOKEN_REFRESH_SERIALIZER": "rest_framework_simplejwt.serializers.TokenRefreshSerializer",
        "TOKEN_VERIFY_SERIALIZER": "rest_framework_simplejwt.serializers.TokenVerifySerializer",
        "TOKEN_BLACKLIST_SERIALIZER": "rest_framework_simplejwt.serializers.TokenBlacklistSerializer",
        "SLIDING_TOKEN_OBTAIN_SERIALIZER": "rest_framework_simplejwt.serializers.TokenObtainSlidingSerializer",
        "SLIDING_TOKEN_REFRESH_SERIALIZER": "rest_framework_simplejwt.serializers.TokenRefreshSlidingSerializer",
    }


    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
    DEFAULT_FROM_EMAIL = "noreply@example.com"

    # Настройка SMTP для отправки писем
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = 'smtp.gmail.com'
    EMAIL_USE_TLS = True
    EMAIL_PORT = 587
    EMAIL_HOST_USER = config("EMAIL_HOST_USER")
    EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD")
    EMAIL_FROM_EMAIL = config("EMAIL_FROM_EMAIL")
    EMAIL_SUBJECT_PREFIX = 'Password Recovery'

    LOGOUT_REDIRECT_URL = '/login/'
    LOGIN_REDIRECT_URL = '/'
    LOGIN_URL = '/login/'

    AUTH_USER_MODEL = 'users.CustomUser'

    MEDIA_URL = '/media/'
    MEDIA_ROOT = os.path.join(BASE_DIR, 'media')


    # Для pytest-django
    TEST_RUNNER = 'django.test.runner.DiscoverRunner'

    SPECTACULAR_SETTINGS = {
        'TITLE': 'Your API Title',
        'DESCRIPTION': 'Description of your API',
        'VERSION': '1.0.0',
        'SERVE_INCLUDE_SCHEMA': False, 
    }

- task_manager/urls.py: file contains urls for tasks, users, swagger, register, obtaining token and refreshing token.
    ```python
    from django.contrib import admin
    from django.urls import include, path, re_path
    from rest_framework import routers
    from tasks.views import *
    from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
    from django.conf import settings
    from django.conf.urls.static import static
    from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

    router = routers.DefaultRouter()
    router.register(r'tasks', TaskViewSet, basename='tasks')
    router.register(r'register', RegisterViewSet, basename='register')

    urlpatterns = [
        path('api/v1/', include(router.urls)),
        path('', include("tasks.urls")),
        path('api/v1/users/', include('users.urls')),
        path('admin/', admin.site.urls),
        path('api/v1/tasks-auth/', include('rest_framework.urls')),
        path('api/v1/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
        path('api/v1/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
        path('api/v1/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
        path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
        path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    ] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

    if settings.DEBUG:
        urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

- tasks: this folder is the tasks application.
- tasks/admin.py: add resister for Task, Category models
    ```python
    from .models import Task, Category
    admin.site.register(Task)
    admin.site.register(Category)

- tasks/models.py: create models Task, Category
    ```python
    from django.db import models
    from django.conf import settings
    class Task(models.Model):
        STATUS_CHOICES = [
            (True, 'Completed'),
            (False, 'Incomplete')
        ]
        
        PRIORITY_CHOICES = [
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High')
        ]
        
        title = models.CharField(max_length=255)
        description = models.TextField()
        status = models.BooleanField(choices=STATUS_CHOICES, default=False)
        priority = models.CharField(max_length=6, choices=PRIORITY_CHOICES, default='low')
        created_at = models.DateTimeField(auto_now_add=True)
        updated_at = models.DateTimeField(auto_now=True)
        user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='tasks', on_delete=models.CASCADE)

        def __str__(self):
            return self.title
        
        
    class Category(models.Model):
        name = models.CharField(max_length=100, db_index=True)
        def __str__(self):
            return self.name


- tasks/permissions.py: permissions for viewsets
    ```python
    from rest_framework import permissions

    class IsAdminOrReadOnly(permissions.BasePermission):
        def has_permission(self, request, view):
            if request.method in permissions.SAFE_METHODS:
                return True
            
            return bool(request.user and request.user.is_staff)
        

    class IsOwnerOrReadOnly(permissions.BasePermission):
        def has_object_permission(self, request, view, obj):
            return obj.user == request.user


- tasks/serializers.py: file with serializers for TaskViewSet, RegisterViewSet
    ```python
    from rest_framework import serializers
    from django.contrib.auth import get_user_model
    User = get_user_model()

    from .models import Task

    class TaskSerializer(serializers.ModelSerializer):
        user = serializers.HiddenField(default=serializers.CurrentUserDefault())
        
        class Meta:
            model = Task
            fields = "__all__"


    class RegisterSerializer(serializers.ModelSerializer):
        password2 = serializers.CharField(write_only=True)

        class Meta:
            model = User

            fields = ('username', 'email', 'password', 'password2')
            extra_kwargs = {'password': {'write_only': True}}

        def validate(self, attrs):
            if attrs['password'] != attrs['password2']:
                raise serializers.ValidationError({"password": "Пароли не совпадают"})
            return attrs

        def create(self, validated_data):
            validated_data.pop('password2')
            user = User.objects.create_user(**validated_data)
            return user

- tasks/tests.py: tests for tasks app
    ```python
    from django.test import TestCase
    from django.contrib.auth import get_user_model
    from rest_framework.test import APITestCase
    from rest_framework import status
    from rest_framework_simplejwt.tokens import RefreshToken

    User = get_user_model()

    class UserRegistrationTestCase(APITestCase):

        def test_registration_success(self):
            data = {
                "username": "testuser",
                "email": "test@example.com",
                "password": "securepassword",
                "password2": "securepassword"
            }
            response = self.client.post("/api/v1/register/", data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertIn("access", response.data)
            self.assertIn("refresh", response.data)

        def test_registration_password_mismatch(self):
            data = {
                "username": "testuser",
                "email": "test@example.com",
                "password": "securepassword",
                "password2": "wrongpassword"
            }
            response = self.client.post("/api/v1/register/", data)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn("details", response.data)
            self.assertIn("password", response.data["details"])

        def test_registration_existing_user(self):
            User.objects.create_user(username="testuser", email="test@example.com", password="securepassword")
            data = {
                "username": "testuser",
                "email": "test@example.com",
                "password": "securepassword",
                "password2": "securepassword"
            }
            response = self.client.post("/api/v1/register/", data)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn("details", response.data)
            self.assertIn("username", response.data["details"])

    class JWTAuthTestCase(APITestCase):

        def setUp(self):
            self.user = User.objects.create_user(username="testuser", password="securepassword")

        def test_login_success(self):
            data = {
                "username": "testuser",
                "password": "securepassword"
            }
            response = self.client.post("/api/v1/token/", data)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn("access", response.data)
            self.assertIn("refresh", response.data)

        def test_login_fail_invalid_credentials(self):
            data = {
                "username": "testuser",
                "password": "wrongpassword"
            }
            response = self.client.post("/api/v1/token/", data)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        def test_token_refresh(self):
            refresh = RefreshToken.for_user(self.user)
            data = {"refresh": str(refresh)}
            response = self.client.post("/api/v1/token/refresh/", data)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn("access", response.data)


- tasks/urls.py: urls for tasks apps
    ```python
    from . import views
    from rest_framework.routers import DefaultRouter
    from django.urls import path, include
    from tasks.views import *
    from django.conf import settings
    from django.conf.urls.static import static

    urlpatterns = [
        path("", views.index, name="index"),
        path("login/", views.login, name="login"),
        path("logout/", views.logout, name="logout"),
        path("tasks/", views.tasks, name="tasks"),
        path("about/", views.about, name="about"),
        path("register/", views.register, name="register"),
        path("api/v1/reset-password/", PasswordResetRequestView.as_view(), name="reset-password-request"),
        path("api/v1/reset-password-confirm/", PasswordResetConfirmView.as_view(), name="reset-password-confirm"),
        path("reset-password/<uidb64>/<token>/", views.reset_password, name="reset_password"),
        path("forgot-password/", views.forgot_password, name="forgot_password"),
        path("create_task/", views.create_task, name="create_task"),
        path('tasks/<int:id>/', views.task_detail, name='task_detail'),
    ] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

- tasks/views.py: views for tasks
    ```python
    from django.shortcuts import render

    from django.http import HttpResponse

    from rest_framework import generics, viewsets, status
    from rest_framework.viewsets import ViewSet
    from rest_framework.decorators import action
    from .models import Task
    from rest_framework.response import Response
    from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser, IsAuthenticated, AllowAny
    from rest_framework.pagination import PageNumberPagination
    from rest_framework.authentication import TokenAuthentication
    from .permissions import IsAdminOrReadOnly, IsOwnerOrReadOnly
    from .serializers import TaskSerializer
    from django.shortcuts import render, redirect, get_object_or_404

    from rest_framework_simplejwt.tokens import RefreshToken
    from django.contrib.auth import authenticate
    from .serializers import RegisterSerializer
    from rest_framework.views import APIView

    from django.contrib.auth.tokens import default_token_generator
    from django.utils.http import urlsafe_base64_encode
    from django.utils.encoding import force_bytes
    from django.core.mail import send_mail
    from django.conf import settings
    from django.utils.http import urlsafe_base64_decode
    from django.utils.dateparse import parse_datetime
    from django.utils.timezone import make_aware


    from .models import Task
    from .serializers import TaskSerializer
    from rest_framework.filters import OrderingFilter
    from datetime import datetime

    from django.contrib.auth import get_user_model
    import logging
    from django.db import IntegrityError
    from rest_framework.exceptions import ValidationError
    from rest_framework import serializers
    from drf_spectacular.utils import extend_schema


    User = get_user_model()

    logger = logging.getLogger(__name__)

    class TaskAPIListPagination(PageNumberPagination):
        page_size = 5
        #page_size_query_param = 'page_size'
        #max_page_size = 10
        
        def get_paginated_response(self, data):
            response = super().get_paginated_response(data)
            if not response.data.get('previous'):
                del response.data['previous']
            return response
        
    class TaskViewSet(viewsets.ModelViewSet):
        serializer_class = TaskSerializer
        permission_classes = [IsAuthenticated]
        pagination_class = TaskAPIListPagination
        lookup_field = 'pk'
        filter_backends = [OrderingFilter]

        def get_queryset(self):
            queryset = Task.objects.filter(user=self.request.user).order_by('-created_at')

            # Фильтрация по статусу
            status = self.request.query_params.get('status', None)
            if status is not None:
                # Преобразование в булев тип
                status = status.lower() in ['true', '1']
                queryset = queryset.filter(status=status)

            # Фильтрация по приоритету
            priority = self.request.query_params.get('priority', None)
            if priority:
                queryset = queryset.filter(priority=priority)

            # Фильтрация по дате
            date = self.request.query_params.get('created_at', None)
            if date is not None:
                try:
                    date_obj = datetime.strptime(date, "%Y-%m-%d")
                    date_obj = make_aware(date_obj)
                    queryset = queryset.filter(created_at__date=date_obj.date())
                except ValueError:
                    pass  # Игнорируем ошибки преобразования даты, если формат неправильный

            return queryset

        def perform_create(self, serializer):
            # Присваиваем текущего пользователя при создании задачи
            serializer.save(user=self.request.user)

        def get_permissions(self):
            if self.action in ['update', 'partial_update', 'destroy', 'retrieve']:
                return [IsAuthenticated(), IsOwnerOrReadOnly()]
            return [IsAuthenticated()]
        
        @extend_schema(description='Retrieve a list of tasks')
        def list(self, request, *args, **kwargs):
            return super().list(request, *args, **kwargs)



    class RegisterViewSet(viewsets.ModelViewSet):
        queryset = User.objects.all()
        serializer_class = RegisterSerializer
        permission_classes = [AllowAny]
        http_method_names = ['post']  # Разрешаем только POST

        def create(self, request, *args, **kwargs):
            serializer = self.get_serializer(data=request.data)
            try:
                serializer.is_valid(raise_exception=True)
                user = serializer.save()

                # Создаём JWT токены для нового пользователя
                refresh = RefreshToken.for_user(user)
                return Response({
                    "message": "Пользователь создан",
                    "user": serializer.data,
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                }, status=status.HTTP_201_CREATED)

            except ValidationError as ve:
                return Response({"error": "Ошибка валидации", "details": ve.detail}, status=status.HTTP_400_BAD_REQUEST)

            except IntegrityError as ie:
                logger.error(f"Ошибка целостности базы данных: {ie}")
                return Response({"error": "Ошибка базы данных. Возможно, пользователь с такими данными уже существует."},
                                status=status.HTTP_400_BAD_REQUEST)

            except Exception as e:
                logger.exception("Неизвестная ошибка при регистрации пользователя")
                return Response({"error": "Внутренняя ошибка сервера."},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    class PasswordResetRequestView(APIView):
        def post(self, request):
            email = request.data.get("email")
            
            # Проверяем наличие пользователя с данным email
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({"error": "Пользователь с таким email не найден"}, status=404)

            # Генерация uid и токена для сброса пароля
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)

            reset_url = f"http://localhost:5173/reset-password-confirm/{uid}/{token}/"

            # Отправка email с ссылкой для сброса пароля
            send_mail(
                "Восстановление пароля",
                f"Нажмите на ссылку для сброса пароля: {reset_url}",
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            
            # Возвращаем uid и token в ответе
            return Response({
                "message": "Письмо с инструкцией отправлено",
                "uid": uid,
                "token": token,
            }, status=200)

    class PasswordResetConfirmView(APIView):
        def post(self, request):
            uidb64 = request.data.get('uid')
            token = request.data.get('token')
            new_password1 = request.data.get('new_password1')
            new_password2 = request.data.get('new_password2')

            # Проверка, что пароли совпадают
            if new_password1 != new_password2:
                raise ValidationError({'new_password2': 'Пароли не совпадают.'})

            try:
                # Декодирование uid и получение пользователя
                uid = urlsafe_base64_decode(uidb64).decode()
                user = User.objects.get(pk=uid)
            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                return Response({"detail": "Неверный UID"}, status=status.HTTP_400_BAD_REQUEST)

            # Проверка токена
            if default_token_generator.check_token(user, token):
                user.set_password(new_password1)
                user.save()
                return Response({"detail": "Пароль успешно изменен"})
            else:
                return Response({"detail": "Неверный или просроченный токен"}, status=status.HTTP_400_BAD_REQUEST)

    class PasswordResetConfirmSerializer(serializers.Serializer):
        uid = serializers.CharField()
        token = serializers.CharField()
        new_password1 = serializers.CharField(write_only=True)
        new_password2 = serializers.CharField(write_only=True)

        def validate(self, data):
            # Проверка совпадения паролей
            if data['new_password1'] != data['new_password2']:
                raise serializers.ValidationError({
                    'new_password2': 'Пароли не совпадают.'
                })
            return data
        
    def index(request):
        return render(request, "tasks/index.html")

    def tasks(request):
        return render(request, "tasks/tasks.html")

    def about(request):
        return render(request, "tasks/about.html")

    def login(request):
        return render(request, "tasks/login.html")

    def logout(request):
        return render(request, "tasks/index.html")

    def register(request):
        return render(request, "tasks/register.html")

    def reset_password(request, uidb64, token):
        return render(request, "tasks/reset_password.html")

    def forgot_password(request):
        return render(request, "tasks/forgot_password.html")


    def create_task(request):
        return render(request, 'tasks/create_task.html')

    def task_detail(request, id):
        task = get_object_or_404(Task, id=id)  # Получаем задачу по id или 404 ошибку, если не найдена
        return render(request, 'tasks/task_detail.html', {'task': task})
        

- tests: folder for tests apps tasks, users
    - tests/tasks/test_tasks.py: file for test tasks
        ```python
        import pytest
        from tasks.models import Task  # Import the Task model
        from django.utils.timezone import make_aware
        from datetime import datetime
        from rest_framework import status
        from rest_framework.test import APIClient
        from django.contrib.auth import get_user_model
        from tasks.models import Task


        @pytest.mark.django_db
        def test_create_task_authenticated(api_client, create_user):
            # Тестируем создание задачи для авторизованного пользователя
            user = create_user(username='username', email='user@example.com', password='password123')
            api_client.force_authenticate(user=user)
            response = api_client.post('/api/v1/tasks/', {
                'title': 'Test Task',
                'description': 'Task description'
            })
            assert response.status_code == 201
            assert response.data['title'] == 'Test Task'
            assert response.data['description'] == 'Task description'

        @pytest.mark.django_db
        def test_create_task_unauthenticated(api_client):
            # Тестируем создание задачи для неавторизованного пользователя
            response = api_client.post('/api/v1/tasks/', {
                'title': 'Unauthorized Task',
                'description': 'Should not create'
            })
            assert response.status_code == 401  # Unauthorized

        @pytest.mark.django_db
        def test_read_task_authenticated(api_client, create_user):
            # Тестируем получение задачи для авторизованного пользователя
            user = create_user(username='username', email='user@example.com', password='password123')
            api_client.force_authenticate(user=user)
            
            # Сначала создаем задачу
            task_response = api_client.post('/api/v1/tasks/', {
                'title': 'Test Task',
                'description': 'Task description'
            })
            task_id = task_response.data['id']
            
            # Получаем задачу
            response = api_client.get(f'/api/v1/tasks/{task_id}/')
            assert response.status_code == 200
            assert response.data['title'] == 'Test Task'
            assert response.data['description'] == 'Task description'

        @pytest.mark.django_db
        def test_update_task_authenticated(api_client, create_user):
            # Тестируем обновление задачи для авторизованного пользователя
            user = create_user(username='username', email='user@example.com', password='password123')
            api_client.force_authenticate(user=user)
            
            # Сначала создаем задачу
            task_response = api_client.post('/api/v1/tasks/', {
                'title': 'Test Task',
                'description': 'Task description'
            })
            task_id = task_response.data['id']
            
            # Обновляем задачу
            response = api_client.put(f'/api/v1/tasks/{task_id}/', {
                'title': 'Updated Task',
                'description': 'Updated description'
            })
            
            assert response.status_code == 200
            assert response.data['title'] == 'Updated Task'
            assert response.data['description'] == 'Updated description'

        @pytest.mark.django_db
        def test_delete_task_authenticated(api_client, create_user):
            # Тестируем удаление задачи для авторизованного пользователя
            user = create_user(username='username', email='user@example.com', password='password123')
            api_client.force_authenticate(user=user)
            
            # Сначала создаем задачу
            task_response = api_client.post('/api/v1/tasks/', {
                'title': 'Test Task',
                'description': 'Task description'
            })
            task_id = task_response.data['id']
            
            # Удаляем задачу
            response = api_client.delete(f'/api/v1/tasks/{task_id}/')
            assert response.status_code == 204  # No Content, задача удалена

        @pytest.mark.django_db
        def test_task_filter_by_status(api_client, create_user):
            # Тестируем фильтрацию задач по статусу
            user = create_user(username='username', email='user@example.com', password='password123')
            api_client.force_authenticate(user=user)
            
            # Создаем несколько задач
            api_client.post('/api/v1/tasks/', {
                'title': 'Task 1',
                'description': 'This is the first task',
                'status': True,
                'priority': 'low'
            })
            api_client.post('/api/v1/tasks/', {
                'title': 'Task 2',
                'description': 'This is the second task',
                'status': False,
                'priority': 'high'
            })
            
            # Фильтруем задачи по статусу (True)
            response = api_client.get('/api/v1/tasks/', {'status': True})
            
            assert response.status_code == 200
            assert len(response.data['results']) == 1  # Должна быть одна задача со статусом True
            assert response.data['results'][0]['status'] is True  # Проверка статуса задачи

        @pytest.mark.django_db
        def test_task_filter_by_priority(api_client, create_user):
            # Тестируем фильтрацию задач по приоритету
            user = create_user(username='username', email='user@example.com', password='password123')
            api_client.force_authenticate(user=user)
            
            # Создаем несколько задач
            api_client.post('/api/v1/tasks/', {
                'title': 'Task 1',
                'description': 'This is the first task',
                'status': False,
                'priority': 'low'
            })
            api_client.post('/api/v1/tasks/', {
                'title': 'Task 2',
                'description': 'This is the second task',
                'status': True,
                'priority': 'high'
            })
            
            # Фильтруем задачи по приоритету (low)
            response = api_client.get('/api/v1/tasks/', {'priority': 'low'})
            
            assert response.status_code == 200
            assert len(response.data['results']) == 1  # Должна быть одна задача с приоритетом 'low'
            assert response.data['results'][0]['priority'] == 'low'  # Проверка приоритета задачи


        @pytest.mark.django_db
        def test_task_pagination(api_client):
            # Создание пользователя
            user = get_user_model().objects.create_user(username='testuser', email='testuser@example.com', password='password123')

            # Принудительная аутентификация пользователя
            api_client.force_authenticate(user=user)

            # Создание задач, привязанных к пользователю
            for i in range(15):  # 15 задач, если PAGE_SIZE = 5, будет 3 страницы
                Task.objects.create(title=f"Task {i}", description="Some description", user=user)

            # Получаем первую страницу
            response = api_client.get('/api/v1/tasks/')

            # Проверяем статус и количество задач на первой странице
            assert response.status_code == status.HTTP_200_OK
            assert len(response.data['results']) == 5  # 5 задач на странице

            # Убедитесь, что на первой странице нет ссылки на предыдущую
            assert 'previous' not in response.data  # На первой странице не должно быть поля 'previous'
            
            # Убедитесь, что на первой странице есть ссылка на следующую
            assert 'next' in response.data  # Должна быть ссылка на следующую страницу

            # Получаем вторую страницу, используя ссылку на следующую страницу
            response = api_client.get(response.data['next'])

            # Проверяем, что на второй странице тоже 5 задач
            assert response.status_code == status.HTTP_200_OK
            assert len(response.data['results']) == 5

            # На второй странице должно быть поле 'previous'
            assert 'previous' in response.data  # Должна быть ссылка на предыдущую страницу

            # Получаем третью страницу, используя ссылку на следующую страницу
            response = api_client.get(response.data['next'])

            # Проверяем, что на третьей странице тоже 5 задач
            assert response.status_code == status.HTTP_200_OK
            assert len(response.data['results']) == 5

            # На последней странице не должно быть поля 'next'
            assert response.data['next'] is None  # На последней странице не должно быть ссылки на следующую страницу

            # На последней странице должно быть поле 'previous'
            assert 'previous' in response.data  # Должна быть ссылка на предыдущую страницу


    - tasks/tests/users/test_auth.py: tests users app
        ```python
        import pytest
        from django.contrib.auth import get_user_model
        from django.urls import reverse
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes

        User = get_user_model()

        @pytest.mark.django_db
        def test_register_user(api_client):
            # Тестируем регистрацию нового пользователя
            response = api_client.post('/api/v1/register/', {
                'username': 'testuser',
                'email': 'test@example.com',
                'password': 'strongpassword123',
                'password2': 'strongpassword123',
            })
            assert response.status_code == 201  # Проверяем, что статус 201 (создано)
            assert 'username' in response.data['user']  # Проверяем, что в ответе есть имя пользователя
            assert response.data['user']['username'] == 'testuser'  # Проверяем, что имя пользователя верно
            
        @pytest.mark.django_db
        def test_login_user(api_client, create_user):
            # Создание пользователя через фикстуру
            user = create_user(username='testuser', password='strongpassword123')
            response = api_client.post('/api/v1/token/', { 
                'username': 'testuser',
                'password': 'strongpassword123',
            })
            assert response.status_code == 200
            assert 'access' in response.data
            assert 'refresh' in response.data

            # Проверка, что получили токены
            assert 'access' in response.data
            assert 'refresh' in response.data


        @pytest.mark.django_db
        def test_create_task_authenticated(api_client, create_user):
            user = create_user(username='testuser', email='user@example.com', password='password123')
            api_client.force_authenticate(user=user)
            
            response = api_client.post('/api/v1/tasks/', {
                'title': 'Test Task',
                'description': 'Task description'
            })
            
            assert response.status_code == 201
            assert response.data['title'] == 'Test Task'

        @pytest.mark.django_db
        def test_password_reset_request(api_client, create_user):
            user = create_user(username='testuser', email='user@example.com', password='password123')
            
            response = api_client.post('/api/v1/reset-password/', {
                'email': user.email,
            })
            
            assert response.status_code == 200
            assert "message" in response.data
            assert response.data["message"] == "Письмо с инструкцией отправлено"

        @pytest.mark.django_db
        def test_password_reset_confirm(api_client, create_user):
            user = create_user(username='testuser', email='user@example.com', password='password123')

            # Генерируем uid и токен вручную
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)

            new_password = 'newpassword123'
            response = api_client.post('/api/v1/reset-password-confirm/', {
                'uid': uid,
                'token': token,
                'new_password1': new_password,
                'new_password2': new_password,
            })
            
            assert response.status_code == 200
            user.refresh_from_db()
            assert user.check_password(new_password)

        @pytest.mark.django_db
        def test_password_reset_fail_invalid_token(api_client, create_user):
            user = create_user(username='testuser', email='user@example.com', password='password123')
            
            response = api_client.post('/api/v1/reset-password/', {
                'email': user.email,
            })
            
            reset_data = response.data
            uid = reset_data['uid']
            invalid_token = 'invalidtoken'  # Неправильный токен
            
            response = api_client.post('/api/v1/reset-password-confirm/', {
                'uid': uid,
                'token': invalid_token,
                'new_password1': 'newpassword123',
                'new_password2': 'newpassword123',
            })
            
            assert response.status_code == 400  # Ожидаем ошибку с кодом 400
            assert 'detail' in response.data  # Ошибка должна быть в поле 'detail'
            assert response.data['detail'] == 'Неверный или просроченный токен'  # Проверяем сообщение об ошибке


        @pytest.mark.django_db
        def test_password_reset_request_invalid_email(api_client):
            # Отправка запроса на несуществующий email
            response = api_client.post('/api/v1/reset-password/', {
                'email': 'nonexistent@example.com',
            })
            
            assert response.status_code == 404
            assert 'error' in response.data  # Проверяем, что в ответе есть поле 'error'
            assert response.data['error'] == 'Пользователь с таким email не найден'  # Проверка сообщения об ошибке

        @pytest.mark.django_db
        def test_password_reset_confirm_passwords_do_not_match(api_client, create_user):
            user = create_user(username='testuser', email='user@example.com', password='password123')
            
            response = api_client.post('/api/v1/reset-password/', {
                'email': user.email,
            })
            
            reset_data = response.data
            uid = reset_data['uid']
            token = reset_data['token']
            
            response = api_client.post('/api/v1/reset-password-confirm/', {
                'uid': uid,
                'token': token,
                'new_password1': 'newpassword123',
                'new_password2': 'differentpassword123',  # Разные пароли
            })
            
            assert response.status_code == 400  # Ожидаем 400
            assert 'details' in response.data  # Ошибка теперь внутри 'details'
            assert 'new_password2' in response.data['details']  # Проверяем, что ошибка на поле new_password2
            assert response.data['details']['new_password2'] == 'Пароли не совпадают.'  # Проверка ошибки
    - tasks/tests/conftest.py:
        ```python
        import pytest
        from django.contrib.auth import get_user_model
        from rest_framework.test import APIClient

        User = get_user_model()

        @pytest.fixture
        def api_client():
            return APIClient()

        @pytest.fixture
        def create_user():
            def make_user(**kwargs):
                return User.objects.create_user(**kwargs)
            return make_user

- users/: this folder is users app
    - users/templates/users/: templates for users
        - users/templates/users/404.html:
            ```html
            <h1>Страница не найдена</h1>
            <p>Извините, запрашиваемая страница не существует.</p>
        
        - users/templates/users/500.html:
            <h1>Внутренняя ошибка сервера</h1>
            <p>Извините, произошла ошибка на сервере.</p>

- users/models.py: model for CustomUser
    ```python
    from django.contrib.auth.models import AbstractUser
    from django.db import models

    def user_avatar_path(instance, filename):
        return f'avatars/user_{instance.id}/{filename}'

    class CustomUser(AbstractUser):
        avatar = models.ImageField(upload_to=user_avatar_path, blank=True, null=True)

- users/serializers.py: serializer for user
    ```python
    from django.contrib.auth import get_user_model
    from rest_framework import serializers

    User = get_user_model()

    class UserSerializer(serializers.ModelSerializer):
        class Meta:
            model = User
            fields = ['id', 'username', 'email', 'avatar']

- users/urls.py: urls for user's profile, avatar
    ```python
    from django.urls import path
    from .views import CurrentUserView, UploadAvatarView, UpdateProfileView, delete_avatar


    urlpatterns = [
        path('me/', CurrentUserView.as_view(), name='current-user'),
        path('upload-avatar/', UploadAvatarView.as_view(), name='upload-avatar'),
        path('update-profile/', UpdateProfileView.as_view(), name='update-profile'),
        path('delete-avatar/', delete_avatar, name='delete-avatar'),
    ]

- users/utils.py:
    ```python
    from rest_framework.views import exception_handler
    from rest_framework.response import Response
    from rest_framework import status

    def custom_exception_handler(exc, context):
        """
        Кастомный обработчик ошибок для DRF
        """
        # Стандартный ответ от DRF
        response = exception_handler(exc, context)

        if response is not None:
            # Формируем свой формат ошибок
            custom_response_data = {
                'error': 'Ошибка валидации',
                'details': response.data
            }
            return Response(custom_response_data, status=response.status_code)

        return response

- users/views.py: views for users app
    ```python
    from django.shortcuts import render
    from django.http import JsonResponse
    from rest_framework.views import APIView
    from rest_framework.response import Response
    from rest_framework.permissions import IsAuthenticated
    from .serializers import UserSerializer
    from rest_framework.parsers import MultiPartParser, FormParser
    from rest_framework import status
    from rest_framework.decorators import api_view, permission_classes
    from rest_framework.views import exception_handler
    from django.db import transaction
    from django.contrib.auth import get_user_model
    import logging

    User = get_user_model()

    # Настройка логирования
    logger = logging.getLogger(__name__)

    class CurrentUserView(APIView):
        permission_classes = [IsAuthenticated]

        def get(self, request):
            try:
                serializer = UserSerializer(request.user)
                return Response(serializer.data)
            except Exception as e:
                logger.error(f"Error fetching current user: {e}")
                return Response({'error': 'Unable to fetch user data.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    class UploadAvatarView(APIView):
        permission_classes = [IsAuthenticated]
        parser_classes = [MultiPartParser, FormParser]

        def post(self, request):
            try:
                user = request.user
                # Получаем файл аватара
                avatar = request.FILES.get('avatar')

                if avatar:
                    user.avatar = avatar
                    user.save()
                    return Response(UserSerializer(user).data)
                else:
                    return Response({'detail': 'No avatar file provided'}, status=400)
            except Exception as e:
                logger.error(f"Error uploading avatar: {e}")
                return Response({'error': 'An error occurred while uploading avatar.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    class UpdateProfileView(APIView):
        permission_classes = [IsAuthenticated]
        parser_classes = [MultiPartParser, FormParser]

        def put(self, request):
            try:
                user = request.user
                data = request.data

                user.username = data.get("username", user.username)
                user.email = data.get("email", user.email)
                if 'avatar' in request.FILES:
                    user.avatar = request.FILES['avatar']
                user.save()

                return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
            except Exception as e:
                logger.error(f"Error updating profile: {e}")
                return Response({'error': 'An error occurred while updating profile.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @api_view(['DELETE'])
    @permission_classes([IsAuthenticated])
    def delete_avatar(request):
        try:
            user = request.user
            if user.avatar:
                user.avatar.delete(save=False)  # Удаляет файл с диска
                user.avatar = None
                user.save()
                serializer = UserSerializer(user)
                return Response({
                    "message": "Avatar deleted.",
                    "user": serializer.data
                }, status=status.HTTP_200_OK)
            else:
                return Response({"message": "User has no avatar."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error deleting avatar: {e}")
            return Response({'error': 'An error occurred while deleting avatar.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def custom_exception_handler(exc, context):
        # Вызов стандартного обработчика ошибок DRF
        response = exception_handler(exc, context)

        if response is not None:
            # Вы можете добавить дополнительную обработку ошибок, например:
            if response.status_code == 400:
                response.data = {'error': 'Bad request. Check the input data.'}
            elif response.status_code == 404:
                response.data = {'error': 'Resource not found.'}
            elif response.status_code == 500:
                response.data = {'error': 'Internal server error. Please try again later.'}

        return response


    def create_user(request):
        try:
            with transaction.atomic():
                # Логика создания нескольких объектов в базе данных
                user = User.objects.create_user(username=request.POST['username'], password=request.POST['password'])
                user.email = request.POST['email']
                user.save()  # Не забывайте сохранить пользователя
                return JsonResponse({'status': 'success', 'user_id': user.id})
        
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            return JsonResponse({'status': 'error', 'message': 'An error occurred while creating user.'}, status=500)


- docker-compose.yml: docker compose file
    ```yml
    services:
    db:
        image: postgres:13
        volumes:
        - postgres_data:/var/lib/postgresql/data
        environment:
        POSTGRES_DB: task_manager
        POSTGRES_USER: task_manager_user
        POSTGRES_PASSWORD: task_manager_password
        networks:
        - task_manager_network

    web:
        build: .
        volumes:
        - .:/app
        ports:
        - "8000:8000"
        depends_on:
        - db
        environment:
        - DB_HOST=db
        - DB_NAME=task_manager
        - DB_USER=task_manager_user
        - DB_PASSWORD=task_manager_password
        networks:
        - task_manager_network

    networks:
    task_manager_network:

    volumes:
    postgres_data:

- Dockerfile: 
    ```plaintext
    # Используем официальный образ Python
    FROM python:3.11-slim

    # Устанавливаем рабочую директорию внутри контейнера
    WORKDIR /app

    # Копируем requirements.txt в контейнер
    COPY requirements.txt /app/

    # Обновляем apt и устанавливаем netcat
    RUN apt-get update && rm -rf /var/lib/apt/lists/*

    # Устанавливаем зависимости
    RUN pip install --no-cache-dir -r requirements.txt

    # Копируем весь проект в контейнер
    COPY . /app/

    # Устанавливаем переменные окружения
    ENV PYTHONUNBUFFERED=1

    # Открываем порт для сервера Django
    EXPOSE 8000

    # Запуск Django сервера
    CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

- requirements.txt: file with dependencies
    ```playntext
    asgiref==3.8.1
    Django==3.2.25
    django-cors-headers==4.5.0
    django-extensions==3.2.3
    djangorestframework==3.15.1
    djangorestframework-simplejwt==5.3.1
    pillow==11.2.1
    psycopg2-binary==2.9.10
    PyJWT==2.10.1
    python-decouple==3.8
    python-dotenv==1.1.0
    pytz==2025.2
    sqlparse==0.5.3
    typing_extensions==4.13.2
    pytest
    pytest-django
    drf-spectacular


### Installation

Follow these steps to set up and run the Task Manager locally:

## Clone the repository
    - git clone https://github.com/samurai25/task-manager.git
    - cd task-manager

## Create and activate a virtual environment:
 - python -m venv venv
 - source venv/bin/activate    # On Windows: venv\Scripts\activate

## Install backend dependencies:
 - pip install -r requirements.txt

## Apply migrations and create a superuser (optional):
 - python manage.py migrate
 - python manage.py createsuperuser

## Environment variables
Create a `.env` file in the project root:
    - cp .env.example .env
Then edit .env and add your actual credentials (email password, DB password, etc).

## Run the development server:
 - python manage.py runserver

## Frontend (if using React separately):
 - npm install
 - source venv/bin/activate    # On Windows: venv\Scripts\activate
 - cd frontend
 - npm run dev

## Option 2: Using Docker Compose
## Build and start the containers:
 - docker-compose up --build

## Apply migrations inside the backend container:
 - docker-compose exec web python manage.py migrate

## Create a superuser (optional):
    - docker-compose exec web python manage.py createsuperuser

## Access the app:
 - Backend API: http://localhost:8000/api/v1/
 - Frontend (React): http://localhost:5173/

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
