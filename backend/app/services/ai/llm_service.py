import json
import logging
import time
from typing import Any, Optional, Dict
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.timeout = 60.0
        self.total_tokens_used = 0

    @property
    def api_key(self) -> str:
        return settings.LLM_API_KEY

    @property
    def provider(self) -> str:
        return (settings.LLM_PROVIDER or "openai").lower()

    @property
    def model(self) -> str:
        return settings.LLM_MODEL or "google/gemma-4-31b-it:free"

    @property
    def embedding_model(self) -> str:
        return settings.EMBEDDING_MODEL or "text-embedding-004"

    @property
    def base_url(self) -> str:
        return settings.LLM_BASE_URL or "https://openrouter.ai/api/v1"

    async def generate_structured(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        retries: int = 2
    ) -> Dict[str, Any]:
        """
        Generates structured JSON output from the LLM.
        """
        for attempt in range(retries + 1):
            try:
                raw_response = await self.generate_text(
                    prompt=prompt,
                    system_instruction=system_instruction,
                    json_mode=True
                )
                
                # Clean potential markdown fences
                cleaned = raw_response.strip()
                if cleaned.startswith("```json"):
                    cleaned = cleaned[7:]
                elif cleaned.startswith("```"):
                    cleaned = cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                cleaned = cleaned.strip()

                parsed = json.loads(cleaned)
                return parsed
            except json.JSONDecodeError as jde:
                logger.warning(f"Failed to parse LLM JSON on attempt {attempt+1}: {jde}")
                if attempt == retries:
                    raise ValueError(f"LLM did not return valid JSON: {jde}")
            except Exception as e:
                logger.error(f"Error calling LLM on attempt {attempt+1}: {e}")
                if attempt == retries:
                    raise e
                time.sleep(1)

    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        json_mode: bool = False
    ) -> str:
        """
        Calls the configured LLM provider API (Gemini or OpenAI/OpenRouter-compatible).
        If API key is not configured, raises ValueError. No hardcoded or mock JSON profiles are returned.
        """
        if not self.api_key:
            raise ValueError(
                "LLM API key is not configured. Please set LLM_API_KEY in backend/.env to enable live AI resume analysis and career chat."
            )

        if self.provider == "gemini":
            return await self._call_gemini(prompt, system_instruction, json_mode)
        else:
            return await self._call_openai_compatible(prompt, system_instruction, json_mode)

    async def _call_gemini(self, prompt: str, system_instruction: Optional[str], json_mode: bool) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        
        contents = []
        if system_instruction:
            contents.append({
                "role": "user",
                "parts": [{"text": f"System Instructions:\n{system_instruction}"}]
            })
            contents.append({
                "role": "model",
                "parts": [{"text": "Understood. I will follow all instructions strictly."}]
            })
        
        contents.append({
            "role": "user",
            "parts": [{"text": prompt}]
        })

        payload: Dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.1 if json_mode else 0.7,
                "maxOutputTokens": 4096,
            }
        }
        if json_mode:
            payload["generationConfig"]["responseMimeType"] = "application/json"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                logger.error(f"Gemini API error {resp.status_code}: {resp.text}")
                resp.raise_for_status()
            
            data = resp.json()
            usage = data.get("usageMetadata", {})
            self.total_tokens_used += usage.get("totalTokenCount", 0)
            
            candidates = data.get("candidates", [])
            if not candidates:
                raise ValueError("No response candidate returned from Gemini")
            
            parts = candidates[0].get("content", {}).get("parts", [])
            if not parts:
                return "{}" if json_mode else ""
            return parts[0].get("text", "")

    async def _call_openai_compatible(self, prompt: str, system_instruction: Optional[str], json_mode: bool) -> str:
        base = self.base_url or "https://api.openai.com/v1"
        url = f"{base}/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Peaklyy Career Intelligence"
        }
        
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        is_openrouter = "openrouter.ai" in base

        # Primary model to try
        models_to_try = [self.model]
        # If calling OpenRouter with a free model, add resilient fallback models in case upstream provider returns 429
        if is_openrouter and ":free" in self.model:
            fallbacks = ["nvidia/nemotron-3.5-lightning:free", "openrouter/free"]
            for f in fallbacks:
                if f not in models_to_try:
                    models_to_try.append(f)

        last_error = None
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for model_candidate in models_to_try:
                payload: Dict[str, Any] = {
                    "model": model_candidate,
                    "messages": messages,
                    "temperature": 0.1 if json_mode else 0.7,
                }
                if is_openrouter:
                    payload["reasoning"] = {"effort": "none"}
                elif json_mode:
                    payload["response_format"] = {"type": "json_object"}

                try:
                    resp = await client.post(url, headers=headers, json=payload)
                    
                    # If provider fails due to response_format not supported, retry once without it
                    if resp.status_code == 400 and json_mode and "response_format" in resp.text:
                        payload.pop("response_format", None)
                        resp = await client.post(url, headers=headers, json=payload)

                    if resp.status_code == 429:
                        logger.warning(
                            f"Model {model_candidate} returned 429 rate limit on OpenRouter. Attempting next fallback model..."
                        )
                        last_error = f"Model {model_candidate} rate limited (429)"
                        continue

                    if resp.status_code != 200:
                        logger.error(f"OpenAI/OpenRouter API error {resp.status_code} for {model_candidate}: {resp.text}")
                        last_error = f"API error {resp.status_code}: {resp.text}"
                        continue

                    data = resp.json()
                    usage = data.get("usage", {})
                    self.total_tokens_used += usage.get("total_tokens", 0)

                    choices = data.get("choices", [])
                    if not choices:
                        raise ValueError(f"No choices returned from model {model_candidate}")

                    choice_msg = choices[0].get("message", {})
                    content = choice_msg.get("content") or ""

                    # Recover content if placed in reasoning field
                    if not content.strip() and choice_msg.get("reasoning"):
                        reasoning = choice_msg.get("reasoning", "")
                        if "```json" in reasoning:
                            start = reasoning.find("```json") + 7
                            end = reasoning.find("```", start)
                            content = reasoning[start:end].strip() if end != -1 else reasoning[start:].strip()
                        elif "{" in reasoning and "}" in reasoning:
                            start = reasoning.find("{")
                            end = reasoning.rfind("}") + 1
                            content = reasoning[start:end]

                    return content

                except Exception as e:
                    logger.warning(f"Error calling {model_candidate}: {e}")
                    last_error = str(e)
                    continue

        raise RuntimeError(f"All LLM candidate models failed. Last error: {last_error}")

    async def get_embedding(self, text: str) -> list[float]:
        """
        Generates semantic embedding vector.
        """
        if self.api_key and self.provider == "gemini":
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.embedding_model}:embedContent?key={self.api_key}"
                payload = {
                    "model": f"models/{self.embedding_model}",
                    "content": {"parts": [{"text": text[:2000]}]}
                }
                async with httpx.AsyncClient(timeout=20.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        values = data.get("embedding", {}).get("values", [])
                        if values:
                            return values
            except Exception as e:
                logger.warning(f"Error fetching Gemini embedding: {e}")

        elif self.api_key and (self.provider == "openai" or self.base_url):
            try:
                base = self.base_url or "https://api.openai.com/v1"
                url = f"{base}/embeddings"
                headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
                payload = {"input": text[:2000], "model": self.embedding_model or "text-embedding-3-small"}
                async with httpx.AsyncClient(timeout=20.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        return data["data"][0]["embedding"]
            except Exception as e:
                logger.warning(f"Error fetching OpenAI embedding: {e}")

        # Deterministic semantic hash vector embedding fallback (384 dimensions)
        return self._generate_dense_fallback_embedding(text)

    def _generate_dense_fallback_embedding(self, text: str, dim: int = 128) -> list[float]:
        import hashlib
        import math
        tokens = text.lower().split()
        vec = [0.0] * dim
        for i, token in enumerate(tokens):
            h = int(hashlib.sha256(token.encode('utf-8')).hexdigest(), 16)
            idx = h % dim
            sign = 1.0 if ((h >> 8) & 1) else -1.0
            vec[idx] += sign * (1.0 / (1.0 + 0.1 * math.log1p(i)))
        # Normalize vector
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [round(x / norm, 5) for x in vec]
        return vec


llm_service = LLMService()
