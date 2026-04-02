import json
import logging
import os
import re
from urllib import error, request


logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
You are Plant Care Assistant, a helpful chatbot for a corn disease detection app.

Your job:
- Answer questions about corn diseases, plant care, symptoms, treatment, prevention, watering, soil, pests, and crop management.
- Prefer practical, farmer-friendly guidance.
- Be concise but useful. Prefer 2 to 5 short sentences, or up to 4 short bullets only when a list genuinely helps.
- Use plain text only. Do not use Markdown headings, bold markers, or long numbered lists.
- If a question is outside corn or plant care, reply briefly and steer the user back to plant-health topics.
- If you are unsure, say so clearly instead of inventing facts.
- Do not claim you inspected an image unless the user or system explicitly provided one.
- If the user asks a broad diagnosis question without enough symptoms, ask 1 or 2 short follow-up questions instead of giving a long generic tutorial.
- Do not tell the user to use the app or upload a photo unless they explicitly ask how to use the app.
""".strip()

DEFAULT_AI_PROVIDER = "openai"
OPENAI_DEFAULT_MODEL = "gpt-5.4-mini"
OPENAI_DEFAULT_BASE_URL = "https://api.openai.com/v1"
OPENAI_DEFAULT_REASONING_EFFORT = "none"
GEMINI_DEFAULT_MODEL = "gemini-2.5-flash"
GEMINI_DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai"
MAX_HISTORY_ITEMS = 12
MAX_MESSAGE_LENGTH = 1000
DEFAULT_MAX_OUTPUT_TOKENS = 500
DEFAULT_TIMEOUT_SECONDS = 25

CHAT_RULES = [
    (
        ["hello", "hi", "hey", "greetings"],
        "Hello! I am your Corn Disease Assistant. I can help with blight, common rust, gray leaf spot, and general corn care advice.",
    ),
    (
        ["who are you", "what are you"],
        "I am an AI plant assistant for this corn disease app. Ask me about symptoms, treatment, prevention, or crop care.",
    ),
    (
        ["blight symptoms", "signs of blight", "look like blight"],
        "Northern Corn Leaf Blight causes long, cigar-shaped gray-green or tan lesions. It often starts on lower leaves and spreads upward.",
    ),
    (
        ["treat blight", "cure blight", "stop blight", "blight treatment"],
        "To manage blight, use suitable fungicides early when pressure is high, plant resistant hybrids, and rotate crops to reduce infected residue.",
    ),
    (
        ["prevent blight", "avoid blight", "blight resistant"],
        "Prevent blight by choosing resistant hybrids, rotating crops, and managing residue so the fungus does not persist in the field.",
    ),
    (
        ["what is blight", "explain blight"],
        "Blight is a fungal corn disease that damages leaf tissue and can reduce yield by limiting photosynthesis.",
    ),
    (
        ["rust symptoms", "signs of rust", "look like rust"],
        "Common Rust appears as small cinnamon-brown pustules on both leaf surfaces. Severe infections can reduce plant vigor.",
    ),
    (
        ["treat rust", "cure rust", "stop rust", "rust treatment"],
        "Common Rust is often managed with resistant hybrids. Fungicides may help when infection is severe on young plants.",
    ),
    (
        ["is rust dangerous", "rust damage"],
        "Common Rust is usually less damaging than some other rust diseases, but severe infection can still reduce yield in susceptible corn.",
    ),
    (
        ["prevent rust", "avoid rust"],
        "The best prevention is resistant hybrids and good crop monitoring so you can respond early if disease pressure increases.",
    ),
    (
        ["gray leaf spot", "gls", "rectangular", "spot symptoms"],
        "Gray Leaf Spot causes rectangular tan-to-gray lesions that run along the leaf veins, especially in warm and humid conditions.",
    ),
    (
        ["treat gray leaf spot", "treat gls"],
        "Gray Leaf Spot is commonly managed with residue control, crop rotation, resistant hybrids, and fungicides when disease pressure is high.",
    ),
    (
        ["yellow leaves", "yellowing"],
        "Yellowing leaves can be caused by nitrogen deficiency, root stress, waterlogging, or disease. Check the leaf pattern, soil moisture, and recent fertilizer history.",
    ),
    (
        ["watering", "how much water", "irrigation"],
        "Corn typically needs around 1 to 1.5 inches of water per week, with especially high demand during tasseling and grain fill.",
    ),
    (
        ["fertilizer", "nitrogen", "feeding"],
        "Corn is a heavy nitrogen feeder. Use soil-test guidance where possible and time nitrogen applications to support rapid vegetative growth.",
    ),
    (
        ["planting depth", "how deep"],
        "Corn seed is commonly planted about 1.5 to 2 inches deep, depending on soil conditions and moisture.",
    ),
    (
        ["soil ph", "best soil"],
        "Corn generally performs best in well-drained soil with a pH around 6.0 to 7.0. A soil test is the best way to confirm nutrient needs.",
    ),
    (
        ["pests", "bugs", "worms"],
        "Common corn pests include corn earworm, borers, and rootworms. Regular scouting is important so you can detect damage early.",
    ),
    (
        ["harvest", "when to harvest"],
        "Field corn is usually harvested near physiological maturity after black layer formation, with grain dried to a safe storage moisture level.",
    ),
    (
        ["help", "options"],
        "You can ask about disease symptoms, treatment, prevention, watering, fertilizer, pests, soil, or harvest timing.",
    ),
]

DEFAULT_RULE_RESPONSE = (
    "I am not fully sure about that. Try asking about corn disease symptoms, treatment, prevention, watering, fertilizer, or pests."
)


def sanitize_history(history):
    if not isinstance(history, list):
        return []

    cleaned_history = []
    for item in history[-MAX_HISTORY_ITEMS:]:
        if not isinstance(item, dict):
            continue

        role = item.get("role")
        content = (item.get("content") or "").strip()
        if role not in {"user", "assistant"} or not content:
            continue

        cleaned_history.append(
            {
                "role": role,
                "content": content[:MAX_MESSAGE_LENGTH],
            }
        )

    return cleaned_history


def build_rule_based_response(message):
    lowered_message = message.lower()
    for keywords, response in CHAT_RULES:
        if any(keyword in lowered_message for keyword in keywords):
            return response
    return DEFAULT_RULE_RESPONSE


def build_conversation_input(message, history):
    transcript = ["Conversation between a user and a plant-care assistant."]
    for item in sanitize_history(history):
        speaker = "User" if item["role"] == "user" else "Assistant"
        transcript.append(f"{speaker}: {item['content']}")

    transcript.append(f"User: {message}")
    transcript.append("Assistant:")
    return "\n".join(transcript)


def build_chat_messages(message, history):
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(sanitize_history(history))
    messages.append({"role": "user", "content": message})
    return messages


def extract_responses_api_text(payload):
    if isinstance(payload.get("output_text"), str) and payload["output_text"].strip():
        return payload["output_text"].strip()

    text_parts = []
    for item in payload.get("output", []):
        if not isinstance(item, dict):
            continue
        for content in item.get("content", []):
            if not isinstance(content, dict):
                continue
            content_type = content.get("type")
            text = content.get("text") or content.get("output_text")
            if content_type in {"output_text", "text"} and isinstance(text, str) and text.strip():
                text_parts.append(text.strip())

    return "\n".join(text_parts).strip()


def extract_chat_completions_text(payload):
    choices = payload.get("choices", [])
    if not isinstance(choices, list) or not choices:
        return ""

    message = choices[0].get("message", {})
    content = message.get("content")
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        text_parts = []
        for item in content:
            if not isinstance(item, dict):
                continue
            text = item.get("text")
            if isinstance(text, str) and text.strip():
                text_parts.append(text.strip())
        return "\n".join(text_parts).strip()

    return ""


def normalize_response_text(text):
    normalized = (text or "").replace("\r\n", "\n").strip()
    if not normalized:
        return ""

    normalized = re.sub(r"^\s{0,3}#{1,6}\s*", "", normalized, flags=re.MULTILINE)
    normalized = re.sub(r"\*\*(.*?)\*\*", r"\1", normalized)
    normalized = re.sub(r"__(.*?)__", r"\1", normalized)
    normalized = re.sub(r"`([^`]*)`", r"\1", normalized)
    normalized = re.sub(r"[ \t]+\n", "\n", normalized)
    normalized = re.sub(r"\n{3,}", "\n\n", normalized)

    if normalized.endswith("*"):
        normalized = normalized.rstrip("* ").rstrip()

    return normalized


def get_selected_provider():
    provider = os.getenv("AI_PROVIDER", "").strip().lower()
    if provider in {"openai", "gemini"}:
        return provider

    if os.getenv("GEMINI_API_KEY"):
        return "gemini"

    if os.getenv("OPENAI_API_KEY"):
        return "openai"

    return None


def get_float_env(name, default):
    try:
        return float(os.getenv(name, default))
    except (TypeError, ValueError):
        return float(default)


def get_int_env(name, default):
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return int(default)


def perform_json_post(url, payload, api_key, label, timeout_seconds):
    body = json.dumps(payload).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    api_request = request.Request(
        url=url,
        data=body,
        headers=headers,
        method="POST",
    )

    try:
        with request.urlopen(api_request, timeout=timeout_seconds) as api_response:
            return json.loads(api_response.read().decode("utf-8"))
    except error.HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="ignore")
        logger.warning("%s chatbot request failed: %s %s", label, exc.code, error_body[:500])
    except (error.URLError, TimeoutError, ValueError, json.JSONDecodeError) as exc:
        logger.warning("%s chatbot request failed: %s", label, exc)

    return None


def call_openai_responses_api(message, history):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    base_url = os.getenv("OPENAI_BASE_URL", OPENAI_DEFAULT_BASE_URL).rstrip("/")
    model = os.getenv("OPENAI_CHAT_MODEL", OPENAI_DEFAULT_MODEL)
    reasoning_effort = os.getenv("OPENAI_REASONING_EFFORT", OPENAI_DEFAULT_REASONING_EFFORT).strip()
    timeout_seconds = get_float_env("OPENAI_TIMEOUT_SECONDS", DEFAULT_TIMEOUT_SECONDS)
    max_output_tokens = get_int_env("OPENAI_MAX_OUTPUT_TOKENS", DEFAULT_MAX_OUTPUT_TOKENS)

    payload = {
        "model": model,
        "instructions": SYSTEM_PROMPT,
        "input": build_conversation_input(message, history),
        "max_output_tokens": max_output_tokens,
    }

    if reasoning_effort:
        payload["reasoning"] = {"effort": reasoning_effort}

    response_payload = perform_json_post(
        url=f"{base_url}/responses",
        payload=payload,
        api_key=api_key,
        label="OpenAI",
        timeout_seconds=timeout_seconds,
    )
    if not response_payload:
        return None

    response_text = extract_responses_api_text(response_payload)
    if not response_text:
        logger.warning("OpenAI chatbot response did not contain text output.")
        return None
    response_text = normalize_response_text(response_text)

    return {
        "response": response_text,
        "source": "ai",
        "model": model,
        "provider": "openai",
    }


def call_gemini_chat_completions(message, history):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    base_url = os.getenv("GEMINI_BASE_URL", GEMINI_DEFAULT_BASE_URL).rstrip("/")
    model = os.getenv("GEMINI_CHAT_MODEL", GEMINI_DEFAULT_MODEL)
    reasoning_effort = os.getenv("GEMINI_REASONING_EFFORT", "").strip()
    timeout_seconds = get_float_env("GEMINI_TIMEOUT_SECONDS", DEFAULT_TIMEOUT_SECONDS)
    max_output_tokens = get_int_env("GEMINI_MAX_OUTPUT_TOKENS", DEFAULT_MAX_OUTPUT_TOKENS)

    payload = {
        "model": model,
        "messages": build_chat_messages(message, history),
        "max_tokens": max_output_tokens,
    }

    if reasoning_effort:
        payload["reasoning_effort"] = reasoning_effort

    response_payload = perform_json_post(
        url=f"{base_url}/chat/completions",
        payload=payload,
        api_key=api_key,
        label="Gemini",
        timeout_seconds=timeout_seconds,
    )
    if not response_payload:
        return None

    response_text = extract_chat_completions_text(response_payload)
    if not response_text:
        logger.warning("Gemini chatbot response did not contain text output.")
        return None
    response_text = normalize_response_text(response_text)

    return {
        "response": response_text,
        "source": "ai",
        "model": model,
        "provider": "gemini",
    }


def call_ai_api(message, history):
    provider = get_selected_provider()
    if not provider:
        return None

    if provider == "gemini":
        return call_gemini_chat_completions(message, history)

    if provider == "openai":
        return call_openai_responses_api(message, history)

    logger.warning("Unsupported AI_PROVIDER value: %s", provider)
    return None


def get_chatbot_reply(message, history=None):
    cleaned_message = (message or "").strip()
    if not cleaned_message:
        return {
            "response": "Please enter a message first.",
            "source": "validation",
        }

    cleaned_history = sanitize_history(history or [])
    ai_reply = call_ai_api(cleaned_message[:MAX_MESSAGE_LENGTH], cleaned_history)
    if ai_reply:
        return ai_reply

    return {
        "response": build_rule_based_response(cleaned_message),
        "source": "rules",
        "model": None,
        "provider": None,
    }
