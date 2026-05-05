from rest_framework import generics
from users.serializers import RegisterSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from users.serializers import LoginSerializer


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
        
        access = response.data.get("access")
        refresh = response.data.get("refresh")
        user = response.data.get("user")
        print(user)
        
        res = Response(response.data)
        
        res.set_cookie(
            key="access_token",
            value=access,
            httponly=True,
            samesite="None",
            secure=True,
            path="/"
        )
        
        res.set_cookie(
            key="refresh_token",
            value=refresh,
            httponly=True,
            secure=True,
            samesite="None",
            path="/"
        )
        
        res.set_cookie(
            key="role",
            value=user["role"],
            httponly=True,
            samesite="None",
            secure=True,
            path="/"
        )
        return res
