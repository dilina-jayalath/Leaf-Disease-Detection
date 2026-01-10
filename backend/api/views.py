from rest_framework import viewsets, status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Disease, PredictionHistory
from .serializers import DiseaseSerializer, PredictionSerializer
import random

import os
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import io

# ------------------------------------------------------------
# MODEL LOADING (PyTorch)
# ------------------------------------------------------------
DEVICE = torch.device("cpu") # Server usually CPU, or cuda if available
CLASS_NAMES = ['Blight', 'Common_Rust', 'Gray_Leaf_Spot', 'Healthy']

def load_pytorch_model():
    try:
        model_path = os.path.join(os.path.dirname(__file__), 'model.pth')
        if not os.path.exists(model_path):
            print(f"Model file not found: {model_path}")
            return None

        print(f"Loading PyTorch model from {model_path}...")
        
        # Initialize ResNet18 architecture
        model = models.resnet18(pretrained=False) # No need for imagenet weights if we load full state
        num_ftrs = model.fc.in_features
        model.fc = nn.Linear(num_ftrs, len(CLASS_NAMES))
        
        # Load weights
        state_dict = torch.load(model_path, map_location=DEVICE)
        model.load_state_dict(state_dict)
        model.to(DEVICE)
        model.eval() # Set to evaluation mode
        
        print("SUCCESS: PyTorch Model loaded!")
        return model
    except Exception as e:
        print(f"Error loading PyTorch model: {e}")
        return None

# Global model instance
model = load_pytorch_model()

# Preprocessing transform
data_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

class DiseaseViewSet(viewsets.ModelViewSet):
    queryset = Disease.objects.all()
    serializer_class = DiseaseSerializer

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def predict_disease(request):
    if 'image' not in request.data:
        return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

    image_file = request.data['image']
    
    # 1. SAVE RECORD
    prediction_record = PredictionHistory.objects.create(image=image_file)

    # 2. PREDICT
    predicted_disease = None
    confidence = 0.0

    try:
        if model:
            # Open Image
            img = Image.open(image_file).convert('RGB')
            
            # Preprocess
            input_tensor = data_transform(img).unsqueeze(0).to(DEVICE)
            
            # Inference
            with torch.no_grad():
                outputs = model(input_tensor)
                probabilities = torch.nn.functional.softmax(outputs, dim=1)
                conf, preds = torch.max(probabilities, 1)
                
            class_idx = preds.item()
            confidence = conf.item()
            predicted_label = CLASS_NAMES[class_idx]
            
            print(f"Predicted: {predicted_label} ({confidence:.2f})")
            
            # 3. DB LOOKUP OR CREATE
            # Logic: If Healthy, maybe we don't return a Disease object (or we do for info).
            # The User wants Description/Prevention/Treatment, so we MUST return a Disease object even for Healthy if possible.
            
            predicted_disease = Disease.objects.filter(name__icontains=predicted_label).first()
            
            if not predicted_disease and predicted_label != "Unknown":
                # Auto-create if missing so Frontend has something to show
                predicted_disease = Disease.objects.create(
                    name=predicted_label,
                    description=f"Auto-generated entry for {predicted_label}. Please update details in Admin.",
                    symptoms="Symptoms to be added.",
                    causes="Causes to be added.",
                    treatment="Treatment to be added.",
                    prevention="Prevention to be added."
                )

    except Exception as e:
        print(f"Prediction Error: {e}")
        import traceback
        traceback.print_exc()

    # 4. UPDATE RECORD
    prediction_record.disease = predicted_disease
    prediction_record.confidence = confidence
    prediction_record.save()

    serializer = PredictionSerializer(prediction_record)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

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
