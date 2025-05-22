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
    for i in range(24):  # 24 задач, если PAGE_SIZE = 8, будет 3 страницы
        Task.objects.create(title=f"Task {i}", description="Some description", user=user)

    # Получаем первую страницу
    response = api_client.get('/api/v1/tasks/')

    # Проверяем статус и количество задач на первой странице
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data['results']) == 8  # 8 задач на странице

    # Убедитесь, что на первой странице нет ссылки на предыдущую
    assert 'previous' not in response.data  # На первой странице не должно быть поля 'previous'
    
    # Убедитесь, что на первой странице есть ссылка на следующую
    assert 'next' in response.data  # Должна быть ссылка на следующую страницу

    # Получаем вторую страницу, используя ссылку на следующую страницу
    response = api_client.get(response.data['next'])

    # Проверяем, что на второй странице тоже 8 задач
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data['results']) == 8

    # На второй странице должно быть поле 'previous'
    assert 'previous' in response.data  # Должна быть ссылка на предыдущую страницу

    # Получаем третью страницу, используя ссылку на следующую страницу
    response = api_client.get(response.data['next'])

    # Проверяем, что на третьей странице тоже 8 задач
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data['results']) == 8

    # На последней странице не должно быть поля 'next'
    assert response.data['next'] is None  # На последней странице не должно быть ссылки на следующую страницу

    # На последней странице должно быть поле 'previous'
    assert 'previous' in response.data  # Должна быть ссылка на предыдущую страницу
