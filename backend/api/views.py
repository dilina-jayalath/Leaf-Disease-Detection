from rest_framework import viewsets, status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Disease, PredictionHistory
from rest_framework import viewsets, status, generics, permissions
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Disease, PredictionHistory
from .serializers import DiseaseSerializer, PredictionSerializer, UserSerializer, MyTokenObtainPairSerializer, UserUpdateSerializer
import random
from rest_framework_simplejwt.views import TokenObtainPairView

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
def chatbot_response(request):
    user_msg = request.data.get('message', '').lower()
    
    # Define Chatbot Rules: (Keywords) -> Response
    CHAT_RULES = [
        # --- GREETINGS ---
        (["hello", "hi", "hey", "greetings"], 
         "Hello! I am your Corn Disease Assistant. I can help you with Blight, Common Rust, Gray Leaf Spot, and general corn care advice."),
        (["who are you", "what are you"], 
         "I am an AI-powered assistant designed to help farmers identify and manage corn diseases."),

        # --- BLIGHT (NCLB) ---
        (["blight symptoms", "signs of blight", "look like blight"], 
         "Northern Corn Leaf Blight (NCLB) causes long, cigar-shaped, grayish-green or tan lesions (1-6 inches). They usually start on lower leaves and move up."),
        (["treat blight", "cure blight", "stop blight", "blight treatment"], 
         "To manage Blight: 1. Apply fungicides containing strobilurins or triazoles early (VT to R1 stages). 2. Rotate crops to reduce fungus in residue."),
        (["prevent blight", "avoid blight", "blight resistant"], 
         "Prevention is key! Plant resistant corn hybrids and manage crop residue through tillage or rotation to limit the fungus Exserohilum turcicum."),
        (["what is blight", "explain blight"],
         "Blight (NCLB) is a fungal disease that destroys leaf tissue, reducing photosynthesis. If it hits before silking, it can severely impact yield."),

        # --- COMMON RUST ---
        (["rust symptoms", "signs of rust", "look like rust"], 
         "Common Rust appears as small, cinnamon-brown, powdery pustules on BOTH upper and lower leaf surfaces. They are often circular or elongated."),
        (["treat rust", "cure rust", "stop rust", "rust treatment"], 
         "Fungicides are rarely needed for Common Rust unless infection is severe on very young plants. Triazoles and strobilurins work well."),
        (["is rust dangerous", "rust damage"], 
         "Common Rust is usually less damaging than Southern Rust, but severe infections can cause yield loss, especially in sweet corn or susceptible hybrids."),
        (["prevent rust", "avoid rust"], 
         "The best defense is planting resistant hybrids. Early planting can also help avoid the peak spore season."),

        # --- GRAY LEAF SPOT ---
        (["gray leaf spot", "gls", "rectangular", "spot symptoms"], 
         "Gray Leaf Spot causes rectangular, tan-to-gray lesions that run strictly parallel to the leaf veins. It thrives in warm, humid weather."),
        (["treat gray leaf spot", "treat gls"], 
         "Fungicides applied at tasseling (VT) to silking (R1) are most effective. Look for mixed-mode-of-action products."),

        # --- GENERAL CORN CARE ---
        (["yellow leaves", "yellowing"], 
         "Yellowing leaves often mean Nitrogen deficiency (V-shaped yellowing starting at tip) or wet feet (waterlogged soil). Check your drainage and fertilizer."),
        (["watering", "how much water", "irrigation"], 
         "Corn needs about 1 to 1.5 inches of water per week. The most critical time for water is during silking and pollination."),
        (["fertilizer", "nitrogen", "feeding"], 
         "Corn is a heavy feeder! It needs lots of Nitrogen. Apply starter fertilizer at planting and side-dress when plants are knee-high (V4-V8 stage)."),
        (["planting depth", "how deep"], 
         "Plant corn seeds 1.5 to 2 inches deep. Planting shallower can lead to poor root development (rootless corn syndrome)."),
        (["soil ph", "best soil"], 
         "Corn prefers well-drained soil with a pH between 6.0 and 7.0. conduct a soil test to check specific nutrient needs."),
        (["pests", "bugs", "worms"], 
         "Common pests include Corn Earworm, European Corn Borer, and Rootworms. Scouting is essential. Bt-corn hybrids offer built-in protection against some larvae."),
        (["harvest", "when to harvest"], 
         "Harvest field corn when the 'black layer' forms at the kernel base (physiological maturity). Moisture should ideally be around 15-20% for storage."),
         
        # --- FALLBACK ---
        (["help", "options"], 
         "You can ask me about: 'Symptoms of Blight', 'How to treat Rust', 'Watering needs', 'Fertilizer tips', or 'Harvesting'."),
    ]

    for keywords, response in CHAT_RULES:
        # Check if ANY keyword matches the user message
        if any(k in user_msg for k in keywords):
            return Response({"response": response})
            
    # Default response if no match
    return Response({"response": "I'm not sure about that. Try asking about 'Blight symptoms', 'Treating Rust', or 'Watering corn'."})
