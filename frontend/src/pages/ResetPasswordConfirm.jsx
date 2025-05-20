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
      password1: password, 
      password2: confirmPassword 
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
        <div className="alert alert-success">Пароль успешно изменён. Перенаправление на страницу входа....</div>
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
            <label>Подтвердить Новый Пароль</label>
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
            Сохранить
          </button>
        </form>
      )}
      </div>
    </div>
  );
};

export default ResetPasswordConfirm;

