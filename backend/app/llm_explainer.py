import os
from typing import Optional
from .config import LLM_API_KEY


def rewrite_explanation_with_llm(rule_name: str, quote: str, default_explanation: str) -> str:
    """
    OPTIONAL LLM explanation step.
    If LLM_API_KEY is configured, calls the LLM API to produce a concise,
    contextual 'why this matters' rewrite.
    If LLM_API_KEY is empty or if any error occurs, smoothly returns the default explanation.
    """
    api_key = os.getenv("LLM_API_KEY", LLM_API_KEY).strip()
    if not api_key:
        return default_explanation

    try:
        import httpx
        prompt = (
            f"You are a contract risk assistant. A rule '{rule_name}' was triggered by the following clause excerpt:\n"
            f"\"{quote}\"\n"
            f"Existing explanation: \"{default_explanation}\"\n\n"
            f"In 1-2 clear, punchy sentences, rewrite 'Why this matters for your business'. "
            f"Keep it objective, plain-language, and do not provide legal advice."
        )

        # Call Gemini or generic endpoint if key is provided
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        with httpx.Client(timeout=5.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                generated = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                if generated:
                    return generated
    except Exception as e:
        # Graceful fallback to default explanation
        print(f"LLM rewrite skipped or failed ({e}). Using default explanation.")

    return default_explanation
