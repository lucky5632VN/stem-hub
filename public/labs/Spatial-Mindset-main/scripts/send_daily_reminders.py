#!/usr/bin/env python3
# scripts/send_daily_reminders.py
# Chạy script này mỗi sáng bằng cron job hoặc Task Scheduler
#
# Linux/Mac cron (chạy lúc 7h sáng mỗi ngày):
# 0 7 * * * cd /path/to/SpatialMind_Backend && python3 ../scripts/send_daily_reminders.py
#
# Windows Task Scheduler: tạo task chạy file này mỗi sáng

import json
import os
import sys

# Thêm backend vào path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'SpatialMind_Backend'))

from email_service import send_bulk_reminders
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', 'SpatialMind_Backend', '.env'))

def load_users_from_firestore():
    """
    Trong production: load users từ Firestore
    Cần: pip install firebase-admin
    """
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
        
        if not firebase_admin._apps:
            cred = credentials.Certificate(os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccount.json"))
            firebase_admin.initialize_app(cred)
        
        db = firestore.client()
        users_ref = db.collection("users")
        docs = users_ref.where("notificationActive", "==", True).stream()
        
        users = []
        for doc in docs:
            data = doc.to_dict()
            if data.get("email"):
                users.append({
                    "email":     data["email"],
                    "name":      data.get("displayName", "bạn"),
                    "streak":    data.get("streak", 0),
                    "xp":        data.get("xp", 0),
                    "rank_name": data.get("rankName", "Beginner"),
                })
        return users
    except Exception as e:
        print(f"Firestore error: {e}, using local subscribers.json")
        return []

def load_users_local():
    """Fallback: load từ subscribers.json"""
    path = os.path.join(os.path.dirname(__file__), '..', 'SpatialMind_Backend', 'subscribers.json')
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

if __name__ == "__main__":
    print("=== SpatialMind Daily Reminder ===")
    
    # Load users (Firestore hoặc local)
    users = load_users_from_firestore() or load_users_local()
    
    if not users:
        print("Không có user nào đăng ký nhận thông báo.")
        sys.exit(0)
    
    print(f"Gửi email cho {len(users)} users...")
    results = send_bulk_reminders(users)
    print(f"Kết quả: {results['sent']} thành công, {results['failed']} thất bại")
