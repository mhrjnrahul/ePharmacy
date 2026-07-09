from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from users.serializers import (
    LoginSerializer,
    UserReadSerializer,
    RegisterSerializer,
    AdminCreateSerializer,
    MeSerializer,
    ChangePasswordSerializer,
)
from core.permissions import IsAdminUser
from users.models import User


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            token = RefreshToken(request.data["refresh"])
            token.blacklist()
            return Response(
                {"message": "Logged out, token blacklisted"},
                status=status.HTTP_205_RESET_CONTENT,
            )
        except Exception:
            return Response(
                {"message": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
            )


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        res = Response(response.data)
        return res


class MeView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/auth/me/  — current user's profile
    PATCH /api/auth/me/  — update own first_name / last_name
    """

    serializer_class = MeSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/
    Body: { "old_password": "...", "new_password": "..." }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password changed successfully."})


class StaffRegisterView(generics.CreateAPIView):
    serializer_class = AdminCreateSerializer
    permission_classes = [IsAdminUser]


class ListUserView(generics.ListAPIView):
    queryset = User.all_objects.all().order_by("id")
    serializer_class = UserReadSerializer
    permission_classes = [IsAdminUser]


class DeleteUserView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)

            if not user.is_active:
                return Response(
                    {"detail": "User account is already deactivated."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if user == request.user:
                return Response(
                    {"detail": "You cannot delete your own account."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.is_active = False
            user.save()
            return Response(
                {"detail": "User deactivated successfully."}, status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )


class RestoreUserView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        user = User.all_objects.get(pk=pk)
        if user.is_active:
            return Response(
                {"detail": "User already active."}, status=status.HTTP_400_BAD_REQUEST
            )
        user.is_active = True
        user.save()
        return Response({"detail": "User activated"}, status=status.HTTP_200_OK)
