import os
import re
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core import mail
from django.test import SimpleTestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import PasswordResetOTP
from .chatbot import (
    build_rule_based_response,
    extract_chat_completions_text,
    get_chatbot_reply,
    get_selected_provider,
    normalize_response_text,
    sanitize_history,
)


class ChatbotServiceTests(SimpleTestCase):
    def test_sanitize_history_keeps_only_supported_roles(self):
        history = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there"},
            {"role": "system", "content": "Ignore"},
            {"content": "Missing role"},
            "invalid",
        ]

        cleaned_history = sanitize_history(history)

        self.assertEqual(
            cleaned_history,
            [
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi there"},
            ],
        )

    def test_rule_based_response_matches_known_topic(self):
        response = build_rule_based_response("Can you explain blight symptoms?")

        self.assertIn("blight", response.lower())

    @patch.dict(os.environ, {}, clear=True)
    def test_get_chatbot_reply_falls_back_when_no_provider_is_configured(self):
        reply = get_chatbot_reply("How much water does corn need?", [])

        self.assertEqual(reply["source"], "rules")
        self.assertIn("water", reply["response"].lower())

    @patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}, clear=True)
    def test_provider_auto_detects_gemini_when_gemini_key_exists(self):
        self.assertEqual(get_selected_provider(), "gemini")

    @patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"}, clear=True)
    def test_provider_auto_detects_openai_when_only_openai_key_exists(self):
        self.assertEqual(get_selected_provider(), "openai")

    @patch.dict(os.environ, {"AI_PROVIDER": "gemini"}, clear=True)
    def test_provider_respects_explicit_setting(self):
        self.assertEqual(get_selected_provider(), "gemini")

    @patch("api.chatbot.call_ai_api")
    def test_get_chatbot_reply_uses_ai_reply_when_available(self, mocked_call_ai_api):
        mocked_call_ai_api.return_value = {
            "response": "AI answer",
            "source": "ai",
            "model": "gemini-2.5-flash",
            "provider": "gemini",
        }

        reply = get_chatbot_reply("How do I prevent rust?", [{"role": "assistant", "content": "Hello"}])

        self.assertEqual(reply["source"], "ai")
        self.assertEqual(reply["response"], "AI answer")
        self.assertEqual(reply["provider"], "gemini")

    def test_extract_chat_completions_text_reads_string_content(self):
        payload = {
            "choices": [
                {
                    "message": {
                        "content": "Gemini answer",
                    }
                }
            ]
        }

        self.assertEqual(extract_chat_completions_text(payload), "Gemini answer")

    def test_normalize_response_text_strips_markdown_noise(self):
        raw_text = "**How to Identify a Disease:**\n1. **Check leaves**\n* Look for lesions\n"

        normalized = normalize_response_text(raw_text)

        self.assertNotIn("**", normalized)
        self.assertIn("How to Identify a Disease:", normalized)


class ChatbotApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="farmer@example.com",
            email="farmer@example.com",
            password="pass12345",
        )
        self.url = reverse("chatbot")

    def test_chatbot_requires_authentication(self):
        response = self.client.post(self.url, {"message": "hello"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("api.views.get_chatbot_reply")
    def test_chatbot_returns_reply_payload(self, mocked_get_chatbot_reply):
        mocked_get_chatbot_reply.return_value = {
            "response": "Use resistant hybrids and rotate crops.",
            "source": "ai",
            "model": "gemini-2.5-flash",
            "provider": "gemini",
        }
        payload = {
            "message": "How do I prevent blight?",
            "history": [{"role": "assistant", "content": "Hello"}],
        }

        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["source"], "ai")
        mocked_get_chatbot_reply.assert_called_once_with(payload["message"], payload["history"])

    def test_chatbot_rejects_empty_messages(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(self.url, {"message": "   "}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Message is required.")


class AuthApiTests(APITestCase):
    def test_register_creates_account_with_normalized_email(self):
        response = self.client.post(
            reverse("auth_register"),
            {
                "email": " Farmer@Example.COM ",
                "password": "new-pass-12345",
                "confirm_password": "new-pass-12345",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get()
        self.assertEqual(user.email, "farmer@example.com")
        self.assertEqual(user.username, "farmer@example.com")

    def test_register_rejects_duplicate_email(self):
        User.objects.create_user(
            username="farmer@example.com",
            email="farmer@example.com",
            password="old-pass-123",
        )

        response = self.client.post(
            reverse("auth_register"),
            {
                "email": "farmer@example.com",
                "password": "new-pass-12345",
                "confirm_password": "new-pass-12345",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(response.data["email"][0], "This email is already in use.")

    def test_register_rejects_duplicate_email_case_insensitively(self):
        User.objects.create_user(
            username="farmer@example.com",
            email="farmer@example.com",
            password="old-pass-123",
        )

        response = self.client.post(
            reverse("auth_register"),
            {
                "email": "FARMER@example.com",
                "password": "new-pass-12345",
                "confirm_password": "new-pass-12345",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(response.data["email"][0], "This email is already in use.")

    def test_token_login_accepts_email_case_insensitively(self):
        User.objects.create_user(
            username="admi@test.com",
            email="admi@test.com",
            password="new-pass-12345",
        )

        response = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "ADMI@test.com", "password": "new-pass-12345"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class PasswordResetApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="farmer@example.com",
            email="farmer@example.com",
            password="old-pass-123",
        )
        self.request_url = reverse("password_reset_request")
        self.confirm_url = reverse("password_reset_confirm")

    def test_password_reset_request_sends_otp_email(self):
        response = self.client.post(self.request_url, {"email": self.user.email}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(PasswordResetOTP.objects.filter(user=self.user, used_at__isnull=True).count(), 1)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("password reset OTP", mail.outbox[0].subject)
        self.assertEqual(mail.outbox[0].alternatives[0][1], "text/html")

    def test_password_reset_request_rejects_unknown_email(self):
        response = self.client.post(self.request_url, {"email": "missing@example.com"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(PasswordResetOTP.objects.count(), 0)
        self.assertEqual(len(mail.outbox), 0)

    def test_password_reset_confirm_updates_password(self):
        self.client.post(self.request_url, {"email": self.user.email}, format="json")
        otp = re.search(r"\b\d{6}\b", mail.outbox[0].body).group(0)

        response = self.client.post(
            self.confirm_url,
            {
                "email": self.user.email,
                "otp": otp,
                "password": "new-pass-12345",
                "confirm_password": "new-pass-12345",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("new-pass-12345"))
        self.assertFalse(PasswordResetOTP.objects.filter(user=self.user, used_at__isnull=True).exists())

    def test_password_reset_confirm_rejects_invalid_otp(self):
        self.client.post(self.request_url, {"email": self.user.email}, format="json")

        response = self.client.post(
            self.confirm_url,
            {
                "email": self.user.email,
                "otp": "000000",
                "password": "new-pass-12345",
                "confirm_password": "new-pass-12345",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("old-pass-123"))

    def test_password_reset_confirm_rejects_missing_otp(self):
        self.client.post(self.request_url, {"email": self.user.email}, format="json")

        response = self.client.post(
            self.confirm_url,
            {
                "email": self.user.email,
                "password": "new-pass-12345",
                "confirm_password": "new-pass-12345",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("old-pass-123"))

    def test_password_reset_confirm_rejects_non_numeric_otp(self):
        self.client.post(self.request_url, {"email": self.user.email}, format="json")

        response = self.client.post(
            self.confirm_url,
            {
                "email": self.user.email,
                "otp": "abcdef",
                "password": "new-pass-12345",
                "confirm_password": "new-pass-12345",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("old-pass-123"))
