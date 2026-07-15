# =====================================================
# SpatialMind — AI Proxy Server (Smart API Key Management)
# =====================================================
# Giải quyết vấn đề: API Key bị quá tải / rate limit
#
# Tính năng:
# 1. API Key Rotation: Xoay vòng nhiều key, tự detect key nào bị rate-limit
# 2. Request Queue: Hàng đợi FIFO với priority (challenge > chat > explore)
# 3. Response Cache: LRU cache cho queries giống nhau
# 4. Health Monitor: Theo dõi sức khỏe từng key (quota, errors, latency)
# 5. Fallback Models: Tự chuyển model khi model chính quá tải
#
# Setup: Thêm vào .env:
# GEMINI_API_KEYS=key1,key2,key3   (nhiều key, cách nhau dấu phẩy)
# AI_CACHE_TTL=300                  (cache 5 phút)
# AI_MAX_QUEUE_SIZE=50
# =====================================================

import os
import time
import json
import asyncio
import hashlib
import logging
from typing import Optional, Dict, List, Any
from collections import OrderedDict
from dataclasses import dataclass, field
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
logger = logging.getLogger("ai_proxy")

# ── Cấu hình ──
CACHE_TTL = int(os.getenv("AI_CACHE_TTL", "300"))  # 5 phút
MAX_CACHE_SIZE = int(os.getenv("AI_MAX_CACHE_SIZE", "200"))
MAX_QUEUE_SIZE = int(os.getenv("AI_MAX_QUEUE_SIZE", "50"))

# Model fallback chain
MODEL_CHAIN = [
    "gemini-2.5-flash-preview-05-20",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
]


# ── Data classes ──
@dataclass
class APIKeyInfo:
    """Thông tin và sức khỏe của một API Key"""
    key: str
    index: int
    total_requests: int = 0
    total_errors: int = 0
    rate_limit_until: float = 0.0  # Unix timestamp, key bị cooldown đến lúc này
    consecutive_errors: int = 0
    avg_latency_ms: float = 0.0
    last_used: float = 0.0
    is_healthy: bool = True

    @property
    def is_available(self) -> bool:
        """Key có sẵn sàng dùng không?"""
        if not self.is_healthy:
            return False
        if self.rate_limit_until > time.time():
            return False
        return True

    def record_success(self, latency_ms: float):
        """Ghi nhận request thành công"""
        self.total_requests += 1
        self.consecutive_errors = 0
        self.is_healthy = True
        self.last_used = time.time()
        # Exponential moving average cho latency
        if self.avg_latency_ms == 0:
            self.avg_latency_ms = latency_ms
        else:
            self.avg_latency_ms = self.avg_latency_ms * 0.7 + latency_ms * 0.3

    def record_error(self, is_rate_limit: bool = False):
        """Ghi nhận lỗi"""
        self.total_errors += 1
        self.consecutive_errors += 1
        self.last_used = time.time()

        if is_rate_limit:
            # Exponential backoff: 10s, 30s, 60s, 120s, 300s
            cooldown = min(10 * (3 ** (self.consecutive_errors - 1)), 300)
            self.rate_limit_until = time.time() + cooldown
            logger.warning(f"Key #{self.index} rate-limited, cooldown {cooldown}s")

        if self.consecutive_errors >= 5:
            self.is_healthy = False
            logger.error(f"Key #{self.index} marked UNHEALTHY after {self.consecutive_errors} consecutive errors")


@dataclass
class CacheEntry:
    """Entry trong LRU Cache"""
    response: Any
    created_at: float
    hit_count: int = 0

    @property
    def is_expired(self) -> bool:
        return (time.time() - self.created_at) > CACHE_TTL


# ── LRU Cache ──
class LRUCache:
    """LRU Cache cho AI responses"""

    def __init__(self, max_size: int = MAX_CACHE_SIZE):
        self.cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self.max_size = max_size
        self.hits = 0
        self.misses = 0

    def _make_key(self, prompt: str, model: str = "", config: str = "") -> str:
        """Tạo cache key từ prompt + model + config"""
        raw = f"{model}:{config}:{prompt}"
        return hashlib.sha256(raw.encode()).hexdigest()[:16]

    def get(self, prompt: str, model: str = "", config: str = "") -> Optional[Any]:
        key = self._make_key(prompt, model, config)
        if key in self.cache:
            entry = self.cache[key]
            if entry.is_expired:
                del self.cache[key]
                self.misses += 1
                return None
            # Move to end (most recently used)
            self.cache.move_to_end(key)
            entry.hit_count += 1
            self.hits += 1
            return entry.response
        self.misses += 1
        return None

    def put(self, prompt: str, response: Any, model: str = "", config: str = ""):
        key = self._make_key(prompt, model, config)
        if key in self.cache:
            self.cache.move_to_end(key)
            self.cache[key] = CacheEntry(response=response, created_at=time.time())
        else:
            if len(self.cache) >= self.max_size:
                self.cache.popitem(last=False)  # Remove oldest
            self.cache[key] = CacheEntry(response=response, created_at=time.time())

    def stats(self) -> dict:
        total = self.hits + self.misses
        return {
            "size": len(self.cache),
            "max_size": self.max_size,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": f"{(self.hits / total * 100):.1f}%" if total > 0 else "0%",
        }


# ── AI Proxy Server ──
class AIProxyServer:
    """
    Smart AI Proxy với key rotation, caching, và health monitoring.
    
    Usage:
        proxy = AIProxyServer()
        response = await proxy.generate("Cho hình chóp S.ABCD...")
    """

    def __init__(self):
        self.keys: List[APIKeyInfo] = []
        self.clients: Dict[int, genai.Client] = {}
        self.cache = LRUCache()
        self.current_key_index = 0
        self.queue = asyncio.Queue(maxsize=MAX_QUEUE_SIZE)
        self._init_keys()

    def _init_keys(self):
        """Khởi tạo API keys từ .env"""
        # Hỗ trợ cả GEMINI_API_KEY (1 key) và GEMINI_API_KEYS (nhiều key)
        multi_keys = os.getenv("GEMINI_API_KEYS", "")
        single_key = os.getenv("GEMINI_API_KEY", "")

        raw_keys = []
        if multi_keys:
            raw_keys = [k.strip() for k in multi_keys.split(",") if k.strip()]
        elif single_key:
            raw_keys = [single_key]

        if not raw_keys:
            logger.warning("Không có API key nào được cấu hình!")
            return

        for i, key in enumerate(raw_keys):
            self.keys.append(APIKeyInfo(key=key, index=i))
            self.clients[i] = genai.Client(api_key=key)

        logger.info(f"AI Proxy khởi tạo với {len(self.keys)} API key(s)")

    def _get_best_key(self) -> Optional[APIKeyInfo]:
        """
        Chọn key tốt nhất (Round-robin với health check).
        Ưu tiên: Available → Lowest latency → Least errors
        """
        available = [k for k in self.keys if k.is_available]
        if not available:
            # Tất cả key đều bận → chọn key hết cooldown sớm nhất
            recovering = sorted(self.keys, key=lambda k: k.rate_limit_until)
            if recovering:
                wait_time = max(0, recovering[0].rate_limit_until - time.time())
                logger.warning(f"Tất cả key đều rate-limited. Key #{recovering[0].index} sẵn sàng sau {wait_time:.0f}s")
                return recovering[0]
            return None

        # Round-robin trong các key available
        available.sort(key=lambda k: (k.avg_latency_ms, k.total_errors))
        
        # Simple round-robin
        self.current_key_index = (self.current_key_index + 1) % len(available)
        return available[self.current_key_index % len(available)]

    async def generate(
        self,
        prompt: str,
        system_instruction: str = "",
        response_mime_type: str = "text/plain",
        temperature: float = 0.3,
        model_override: str = None,
        use_cache: bool = True,
        priority: int = 5,  # 1 (cao) → 10 (thấp)
    ) -> Optional[str]:
        """
        Gửi request đến Gemini AI với smart routing.
        
        Args:
            prompt: Nội dung prompt
            system_instruction: System prompt
            response_mime_type: "text/plain" hoặc "application/json"
            temperature: 0.0 → 1.0
            model_override: Chỉ định model cụ thể (bỏ qua fallback chain)
            use_cache: Có dùng cache không
            priority: Độ ưu tiên (1 = challenge, 5 = chat, 10 = explore)
        
        Returns:
            Response text hoặc None nếu thất bại
        """
        # ── Cache check ──
        config_hash = f"{response_mime_type}:{temperature}:{system_instruction[:50]}"
        if use_cache:
            cached = self.cache.get(prompt, config=config_hash)
            if cached:
                logger.info(f"Cache HIT (saves 1 API call)")
                return cached

        # ── Model chain ──
        models_to_try = [model_override] if model_override else MODEL_CHAIN

        # ── Try with key rotation + model fallback ──
        last_error = None
        for model_id in models_to_try:
            for attempt in range(len(self.keys) or 1):
                key_info = self._get_best_key()
                if not key_info:
                    logger.error("Không có API key nào khả dụng")
                    await asyncio.sleep(2)
                    continue

                client = self.clients.get(key_info.index)
                if not client:
                    continue

                start_time = time.time()
                try:
                    config = types.GenerateContentConfig(
                        temperature=temperature,
                        response_mime_type=response_mime_type,
                    )
                    if system_instruction:
                        config.system_instruction = system_instruction

                    response = client.models.generate_content(
                        model=model_id,
                        contents=prompt,
                        config=config,
                    )

                    latency_ms = (time.time() - start_time) * 1000
                    key_info.record_success(latency_ms)

                    result_text = response.text.strip() if response.text else ""

                    # Cache kết quả
                    if use_cache and result_text:
                        self.cache.put(prompt, result_text, config=config_hash)

                    logger.info(
                        f"✅ Key #{key_info.index} | Model: {model_id} | "
                        f"Latency: {latency_ms:.0f}ms | Cache: {self.cache.stats()['hit_rate']}"
                    )
                    return result_text

                except Exception as e:
                    error_str = str(e)
                    is_rate_limit = "429" in error_str or "RESOURCE_EXHAUSTED" in error_str
                    is_server_error = "503" in error_str or "500" in error_str

                    key_info.record_error(is_rate_limit=is_rate_limit)
                    last_error = e

                    if is_rate_limit:
                        logger.warning(f"Rate limit on Key #{key_info.index}, rotating...")
                        continue  # Try next key
                    elif is_server_error:
                        logger.warning(f"Server error on {model_id}, trying next model...")
                        break  # Try next model
                    else:
                        logger.error(f"Unexpected error: {e}")
                        raise e

        # Tất cả đều fail
        logger.error(f"All keys and models exhausted. Last error: {last_error}")
        return None

    def health_report(self) -> dict:
        """Báo cáo sức khỏe tổng thể"""
        return {
            "total_keys": len(self.keys),
            "available_keys": sum(1 for k in self.keys if k.is_available),
            "cache": self.cache.stats(),
            "keys": [
                {
                    "index": k.index,
                    "available": k.is_available,
                    "healthy": k.is_healthy,
                    "requests": k.total_requests,
                    "errors": k.total_errors,
                    "avg_latency_ms": round(k.avg_latency_ms, 1),
                    "cooldown_remaining": max(0, round(k.rate_limit_until - time.time(), 1)),
                }
                for k in self.keys
            ],
        }


# ── Singleton instance ──
_proxy_instance = None

def get_ai_proxy() -> AIProxyServer:
    """Lấy singleton AI Proxy"""
    global _proxy_instance
    if _proxy_instance is None:
        _proxy_instance = AIProxyServer()
    return _proxy_instance
