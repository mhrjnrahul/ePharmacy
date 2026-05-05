from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

from .managers import CustomUserManager
from core.models import TimeStampedModel, Role

class User(AbstractUser, TimeStampedModel):
    username = None
    email = models.EmailField(_("email address"), unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER
    )
    
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]
    
    objects = CustomUserManager()
    
    def __str__(self):
        return f"{self.email} ({self.role})"
    
    



