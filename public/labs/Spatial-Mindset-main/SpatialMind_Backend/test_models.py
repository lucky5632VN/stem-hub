import os
import json
import logging
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List, Optional

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

models_to_test = [
    "gemini-3-flash-preview",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite-preview-02-05"
]

prompt = "Phản hồi '{ \"status\": \"ok\" }'"
config = types.GenerateContentConfig(response_mime_type="application/json")

for model in models_to_test:
    print(f"Testing {model}...")
    try:
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=config
        )
        print(f"[{model}] SUCCESS: {response.text}")
        break  # Found one that works!
    except Exception as e:
        print(f"[{model}] ERROR: {e}")
