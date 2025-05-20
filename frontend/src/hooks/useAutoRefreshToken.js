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
