from django.contrib.auth.models import AbstractUser
from django.db import models

def user_avatar_path(instance, filename):
    return f'avatars/user_{instance.id}/{filename}'

class CustomUser(AbstractUser):
    class Meta:
        db_table = 'users_customuser'
        
    avatar = models.ImageField(upload_to=user_avatar_path, blank=True, null=True)
