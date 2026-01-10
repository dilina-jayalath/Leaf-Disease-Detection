from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DiseaseViewSet, PredictionViewSet, chatbot_response, predict_disease

router = DefaultRouter()
router.register(r'diseases', DiseaseViewSet)
router.register(r'predictions', PredictionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('chatbot/', chatbot_response, name='chatbot'),
    path('predict/', predict_disease, name='predict'),
]
