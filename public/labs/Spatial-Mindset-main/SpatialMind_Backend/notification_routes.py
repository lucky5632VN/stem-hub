# SpatialMind_Backend/notification_routes.py
# FastAPI routes cho notification system
# Add vào main.py: from notification_routes import notification_router; app.include_router(notification_router)

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import json
import os
from email_service import send_daily_reminder, send_bulk_reminders

notification_router = APIRouter(prefix="/api/notifications", tags=["notifications"])

class NotificationSubscribeRequest(BaseModel):
    email: str
    name: str = "bạn"
    notify_hour: int = 7  # 7h sáng mặc định

class SendReminderRequest(BaseModel):
    email: str
    name: str = "bạn"
    streak: int = 0
    xp: int = 0
    rank_name: str = "Beginner"

class BulkReminderRequest(BaseModel):
    secret: str  # Simple auth cho cron job
    users: List[dict]

# Simple file-based storage (nên đổi sang Firestore trong production)
SUBSCRIBERS_FILE = os.path.join(os.path.dirname(__file__), 'subscribers.json')
CRON_SECRET = os.getenv("CRON_SECRET", "change_this_secret_in_production")

def load_subscribers():
    try:
        with open(SUBSCRIBERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def save_subscribers(subs):
    with open(SUBSCRIBERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(subs, f, ensure_ascii=False, indent=2)

@notification_router.post("/subscribe")
async def subscribe_notifications(req: NotificationSubscribeRequest):
    """Đăng ký nhận email reminder hàng ngày"""
    subs = load_subscribers()
    
    # Kiểm tra đã đăng ký chưa
    existing = next((s for s in subs if s['email'] == req.email), None)
    if existing:
        return {"status": "already_subscribed", "message": "Email này đã được đăng ký rồi!"}
    
    subs.append({
        "email": req.email,
        "name": req.name,
        "notify_hour": req.notify_hour,
        "active": True,
        "subscribed_at": str(__import__('datetime').date.today()),
    })
    save_subscribers(subs)
    return {"status": "success", "message": f"Đã đăng ký nhận thông báo lúc {req.notify_hour}h sáng!"}

@notification_router.delete("/unsubscribe/{email}")
async def unsubscribe(email: str):
    """Hủy đăng ký"""
    subs = load_subscribers()
    subs = [s for s in subs if s['email'] != email]
    save_subscribers(subs)
    return {"status": "success", "message": "Đã hủy đăng ký."}

@notification_router.post("/send-test")
async def send_test_email(req: SendReminderRequest, background_tasks: BackgroundTasks):
    """Test gửi 1 email (dùng khi dev)"""
    background_tasks.add_task(
        send_daily_reminder,
        to_email=req.email,
        user_name=req.name,
        streak=req.streak,
        xp=req.xp,
        rank_name=req.rank_name,
    )
    return {"status": "queued", "message": f"Email đang được gửi đến {req.email}"}

@notification_router.post("/send-daily-bulk")
async def send_daily_bulk(req: BulkReminderRequest, background_tasks: BackgroundTasks):
    """
    Endpoint cho cron job gọi mỗi sáng.
    Gọi bằng: POST /api/notifications/send-daily-bulk
    Body: {"secret": "...", "users": [...]}
    """
    if req.secret != CRON_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret")
    
    background_tasks.add_task(send_bulk_reminders, req.users)
    return {"status": "queued", "user_count": len(req.users)}
