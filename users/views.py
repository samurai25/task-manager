from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import UserSerializer, AvatarUploadSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import exception_handler
from django.db import transaction
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema
import logging

User = get_user_model()

# Настройка логирования
logger = logging.getLogger(__name__)

class CurrentUserView(GenericAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            serializer = UserSerializer(request.user)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error fetching current user: {e}")
            return Response({'error': 'Unable to fetch user data.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UploadAvatarView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = AvatarUploadSerializer
    def post(self, request):
        try:
            user = request.user
            # Получаем файл аватара
            avatar = request.FILES.get('avatar')

            if avatar:
                user.avatar = avatar
                user.save()
                return Response(UserSerializer(user).data)
            else:
                return Response({'detail': 'No avatar file provided'}, status=400)
        except Exception as e:
            logger.error(f"Error uploading avatar: {e}")
            return Response({'error': 'An error occurred while uploading avatar.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdateProfileView(GenericAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_object(self):
        return self.request.user

    def put(self, request):
        try:
            user = request.user
            data = request.data

            user.username = data.get("username", user.username)
            user.email = data.get("email", user.email)
            if 'avatar' in request.FILES:
                user.avatar = request.FILES['avatar']
            user.save()

            return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error updating profile: {e}")
            return Response({'error': 'An error occurred while updating profile.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@extend_schema(
    responses={204: None}
)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_avatar(request):
    try:
        user = request.user
        if user.avatar:
            user.avatar.delete(save=False)  # Удаляет файл с диска
            user.avatar = None
            user.save()
            serializer = UserSerializer(user)
            return Response({
                "message": "Avatar deleted.",
                "user": serializer.data
            }, status=status.HTTP_200_OK)
        else:
            return Response({"message": "User has no avatar."}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error deleting avatar: {e}")
        return Response({'error': 'An error occurred while deleting avatar.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def custom_exception_handler(exc, context):
    # Вызов стандартного обработчика ошибок DRF
    response = exception_handler(exc, context)

    if response is not None:
        # Вы можете добавить дополнительную обработку ошибок, например:
        if response.status_code == 400:
            response.data = {'error': 'Bad request. Check the input data.'}
        elif response.status_code == 404:
            response.data = {'error': 'Resource not found.'}
        elif response.status_code == 500:
            response.data = {'error': 'Internal server error. Please try again later.'}

    return response


def create_user(request):
    try:
        with transaction.atomic():
            # Логика создания нескольких объектов в базе данных
            user = User.objects.create_user(username=request.POST['username'], password=request.POST['password'])
            user.email = request.POST['email']
            user.save()  # Не забывайте сохранить пользователя
            return JsonResponse({'status': 'success', 'user_id': user.id})
    
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        return JsonResponse({'status': 'error', 'message': 'An error occurred while creating user.'}, status=500)