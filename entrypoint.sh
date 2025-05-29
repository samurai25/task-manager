#!/bin/sh

# Ожидание, пока база данных не станет доступной
echo "Waiting for PostgreSQL..."

# Ждём подключения к БД
while ! nc -z $DB_HOST 5432; do
  sleep 0.5
done

echo "PostgreSQL is up - continuing..."

# Выполняем миграции
python manage.py migrate

# Собираем статику, если нужно (для продакшена)
# python manage.py collectstatic --noinput

# Запускаем сервер
exec "$@"
