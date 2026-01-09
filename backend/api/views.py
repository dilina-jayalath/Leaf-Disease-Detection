from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Disease
from .serializers import DiseaseSerializer

class DiseaseViewSet(viewsets.ModelViewSet):
    queryset = Disease.objects.all()
    serializer_class = DiseaseSerializer

@api_view(['POST'])
def chatbot_response(request):
    user_msg = request.data.get('message', '').lower()
    
    response_text = "Sorry, I didn't understand that."
    
    if "yellow" in user_msg or "leaves" in user_msg:
        response_text = "Yellow leaves may be caused by overwatering or nutrient deficiency. Check soil moisture."
    elif "fungus" in user_msg or "spots" in user_msg:
        response_text = "Use recommended fungicide spray and avoid overhead watering."
    elif "water" in user_msg:
        response_text = "Most plants need watering when the top inch of soil is dry."
    elif "fertilizer" in user_msg:
        response_text = "Use a balanced NPK fertilizer during the growing season."
    elif "hello" in user_msg or "hi" in user_msg:
        response_text = "Hello! I am your plant care assistant. Ask me about plant diseases or care tips."
        
    return Response({"response": response_text})
