# SpatialMind_Backend/daily_geometry.py
# Endpoint mới: /api/daily-geometry-challenge
# Trả về challenges dựa trên ngày (seed-based) + rank filtering

import json
import os
import random
from datetime import date
from typing import List, Optional
from pydantic import BaseModel

# Load challenge bank
_challenge_path = os.path.join(os.path.dirname(__file__), 'geometry_challenge_bank.json')

def load_challenges():
    try:
        with open(_challenge_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def seed_random(seed: int):
    """Deterministic seeded random"""
    s = seed
    def rand():
        nonlocal s
        s = (s * 1664525 + 1013904223) & 0xffffffff
        return (s & 0xffffffff) / 0xffffffff
    return rand

def get_daily_challenges(rank_level: int = 7) -> List[dict]:
    """Lấy challenges hôm nay theo rank"""
    all_challenges = load_challenges()
    today = date.today().isoformat().replace('-', '')
    rand  = seed_random(int(today))

    available = [c for c in all_challenges if c.get('rank_required', 1) <= rank_level]

    easy   = [c for c in available if c['difficulty'] == 'easy']
    medium = [c for c in available if c['difficulty'] == 'medium']
    hard   = [c for c in available if c['difficulty'] == 'hard']

    def pick(arr):
        if not arr: return None
        return arr[int(rand() * len(arr))]

    return [c for c in [pick(easy), pick(medium), pick(hard)] if c]
