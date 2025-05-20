from django.urls import path
from .views import CurrentUserView, UploadAvatarView, UpdateProfileView, delete_avatar


urlpatterns = [
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('upload-avatar/', UploadAvatarView.as_view(), name='upload-avatar'),
    path('update-profile/', UpdateProfileView.as_view(), name='update-profile'),
    path('delete-avatar/', delete_avatar, name='delete-avatar'),
]
