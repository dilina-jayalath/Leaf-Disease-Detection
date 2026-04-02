import os
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import SimpleTestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

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
