from django.db import models
from django.conf import settings
from core.models import TimeStampedModel
from catalog.models import Medicine


class Prescription(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="prescriptions",
    )
    image = models.FileField(
        upload_to="prescriptions/",
        help_text="Upload image or PDF of the prescription.",
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reviewed_prescriptions",
        help_text="Staff or admin who approved/rejected this prescription.",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(
        blank=True,
        help_text="Required when rejecting. Shown to the customer.",
    )
    notes = models.TextField(
        blank=True,
        help_text="Internal staff notes. Not shown to the customer.",
    )

    class Meta:
        db_table = "prescriptions_prescription"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Prescription #{self.id} — {self.customer.email} ({self.status})"

    @property
    def is_approved(self):
        return self.status == self.Status.APPROVED

    def approve(self, reviewed_by):
        from django.utils import timezone

        self.status = self.Status.APPROVED
        self.reviewed_by = reviewed_by
        self.reviewed_at = timezone.now()
        self.rejection_reason = ""
        self.save(
            update_fields=[
                "status",
                "reviewed_by",
                "reviewed_at",
                "rejection_reason",
                "updated_at",
            ]
        )

    def reject(self, reviewed_by, reason):
        from django.utils import timezone

        if not reason:
            raise ValueError("A rejection reason is required.")
        self.status = self.Status.REJECTED
        self.reviewed_by = reviewed_by
        self.reviewed_at = timezone.now()
        self.rejection_reason = reason
        self.save(
            update_fields=[
                "status",
                "reviewed_by",
                "reviewed_at",
                "rejection_reason",
                "updated_at",
            ]
        )


class PrescriptionItem(TimeStampedModel):
    """
    Links a prescription to specific medicines it covers.
    Created by staff during approval to record exactly which
    medicines this prescription authorises the customer to buy.

    When a customer tries to order a prescription medicine,
    the orders app checks:
        PrescriptionItem.objects.filter(
            prescription__customer=user,
            prescription__status='approved',
            medicine=medicine,
        ).exists()
    """

    prescription = models.ForeignKey(
        Prescription,
        on_delete=models.CASCADE,
        related_name="items",
    )
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.PROTECT,
        related_name="prescription_items",
    )
    approved_quantity = models.PositiveIntegerField(
        help_text="Max quantity the customer is allowed to order for this medicine.",
    )

    class Meta:
        db_table = "prescriptions_prescription_item"
        unique_together = [("prescription", "medicine")]

    def __str__(self):
        return f"{self.medicine.name} x{self.approved_quantity} — Rx #{self.prescription.id}"
