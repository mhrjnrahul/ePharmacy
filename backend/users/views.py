from rest_framework import generics
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from users.serializers import LoginSerializer, UserReadSerializer, RegisterSerializer
from core.permissions import IsAdminUser
from users.models import User


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            token = RefreshToken(request.data["refresh"])
            token.blacklist()
            return Response( {"message": "Logged out, token blacklisted"} ,status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({"message": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer

class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        res = Response(response.data)
        return res
    

class ListUserView(generics.ListAPIView):
    queryset = User.objects.all().order_by("id")
    serializer_class = UserReadSerializer
    permission_classes = [IsAdminUser]
