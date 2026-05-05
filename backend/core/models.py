from django.db import models

# Create your models here.
from django.utils.translation import gettext_lazy as _

class Role(models.TextChoices):
        ADMIN = "ADMIN", _("Admin")
        STAFF = "STAFF", _("Staff")
        CUSTOMER = "CUSTOMER", _("Customer")
        

class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True