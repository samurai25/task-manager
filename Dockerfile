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
