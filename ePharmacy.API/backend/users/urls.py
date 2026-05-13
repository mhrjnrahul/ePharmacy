from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LogoutView,
    LoginView,
    ListUserView,
    StaffRegisterView,
    DeleteUserView,
    RestoreUserView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("register-staff/", StaffRegisterView.as_view(), name="register-staff"),
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("list/", ListUserView.as_view(), name="list"),
    path("delete/<uuid:pk>/", DeleteUserView.as_view(), name="delete"),
    path("restore/<uuid:pk>/", RestoreUserView.as_view(), name="restore"),
]
