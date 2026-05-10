from django.db import models
from django.utils.translation import gettext_lazy as _
import uuid


class Role(models.TextChoices):
    ADMIN = "ADMIN", _("Admin")
    STAFF = "STAFF", _("Staff")
    CUSTOMER = "CUSTOMER", _("Customer")


class TimeStampedModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
