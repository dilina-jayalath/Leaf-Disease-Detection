from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Disease, PredictionHistory

class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'confirm_password']

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords must match."})
        return data

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'], # Use email as username
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class DiseaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disease
        fields = '__all__'

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        # token['email'] = user.email

        return token

class PredictionSerializer(serializers.ModelSerializer):
    disease_details = DiseaseSerializer(source='disease', read_only=True)

    class Meta:
        model = PredictionHistory
        fields = ['id', 'image', 'disease', 'disease_details', 'confidence', 'notes', 'timestamp']
