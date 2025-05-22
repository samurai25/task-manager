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
        'password': new_password,
        'password2': new_password,
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
        'password': 'newpassword123',
        'password2': 'newpassword123',
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
        'password': 'newpassword123',
        'password2': 'differentpassword123',  # Разные пароли
    })
    
    assert response.status_code == 400  # Ожидаем 400
    assert 'validation_error' in response.data
    assert 'password2' in response.data['validation_error']
    assert str(response.data['validation_error']['password2']) == 'Пароли не совпадают.'
