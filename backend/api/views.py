import os

import torch
import torch.nn as nn
from PIL import Image
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import generics, permissions, status, viewsets
from rest_framework_simplejwt.views import TokenObtainPairView
from torchvision import models, transforms

from .chatbot import get_chatbot_reply
from .models import Disease, PredictionHistory
from .serializers import (
    DiseaseSerializer,
    MyTokenObtainPairSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    PredictionSerializer,
    UserSerializer,
    UserUpdateSerializer,
)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return UserSerializer 
        return UserUpdateSerializer

class UserDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class PasswordResetRequestView(generics.GenericAPIView):
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "OTP sent to your email."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "Password updated successfully. You can now log in."},
            status=status.HTTP_200_OK,
        )

# ------------------------------------------------------------
# MODEL LOADING (PyTorch)
# ------------------------------------------------------------
DEVICE = torch.device("cpu") # Server usually CPU, or cuda if available
CLASS_NAMES = ['Blight', 'Common_Rust', 'Gray_Leaf_Spot', 'Healthy']

DISEASE_INFO = {
    "Blight": {
        "description": "Northern Corn Leaf Blight (NCLB) is a fungal disease that causes cigar-shaped lesions on leaves, potentially reducing yield significantly if infection occurs before silking.",
        "symptoms": "Long, elliptical, grayish-green or tan lesions ranging from 1 to 6 inches in length. Lesions usually start on lower leaves and progress upward.",
        "causes": "Caused by the fungus Exserohilum turcicum. Favored by moderate temperatures (64-81°F) and wet, humid weather.",
        "treatment": "Apply fungicides containing strobilurins or triazoles if lesions appear early in the season.",
        "prevention": "Use resistant corn hybrids. Rotate crops to reduce inoculum. Manage residue to speed up decomposition."
    },
    "Common_Rust": {
        "description": "Common Rust is a fungal disease that produces raised pustules on both leaf surfaces. It is generally less damaging than southern rust but can cause yield loss in susceptible hybrids.",
        "symptoms": "Small, oval to elongate, cinnamon-brown powdery pustules scattered on both upper and lower leaf surfaces.",
        "causes": "Caused by the fungus Puccinia sorghi. Spores are transported by wind. Favored by cool, moist conditions.",
        "treatment": "Fungicides are rarely economically justified unless infection is severe on young plants. Triazoles and strobilurins are effective.",
        "prevention": "Plant resistant hybrids. Early planting can sometimes help avoid peak infection periods."
    },
    "Gray_Leaf_Spot": {
        "description": "Gray Leaf Spot is a serious fungal disease affecting corn production worldwide, characterized by rectangular lesions that run parallel to leaf veins.",
        "symptoms": "Tan to gray rectangular lesions bordered by leaf veins. Lesions may merge, killing entire leaves.",
        "causes": "Caused by the fungus Cercospora zeae-maydis. Thrives in warm, humid conditions and reduced-tillage fields.",
        "treatment": "Foliar fungicides applied at tasseling (VT) to silking (R1) stages.",
        "prevention": "Crop rotation and tillage to bury residue. Select hybrids with moderate to high resistance."
    },
    "Healthy": {
        "description": "The plant appears healthy with no visible signs of disease.",
        "symptoms": "Green, vibrant leaves without spots, lesions, or yellowing.",
        "causes": "N/A",
        "treatment": "Continue regular maintenance including proper watering and fertilization.",
        "prevention": "Maintain good agronomic practices, scout fields regularly, and manage pests."
    }
}

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

class PredictionViewSet(viewsets.ModelViewSet):
    serializer_class = PredictionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PredictionHistory.objects.filter(user=self.request.user).order_by('-timestamp')

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([permissions.IsAuthenticated])
def predict_disease(request):
    if 'image' not in request.data:
        return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

    image_file = request.data['image']
    
    # 1. SAVE RECORD
    prediction_record = PredictionHistory.objects.create(image=image_file, user=request.user)

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
                info = DISEASE_INFO.get(predicted_label, {
                    "description": f"Auto-generated entry for {predicted_label}.",
                    "symptoms": "Symptoms to be added.",
                    "causes": "Causes to be added.",
                    "treatment": "Treatment to be added.",
                    "prevention": "Prevention to be added."
                })

                predicted_disease = Disease.objects.create(
                    name=predicted_label,
                    description=info["description"],
                    symptoms=info["symptoms"],
                    causes=info["causes"],
                    treatment=info["treatment"],
                    prevention=info["prevention"],
                    image=image_file
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
@permission_classes([permissions.IsAuthenticated])
def chatbot_response(request):
    message = request.data.get('message', '')
    history = request.data.get('history', [])

    if not str(message).strip():
        return Response(
            {"error": "Message is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    reply = get_chatbot_reply(str(message), history)
    return Response(reply)
