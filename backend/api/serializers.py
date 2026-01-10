from rest_framework import serializers
from .models import Disease, PredictionHistory

class DiseaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disease
        fields = '__all__'

class PredictionSerializer(serializers.ModelSerializer):
    disease_details = DiseaseSerializer(source='disease', read_only=True)

    class Meta:
        model = PredictionHistory
        fields = ['id', 'image', 'disease', 'disease_details', 'confidence', 'timestamp']
