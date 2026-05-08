from django.contrib import admin
from .models import Category, Manufacturer, Medicine, MedicineRelation


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "is_active", "created_at"]
    search_fields = ["name"]
    list_filter = ["is_active"]


@admin.register(Manufacturer)
class ManufacturerAdmin(admin.ModelAdmin):
    list_display = ["name", "is_active", "created_at"]
    search_fields = ["name"]
    list_filter = ["is_active"]


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "strength",
        "dosage_form",
        "category",
        "manufacturer",
        "requires_prescription",
        "is_active",
    ]
    search_fields = ["name", "strength"]
    list_filter = ["dosage_form", "requires_prescription", "is_active", "category"]
    autocomplete_fields = ["category", "manufacturer"]


@admin.register(MedicineRelation)
class MedicineRelationAdmin(admin.ModelAdmin):
    list_display = ["from_medicine", "to_medicine", "relation_type", "weight"]
    list_filter = ["relation_type"]
    autocomplete_fields = ["from_medicine", "to_medicine"]
