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
