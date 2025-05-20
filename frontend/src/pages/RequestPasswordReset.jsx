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
            <label>Почта:</label>
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

