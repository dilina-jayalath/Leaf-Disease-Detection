from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DiseaseViewSet, PredictionViewSet, chatbot_response, predict_disease, RegisterView, MyTokenObtainPairView
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'diseases', DiseaseViewSet)
router.register(r'predictions', PredictionViewSet, basename='predictions') # Added basename as we override queryset

urlpatterns = [
    path('', include(router.urls)),
    path('chatbot/', chatbot_response, name='chatbot'),
    path('predict/', predict_disease, name='predict'),
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
