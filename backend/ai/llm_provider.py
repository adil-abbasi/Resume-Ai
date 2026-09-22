"""
LLM Provider Abstraction Layer
==============================
Pluggable backend for AI inference: Groq (high-speed cloud), Ollama (local), Gemini.

Environment Variables:
    LLM_PROVIDER   : "groq" (recommended) | "ollama" | "gemini"
    GROQ_API_KEY   : Required for Groq
    GROQ_MODEL     : "qwen/qwen3.8-27b" (default)
    OLLAMA_BASE_URL: http://localhost:11434  (default)
    OLLAMA_MODEL   : qwen3:4b               (default)
    GEMINI_API_KEY : Required if LLM_PROVIDER=gemini
"""

import os
import json
import re
import time
import logging
import requests
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Generator, Optional

logger = logging.getLogger(__name__)


def _load_env_file():
    """Lightweight loader for .env files without external dependencies."""
    candidates = [
        os.path.join(os.path.dirname(__file__), "..", ".env"),
        os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
        ".env"
    ]
    for c in candidates:
        if os.path.exists(c):
            try:
                with open(c, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip('"').strip("'")
                            if k not in os.environ or not os.environ[k]:
                                os.environ[k] = v
            except Exception:
                pass
            break

_load_env_file()


# ---------------------------------------------------------------------------
# Base class
# ---------------------------------------------------------------------------

class LLMProvider(ABC):
    """Abstract interface every LLM backend must implement."""

    @abstractmethod
    def chat(self, messages: List[Dict[str, str]], temperature: float = 0.7, max_tokens: Optional[int] = None) -> str:
        """Send a message list and return the full response string."""
        ...

    @abstractmethod
    def stream_chat(self, messages: List[Dict[str, str]], temperature: float = 0.7, max_tokens: Optional[int] = None) -> Generator[str, None, None]:
        """Yield response tokens as they arrive."""
        ...

    @abstractmethod
    def is_available(self) -> bool:
        """Return True if the provider can currently serve requests."""
        ...

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Human-readable name of the model in use."""
        ...


# ---------------------------------------------------------------------------
# Ollama Provider
# ---------------------------------------------------------------------------

class OllamaProvider(LLMProvider):
    """Talks to a locally running Ollama server (http://localhost:11434)."""

    def __init__(self):
        self._base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
        self._model = os.environ.get("OLLAMA_MODEL", "qwen3:4b")
        self._last_avail_check: float = 0
        self._last_avail_result: bool = False

    @property
    def model_name(self) -> str:
        return f"Ollama / {self._model}"

    def is_available(self) -> bool:
        now = time.time()
        if now - self._last_avail_check < 15.0:
            return self._last_avail_result
        try:
            resp = requests.get(f"{self._base_url}/api/tags", timeout=1.5)
            self._last_avail_result = (resp.status_code == 200)
        except Exception:
            self._last_avail_result = False
        self._last_avail_check = now
        return self._last_avail_result

    def chat(self, messages: List[Dict[str, str]], temperature: float = 0.7, max_tokens: Optional[int] = None) -> str:
        """Blocking non-streaming chat. Returns complete response text."""
        options: Dict[str, Any] = {
            "temperature": temperature,
            "stop": ["<|im_end|>", "<|im_start|>", "</think>"]
        }
        if max_tokens:
            options["num_predict"] = max_tokens

        payload = {
            "model": self._model,
            "messages": messages,
            "stream": False,
            "options": options,
        }
        try:
            resp = requests.post(
                f"{self._base_url}/api/chat",
                json=payload,
                timeout=120,
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("message", {}).get("content", "")
        except Exception as e:
            logger.error(f"Ollama chat error: {e}")
            raise RuntimeError(f"Ollama request failed: {e}") from e

    def stream_chat(
        self, messages: List[Dict[str, str]], temperature: float = 0.7, max_tokens: Optional[int] = None
    ) -> Generator[str, None, None]:
        """Streaming chat — yields one token/chunk at a time."""
        options: Dict[str, Any] = {
            "temperature": temperature,
            "stop": ["<|im_end|>", "<|im_start|>", "</think>"]
        }
        if max_tokens:
            options["num_predict"] = max_tokens

        payload = {
            "model": self._model,
            "messages": messages,
            "stream": True,
            "options": options,
        }
        try:
            with requests.post(
                f"{self._base_url}/api/chat",
                json=payload,
                stream=True,
                timeout=120,
            ) as resp:
                resp.raise_for_status()
                for raw_line in resp.iter_lines():
                    if not raw_line:
                        continue
                    try:
                        chunk = json.loads(raw_line)
                        token = chunk.get("message", {}).get("content", "")
                        if token:
                            yield token
                        if chunk.get("done", False):
                            break
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            logger.error(f"Ollama stream error: {e}")
            raise RuntimeError(f"Ollama streaming failed: {e}") from e



# ---------------------------------------------------------------------------
# Gemini Provider (cloud fallback — kept for future use)
# ---------------------------------------------------------------------------

class GeminiProvider(LLMProvider):
    """Google Gemini via the google-genai SDK."""

    def __init__(self):
        self._api_key = os.environ.get("GEMINI_API_KEY", "")
        self._model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

    @property
    def model_name(self) -> str:
        return f"Gemini / {self._model}"

    def is_available(self) -> bool:
        return bool(self._api_key)

    def _build_prompt(self, messages: List[Dict[str, str]]) -> str:
        """Flatten message list into a single prompt string for Gemini."""
        parts = []
        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            if role == "system":
                parts.append(f"[SYSTEM]\n{content}\n")
            elif role == "user":
                parts.append(f"User: {content}")
            else:
                parts.append(f"Assistant: {content}")
        return "\n".join(parts)

    def chat(self, messages: List[Dict[str, str]], temperature: float = 0.7) -> str:
        try:
            from google import genai
            client = genai.Client(api_key=self._api_key)
            prompt = self._build_prompt(messages)
            response = client.models.generate_content(
                model=self._model,
                contents=prompt,
            )
            return response.text or ""
        except Exception as e:
            logger.error(f"Gemini chat error: {e}")
            raise RuntimeError(f"Gemini request failed: {e}") from e

    def stream_chat(
        self, messages: List[Dict[str, str]], temperature: float = 0.7
    ) -> Generator[str, None, None]:
        """Gemini streaming — yields text chunks."""
        try:
            from google import genai
            client = genai.Client(api_key=self._api_key)
            prompt = self._build_prompt(messages)
            for chunk in client.models.generate_content_stream(
                model=self._model,
                contents=prompt,
            ):
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logger.error(f"Gemini stream error: {e}")
            raise RuntimeError(f"Gemini streaming failed: {e}") from e


# ---------------------------------------------------------------------------
# Groq Provider (Ultra-Fast Cloud Inference, <500ms TTFT)
# ---------------------------------------------------------------------------

def sanitize_text(text: str) -> str:
    """Normalizes Unicode characters into standard clean UTF-8 text, eliminating Windows CP1252 glitches."""
    if not text:
        return ""
    replacements = {
        '\u2018': "'", '\u2019': "'", '\u201a': "'", '\u201b': "'",
        '\u201c': '"', '\u201d': '"', '\u201e': '"', '\u201f': '"',
        '\u2014': ' - ', '\u2013': ' - ', '\u2015': ' - ', '\u2012': ' - ',
        '\u2026': '...', '\u202f': ' ', '\u00a0': ' ', '\u2011': '-',
        '\u2022': '-', '\ufeff': '',
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'É': 'E', 'È': 'E', 'Ê': 'E',
        'à': 'a', 'á': 'a', 'â': 'a', 'ä': 'a',
        'ï': 'i', 'î': 'i', 'í': 'i',
        'ô': 'o', 'ö': 'o', 'ó': 'o',
        'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
        'ç': 'c', 'ñ': 'n',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text


class GroqProvider(LLMProvider):
    """
    Talks to Groq cloud API (https://api.groq.com/openai/v1) for ultra-low latency,
    high-intelligence career interviewing and resume extraction.
    """

    FALLBACK_MODEL = "qwen/qwen3.8-27b"

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self._api_key = api_key or os.environ.get("GROQ_API_KEY", "")
        self._model = model or os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")
        self._base_url = "https://api.groq.com/openai/v1"

    @property
    def model_name(self) -> str:
        return f"Groq / {self._model}"

    def is_available(self) -> bool:
        return bool(self._api_key and len(self._api_key) > 10)

    def _execute_with_fallback(self, func, *args, **kwargs):
        """Executes a request function; falls back to FALLBACK_MODEL on model-specific errors."""
        try:
            return func(self._model, *args, **kwargs)
        except Exception as e:
            if self._model != self.FALLBACK_MODEL:
                logger.warning(f"Groq {self._model} failed ({e}), falling back to {self.FALLBACK_MODEL}")
                return func(self.FALLBACK_MODEL, *args, **kwargs)
            raise

    def chat(self, messages: List[Dict[str, str]], temperature: float = 0.7, max_tokens: Optional[int] = None) -> str:
        """Blocking non-streaming chat with Groq."""
        if not self.is_available():
            raise RuntimeError("Groq API key not configured")

        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json"
        }

        def _do_chat(model_name: str) -> str:
            payload: Dict[str, Any] = {
                "model": model_name,
                "messages": messages,
                "temperature": temperature,
                "stream": False
            }
            if max_tokens:
                payload["max_tokens"] = max_tokens

            resp = requests.post(f"{self._base_url}/chat/completions", headers=headers, json=payload, timeout=25)
            resp.raise_for_status()
            data = resp.json()
            raw = data["choices"][0]["message"].get("content", "")
            return sanitize_text(raw)

        return self._execute_with_fallback(_do_chat)

    def stream_chat(
        self, messages: List[Dict[str, str]], temperature: float = 0.7, max_tokens: Optional[int] = None
    ) -> Generator[str, None, None]:
        """Streaming chat with Groq — yields sanitized token chunks as they arrive."""
        if not self.is_available():
            raise RuntimeError("Groq API key not configured")

        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json"
        }

        target_model = self._model
        payload: Dict[str, Any] = {
            "model": target_model,
            "messages": messages,
            "temperature": temperature,
            "stream": True
        }
        if max_tokens:
            payload["max_tokens"] = max_tokens

        try:
            resp = requests.post(
                f"{self._base_url}/chat/completions",
                headers=headers,
                json=payload,
                stream=True,
                timeout=25
            )
            # If status error on initial model, retry once with fallback
            if resp.status_code != 200 and target_model != self.FALLBACK_MODEL:
                target_model = self.FALLBACK_MODEL
                payload["model"] = target_model
                resp = requests.post(
                    f"{self._base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                    stream=True,
                    timeout=25
                )
            resp.raise_for_status()
            for line in resp.iter_lines():
                if not line:
                    continue
                line_str = line.decode("utf-8", errors="replace") if isinstance(line, bytes) else line
                if line_str.startswith("data: "):
                    raw_data = line_str[6:].strip()
                    if raw_data == "[DONE]":
                        break
                    try:
                        chunk = json.loads(raw_data)
                        delta = chunk.get("choices", [{}])[0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            yield sanitize_text(content)
                    except Exception:
                        continue
        except Exception as e:
            logger.error(f"Groq stream error: {e}")
            raise RuntimeError(f"Groq streaming failed: {e}") from e

    EXTRACTION_MODEL = "qwen/qwen3.8-27b"

    def extract_json(self, messages: List[Dict[str, str]], max_tokens: int = 600) -> Dict[str, Any]:
        """Runs JSON-constrained extraction with fast structured model and clean parsing."""
        if not self.is_available():
            return {}
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json"
        }

        def _do_extract(model_name: str) -> Dict[str, Any]:
            # Always prefer EXTRACTION_MODEL for json_object reliability
            target_model = self.EXTRACTION_MODEL
            payload = {
                "model": target_model,
                "messages": messages,
                "response_format": {"type": "json_object"},
                "temperature": 0.1,
                "max_tokens": max_tokens
            }
            resp = requests.post(f"{self._base_url}/chat/completions", headers=headers, json=payload, timeout=20)
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"].get("content", "{}")
            cleaned = re.sub(r'^```(?:json)?\n?', '', content.strip()).strip('`').strip()
            return json.loads(cleaned)

        try:
            return _do_extract(self.EXTRACTION_MODEL)
        except Exception as e:
            logger.warning(f"Groq extract_json error: {e}")
            return {}


# ---------------------------------------------------------------------------
# Factory — get the active provider
# ---------------------------------------------------------------------------

def get_provider() -> LLMProvider:
    """
    Returns the configured LLM provider.
    Priority:
      1. Groq (if GROQ_API_KEY is configured or LLM_PROVIDER=groq)
      2. Gemini (if LLM_PROVIDER=gemini)
      3. Ollama (local Qwen3)
    """
    _load_env_file()
    provider_name = os.environ.get("LLM_PROVIDER", "").lower()
    groq_key = os.environ.get("GROQ_API_KEY", "")

    if provider_name == "groq" or (groq_key and provider_name not in ("ollama", "gemini")):
        groq_prov = GroqProvider()
        if groq_prov.is_available():
            return groq_prov

    if provider_name == "gemini":
        gemini_prov = GeminiProvider()
        if gemini_prov.is_available():
            return gemini_prov

    if provider_name == "ollama":
        return OllamaProvider()

    # Default fallback: Groq if key exists, otherwise Ollama
    if groq_key:
        groq_prov = GroqProvider()
        if groq_prov.is_available():
            return groq_prov

    return OllamaProvider()


# Module-level singleton (lazy-init on first use)
_provider_instance: Optional[LLMProvider] = None


def provider() -> LLMProvider:
    """Module-level singleton accessor."""
    global _provider_instance
    if _provider_instance is None:
        _provider_instance = get_provider()
    return _provider_instance

