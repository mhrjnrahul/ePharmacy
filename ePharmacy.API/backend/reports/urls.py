from django.urls import path
from .views import DashboardStatsView, SalesTrendView, TopSellingView

app_name = "reports"

urlpatterns = [
    path("dashboard/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("sales-trend/", SalesTrendView.as_view(), name="sales-trend"),
    path("top-selling/", TopSellingView.as_view(), name="top-selling"),
]
