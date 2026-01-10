from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DiseaseViewSet, chatbot_response, predict_disease

router = DefaultRouter()
router.register(r'diseases', DiseaseViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('chatbot/', chatbot_response, name='chatbot'),
    path('predict/', predict_disease, name='predict'),
]
