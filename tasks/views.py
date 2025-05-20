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
    page_size = 8
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
        try:
            uidb64 = request.data.get('uid')
            token = request.data.get('token')
            password1 = request.data.get('password1')
            password2 = request.data.get('password2')

            if not all([uidb64, token, password1, password2]):
                return Response({"error": "Не все поля заполнены"}, status=400)

            if password1 != password2:
                raise ValidationError({'new_password2': 'Пароли не совпадают.'})

            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)

            if default_token_generator.check_token(user, token):
                user.set_password(password1)
                user.save()
                return Response({"detail": "Пароль успешно изменен"})
            else:
                return Response({"detail": "Неверный или просроченный токен"}, status=400)

        except ValidationError as ve:
            return Response({"validation_error": ve.detail}, status=400)

        except Exception as e:
            logger.exception("Ошибка при сбросе пароля")
            return Response({"error": "Внутренняя ошибка сервера"}, status=500)

class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password1 = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    def validate(self, data):
        # Проверка совпадения паролей
        if data['password1'] != data['password2']:
            raise serializers.ValidationError({
                'password2': 'Пароли не совпадают.'
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
