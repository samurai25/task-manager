from . import views
from rest_framework.routers import DefaultRouter
from django.urls import path, include
from tasks.views import *
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("", views.index, name="index"),
    path("login/", views.login, name="login"),
    path("logout/", views.logout, name="logout"),
    path("tasks/", views.tasks, name="tasks"),
    path("about/", views.about, name="about"),
    path("register/", views.register, name="register"),
    path("api/v1/reset-password/", PasswordResetRequestView.as_view(), name="reset-password-request"),
    path("api/v1/reset-password-confirm/", PasswordResetConfirmView.as_view(), name="reset-password-confirm"),
    path("reset-password/<uidb64>/<token>/", views.reset_password, name="reset_password"),
    path("forgot-password/", views.forgot_password, name="forgot_password"),
    path("create_task/", views.create_task, name="create_task"),
    path('tasks/<int:id>/', views.task_detail, name='task_detail'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
