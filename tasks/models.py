from django.db import models
from django.conf import settings
class Task(models.Model):
    STATUS_CHOICES = [
        (True, 'Completed'),
        (False, 'Incomplete')
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High')
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.BooleanField(choices=STATUS_CHOICES, default=False)
    priority = models.CharField(max_length=6, choices=PRIORITY_CHOICES, default='low')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='tasks', on_delete=models.CASCADE)

    def __str__(self):
        return self.title
    
    
class Category(models.Model):
    name = models.CharField(max_length=100, db_index=True)
    def __str__(self):
        return self.name
    
