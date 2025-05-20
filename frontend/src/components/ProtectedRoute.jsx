
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const accessToken = localStorage.getItem('access'); // или sessionStorage

  if (!accessToken) {
    // Если токен отсутствует, перенаправляем на страницу входа
    return <Navigate to="/login" replace />;
  }

  return children; // Если токен есть, рендерим переданный компонент
};

export default ProtectedRoute;
