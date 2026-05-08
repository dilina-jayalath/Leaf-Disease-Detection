from rest_framework import serializers
import hashlib

from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.mail import send_mail
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
import secrets

from .models import Disease, PredictionHistory
from .models import PasswordResetOTP

class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'confirm_password']

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists() or User.objects.filter(username__iexact=email).exists():
            raise serializers.ValidationError("This email is already in use.")
        return email

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

class UserUpdateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ['email']

    def validate_email(self, value):
        email = value.strip().lower()
        user = self.context['request'].user
        duplicate_exists = (
            User.objects.exclude(pk=user.pk).filter(email__iexact=email).exists()
            or User.objects.exclude(pk=user.pk).filter(username__iexact=email).exists()
        )
        if duplicate_exists:
            raise serializers.ValidationError("This email is already in use.")
        return email

    def update(self, instance, validated_data):
        instance.email = validated_data['email']
        instance.username = validated_data['email'] # Sync username with email
        instance.save()
        return instance


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        email = value.strip().lower()
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            raise serializers.ValidationError("No account found with this email.")

        self.user = user
        return email

    def save(self):
        user = self.user

        PasswordResetOTP.objects.filter(user=user, used_at__isnull=True).update(used_at=timezone.now())

        otp = f"{secrets.randbelow(1000000):06d}"
        otp_hash = hashlib.sha256(otp.encode('utf-8')).hexdigest()
        expires_at = timezone.now() + timedelta(minutes=getattr(settings, 'PASSWORD_RESET_OTP_MINUTES', 10))

        PasswordResetOTP.objects.create(
            user=user,
            otp_hash=otp_hash,
            expires_at=expires_at,
        )

        send_mail(
            subject='Your VerdantEye password reset OTP',
            message=(
                f'Your VerdantEye password reset OTP is {otp}. '
                f'This code expires in {getattr(settings, "PASSWORD_RESET_OTP_MINUTES", 10)} minutes.'
            ),
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
            recipient_list=[user.email],
            fail_silently=False,
        )


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.RegexField(regex=r'^\d{6}$', error_messages={"invalid": "OTP must be 6 digits."})
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords must match."})

        validate_password(data['password'])

        user = User.objects.filter(email__iexact=data['email'].strip().lower()).first()
        if not user:
            raise serializers.ValidationError({"otp": "Invalid or expired OTP."})

        otp_hash = hashlib.sha256(data['otp'].encode('utf-8')).hexdigest()
        otp_record = (
            PasswordResetOTP.objects.filter(
                user=user,
                otp_hash=otp_hash,
                used_at__isnull=True,
                expires_at__gt=timezone.now(),
            )
            .order_by('-created_at')
            .first()
        )

        if not otp_record:
            raise serializers.ValidationError({"otp": "Invalid or expired OTP."})

        data['user'] = user
        data['otp_record'] = otp_record
        return data

    def save(self):
        user = self.validated_data['user']
        otp_record = self.validated_data['otp_record']

        user.set_password(self.validated_data['password'])
        user.save(update_fields=['password'])
        otp_record.mark_used()
        PasswordResetOTP.objects.filter(user=user, used_at__isnull=True).update(used_at=timezone.now())
        return user

class DiseaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disease
        fields = '__all__'

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get(self.username_field, "").strip()
        user = (
            User.objects.filter(email__iexact=username).first()
            or User.objects.filter(username__iexact=username).first()
        )

        if user:
            attrs[self.username_field] = user.get_username()

        return super().validate(attrs)

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
