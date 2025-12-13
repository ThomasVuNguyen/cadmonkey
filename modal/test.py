#!/usr/bin/env python3
"""
Streaming-only tests for Cadmonkey Chat:
 - Cube (non-stream tokens filtered)
 - Cat
 - Dog

Prints streaming tokens as they arrive, filtering out llama banner/log noise.
"""

import json
import sys
from pathlib import Path

import requests

# Stream endpoint
STREAM_URL = "https://thomas-15--cadmonkey-chat-chat-stream.modal.run"

NOISE_SUBSTRINGS = {
    "Loading model",
    "build",
    "model      :",
    "modalities",
    "available commands",
    "/exit",
    "/regen",
    "/clear",
    "/read",
    "> User:",
    "Prompt:",
    "Generation:",
    ">>>>",
    "█",  # block glyph noise
    "▀",
    "▄",
    "llama_memory_breakdown_print",
    "Exiting",
}


def is_noise(token: str) -> bool:
    """Heuristic to drop banner/log lines from the stream."""
    if not token.strip():
        return True
    for sub in NOISE_SUBSTRINGS:
        if sub in token:
            return True
    clean = token.strip()
    # Drop pure or dominant ">" filler lines
    if set(clean) <= {">"}:
        return True
    if clean.count(">") >= max(10, len(clean) // 2):
        return True
    return False


def stream_prompt(
    prompt: str, label: str, max_tokens: int | None = None, save_path: str | None = None
) -> bool:
    """Stream a prompt and print cleaned tokens."""
    print("\n" + "=" * 60)
    print(f"Testing Streaming: {label}")
    print("=" * 60)

    payload = {"message": prompt, "temperature": 0.7}
    if max_tokens is not None:
        payload["max_tokens"] = max_tokens
    print(f"Sending request to: {STREAM_URL}")
    print("Payload:", json.dumps(payload, indent=2))

    collected_tokens: list[str] = [] if save_path else None

    try:
        response = requests.post(
            STREAM_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            stream=True,
            timeout=300,
        )
    except Exception as e:
        print(f"[FAIL] Request error: {e}")
        return False

    print(f"Status Code: {response.status_code}")
    if response.status_code != 200:
        print(f"[FAIL] Error Response: {response.text}")
        return False

    print("Streaming output (filtered tokens):")
    try:
        for line in response.iter_lines(decode_unicode=True):
            if not line:
                continue
            if not line.startswith("data: "):
                continue
            try:
                data = json.loads(line[6:])
            except Exception as parse_err:
                print(f"\n[WARN] Parse error: {parse_err} on line: {line}")
                continue

            if "token" in data:
                token = data["token"]
                if is_noise(token):
                    continue
                # Ensure tokens are newline-terminated for readability/SCAD validity
                token_out = token
                if not token_out.endswith("\n"):
                    token_out = token_out + "\n"
                print(token_out, end="", flush=True)
                if collected_tokens is not None:
                    collected_tokens.append(token_out)
            if data.get("done"):
                if collected_tokens is not None:
                    try:
                        path = Path(save_path)
                        path.parent.mkdir(parents=True, exist_ok=True)
                        path.write_text("".join(collected_tokens), encoding="utf-8")
                        print(f"\n[saved] Wrote stream to {path}")
                    except Exception as write_err:
                        print(f"\n[WARN] Failed to save stream to {save_path}: {write_err}")
                print("\n<stream complete>")
                return True
            if data.get("error"):
                print(f"\n[FAIL] Stream error: {data['error']}")
                return False
    except Exception as e:
        print(f"\n[FAIL] Streaming error: {e}")
        return False

    print("\n[WARN] Stream ended without done flag")
    return False


def run_tests() -> int:
    results = []

    results.append(("Cube", stream_prompt("hey cadmonkey, make me a cube", "Cube")))
    results.append(
        (
            "Cat",
            stream_prompt(
                "hey cadmonkey, make me a cat",
                "Cat",
                save_path="cat_output.scad",
            ),
        )
    )
    results.append(("Dog", stream_prompt("hey cadmonkey, make me a dog", "Dog")))

    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    passed = sum(1 for _, ok in results if ok)
    total = len(results)
    for name, ok in results:
        status = "[OK]" if ok else "[FAIL]"
        print(f"{name}: {status}")
    print(f"\nTotal: {passed}/{total} passed")
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(run_tests())
