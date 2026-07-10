"""
reports/views.py

Read-only analytics endpoints for the admin/staff dashboard.
No models — everything is aggregated live from the other apps.

Revenue convention: an order counts as revenue once it has passed the
PENDING stage and was not cancelled (confirmed / processing / shipped /
delivered) — the same statuses where stock has been deducted.
"""

from datetime import timedelta

from django.db.models import Count, Sum, F
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response

from core.permissions import IsAdminOrStaff
from core.models import Role
from catalog.models import Medicine
from inventory.models import Batch, Inventory
from orders.models import Order, OrderItem
from prescriptions.models import Prescription
from users.models import User

REVENUE_STATUSES = [
    Order.Status.CONFIRMED,
    Order.Status.PROCESSING,
    Order.Status.SHIPPED,
    Order.Status.DELIVERED,
]


def _int_param(request, name, default, maximum=365):
    try:
        value = int(request.query_params.get(name, default))
    except ValueError:
        return default
    if value <= 0:
        return default
    return min(value, maximum)


class DashboardStatsView(APIView):
    """
    GET /api/reports/dashboard/   — admin/staff only

    One-call summary powering the dashboard stat cards.
    """

    permission_classes = [IsAdminOrStaff]

    def get(self, request):
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        month_start = today_start.replace(day=1)
        today = now.date()
        expiry_warning_date = today + timedelta(days=30)

        revenue_orders = Order.objects.filter(status__in=REVENUE_STATUSES)

        orders_by_status = dict(
            Order.objects.values_list("status").annotate(count=Count("id"))
        )

        return Response(
            {
                "revenue": {
                    "total": revenue_orders.aggregate(t=Sum("total_amount"))["t"] or 0,
                    "today": revenue_orders.filter(
                        created_at__gte=today_start
                    ).aggregate(t=Sum("total_amount"))["t"]
                    or 0,
                    "this_month": revenue_orders.filter(
                        created_at__gte=month_start
                    ).aggregate(t=Sum("total_amount"))["t"]
                    or 0,
                },
                "orders": {
                    "total": Order.objects.count(),
                    "today": Order.objects.filter(
                        created_at__gte=today_start
                    ).count(),
                    "pending": orders_by_status.get(Order.Status.PENDING, 0),
                    "by_status": orders_by_status,
                },
                "customers": {
                    "total": User.objects.filter(role=Role.CUSTOMER).count(),
                    "new_this_month": User.objects.filter(
                        role=Role.CUSTOMER, created_at__gte=month_start
                    ).count(),
                },
                "catalog": {
                    "total_medicines": Medicine.objects.count(),
                    "active_medicines": Medicine.objects.filter(
                        is_active=True
                    ).count(),
                },
                "prescriptions": {
                    "pending": Prescription.objects.filter(
                        status=Prescription.Status.PENDING
                    ).count(),
                },
                "inventory": {
                    "low_stock_count": Inventory.objects.filter(
                        quantity_available__lt=10, batch__is_active=True
                    ).count(),
                    "expiring_soon_count": Batch.objects.filter(
                        is_active=True,
                        expiry_date__lte=expiry_warning_date,
                        expiry_date__gte=today,
                    ).count(),
                    "expired_count": Batch.objects.filter(
                        is_active=True, expiry_date__lt=today
                    ).count(),
                },
            }
        )


class SalesTrendView(APIView):
    """
    GET /api/reports/sales-trend/?days=30   — admin/staff only

    Daily revenue and order counts for the last N days (default 30).
    Days with no sales are included as zeros so charts have a
    continuous x-axis.
    """

    permission_classes = [IsAdminOrStaff]

    def get(self, request):
        days = _int_param(request, "days", 30)
        today = timezone.now().date()
        start_date = today - timedelta(days=days - 1)

        rows = (
            Order.objects.filter(
                status__in=REVENUE_STATUSES,
                created_at__date__gte=start_date,
            )
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(revenue=Sum("total_amount"), orders=Count("id"))
        )
        by_day = {row["day"]: row for row in rows}

        results = []
        for offset in range(days):
            day = start_date + timedelta(days=offset)
            row = by_day.get(day)
            results.append(
                {
                    "date": day,
                    "revenue": row["revenue"] if row else 0,
                    "orders": row["orders"] if row else 0,
                }
            )

        return Response({"days": days, "results": results})


class TopSellingView(APIView):
    """
    GET /api/reports/top-selling/?days=30&limit=10   — admin/staff only

    Best-selling medicines by quantity within the last N days,
    with revenue per medicine. days=0 is not allowed; use a large
    window (e.g. days=365) for "all time".
    """

    permission_classes = [IsAdminOrStaff]

    def get(self, request):
        days = _int_param(request, "days", 30)
        limit = _int_param(request, "limit", 10, maximum=50)
        since = timezone.now() - timedelta(days=days)

        rows = (
            OrderItem.objects.filter(
                order__status__in=REVENUE_STATUSES,
                order__created_at__gte=since,
            )
            .values(
                medicine_id=F("batch__medicine_id"),
                medicine_name=F("batch__medicine__name"),
            )
            .annotate(
                total_quantity=Sum("quantity"),
                total_revenue=Sum(F("quantity") * F("unit_price")),
                order_count=Count("order_id", distinct=True),
            )
            .order_by("-total_quantity")[:limit]
        )

        return Response({"days": days, "results": list(rows)})
