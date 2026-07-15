# SpatialMind_Backend/email_service.py
# Duolingo-style daily reminder emails via Gmail SMTP
# Setup: thêm vào .env: GMAIL_USER, GMAIL_APP_PASSWORD

import os
import smtplib
import json
import random
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import date
from typing import Optional
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

GMAIL_USER     = os.getenv("GMAIL_USER", "")
GMAIL_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")  # App Password (not normal password)
APP_URL        = os.getenv("APP_URL", "http://localhost:5173")

# =====================
# Motivational messages (random pick)
# =====================
STREAK_MESSAGES = [
    ("🔥 Đừng để streak bị gián đoạn!", "Bạn đang có chuỗi {streak} ngày liên tiếp. Hôm nay hãy duy trì nó!"),
    ("⚡ Streak của bạn đang chờ!", "Chuỗi {streak} ngày sắp bị phá vỡ nếu bạn không luyện tập hôm nay."),
    ("🎯 Một ngày mới, một thử thách mới!", "Streak {streak} ngày — tiếp tục chinh phục hình học không gian!"),
    ("🚀 Đỉnh cao đang chờ bạn!", "Với streak {streak} ngày, bạn đang tiến dần đến rank cao hơn!"),
]

NO_STREAK_MESSAGES = [
    ("🌟 Bắt đầu hành trình hôm nay!", "Mỗi chuyên gia từng là người mới bắt đầu. Hãy giải bài đầu tiên!"),
    ("🔺 SpatialMind đang chờ bạn!", "Thử thách hình học không gian hôm nay đã sẵn sàng. Bạn có dám không?"),
    ("💡 Tư duy không gian = lợi thế thi cử!", "5 phút mỗi ngày với SpatialMind giúp bạn nhìn thấu mọi bài hình học!"),
]

RANK_NAMES_VI = {
    "Beginner": "Tập sự",
    "Bronze": "Đồng",
    "Silver": "Bạc",
    "Gold": "Vàng",
    "Platinum": "Bạch kim",
    "Diamond": "Kim cương",
    "Master": "Cao thủ",
}

def get_today_challenge_preview():
    """Lấy preview bài hôm nay"""
    try:
        bank_path = os.path.join(os.path.dirname(__file__), 'geometry_challenge_bank.json')
        with open(bank_path, 'r', encoding='utf-8') as f:
            challenges = json.load(f)
        easy = [c for c in challenges if c['difficulty'] == 'easy']
        if easy:
            return random.choice(easy)
    except Exception:
        pass
    return {
        "title": "Hình chóp S.ABCD",
        "problem": "Dựng hình chóp đều S.ABCD với cạnh đáy 2 và chiều cao 3. Ít hơn 6 thao tác.",
        "xp": 60,
        "difficulty": "easy"
    }

def build_html_email(user_name: str, streak: int, xp: int, rank_name: str, challenge: dict) -> str:
    """Build HTML email đẹp kiểu Duolingo"""
    rank_vi = RANK_NAMES_VI.get(rank_name, rank_name)

    if streak > 0:
        msg_pool = STREAK_MESSAGES
        subj_body = random.choice(msg_pool)
        headline  = subj_body[0]
        subtext   = subj_body[1].format(streak=streak)
    else:
        msg_pool = NO_STREAK_MESSAGES
        subj_body = random.choice(msg_pool)
        headline  = subj_body[0]
        subtext   = subj_body[1]

    streak_html = f"""
    <div style="background:linear-gradient(135deg,#1e1b4b,#0f172a);border:1px solid rgba(99,102,241,0.3);
                border-radius:16px;padding:20px;margin:16px 0;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">{"🔥" if streak > 0 else "💤"}</div>
      <div style="color:#a5b4fc;font-size:28px;font-weight:900;">{streak} ngày</div>
      <div style="color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">
        Streak hiện tại
      </div>
    </div>
    """ if streak > 0 else ""

    difficulty_color = {"easy": "#34d399", "medium": "#fbbf24", "hard": "#f87171"}.get(
        challenge.get("difficulty", "easy"), "#34d399"
    )

    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px;">

    <!-- Logo -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:40px;margin-bottom:8px;">🔺</div>
      <div style="color:#6366f1;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:3px;">
        SpatialMind
      </div>
    </div>

    <!-- Main card -->
    <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid rgba(255,255,255,0.08);
                border-radius:24px;padding:32px;margin-bottom:16px;">
      <!-- Greeting -->
      <div style="color:#94a3b8;font-size:14px;margin-bottom:4px;">Xin chào, {user_name}!</div>
      <h1 style="color:#ffffff;font-size:22px;font-weight:900;margin:0 0 8px;">{headline}</h1>
      <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 20px;">{subtext}</p>

      <!-- Streak -->
      {streak_html}

      <!-- Stats row -->
      <div style="display:flex;gap:12px;margin-bottom:20px;">
        <div style="flex:1;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);
                    border-radius:12px;padding:14px;text-align:center;">
          <div style="color:#fbbf24;font-size:20px;font-weight:900;">{xp}</div>
          <div style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">XP</div>
        </div>
        <div style="flex:1;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);
                    border-radius:12px;padding:14px;text-align:center;">
          <div style="color:#a78bfa;font-size:20px;font-weight:900;">{rank_vi}</div>
          <div style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Rank</div>
        </div>
      </div>

      <!-- Today challenge preview -->
      <div style="background:rgba(99,102,241,0.05);border:1px solid rgba(99,102,241,0.2);
                  border-radius:16px;padding:16px;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <span style="font-size:16px;">📐</span>
          <span style="color:#a5b4fc;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;">
            Thử thách hôm nay
          </span>
          <span style="margin-left:auto;color:{difficulty_color};font-size:10px;font-weight:700;
                       background:rgba(255,255,255,0.05);padding:2px 8px;border-radius:999px;">
            +{challenge.get("xp", 60)} XP
          </span>
        </div>
        <div style="color:#ffffff;font-size:14px;font-weight:700;margin-bottom:6px;">
          {challenge.get("title", "Thử thách hình học")}
        </div>
        <div style="color:#94a3b8;font-size:13px;line-height:1.5;">
          {challenge.get("problem", "")[:120]}{'...' if len(challenge.get("problem","")) > 120 else ''}
        </div>
      </div>

      <!-- CTA Button -->
      <a href="{APP_URL}" style="display:block;background:linear-gradient(135deg,#6366f1,#8b5cf6);
                border-radius:14px;padding:16px;text-align:center;text-decoration:none;
                color:#ffffff;font-size:15px;font-weight:900;
                box-shadow:0 0 30px rgba(99,102,241,0.4);">
        🚀 Bắt đầu thử thách ngay
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;color:#334155;font-size:11px;line-height:1.8;">
      SpatialMind — Tư duy không gian cho học sinh Việt Nam<br>
      <a href="{APP_URL}/unsubscribe" style="color:#475569;text-decoration:none;">Hủy đăng ký nhận email</a>
    </div>
  </div>
</body>
</html>"""

def send_daily_reminder(
    to_email: str,
    user_name: str = "bạn",
    streak: int = 0,
    xp: int = 0,
    rank_name: str = "Beginner"
) -> bool:
    """Gửi email reminder. Trả về True nếu thành công."""
    if not GMAIL_USER or not GMAIL_PASSWORD:
        print("GMAIL_USER hoặc GMAIL_APP_PASSWORD chưa được cấu hình trong .env")
        return False

    challenge = get_today_challenge_preview()

    if streak > 0:
        subjects = [
            f"🔥 Streak {streak} ngày đang chờ bạn, {user_name}!",
            f"⚡ Đừng để {streak} ngày bị phá vỡ!",
            f"🎯 Daily Challenge hôm nay — Streak {streak} ngày!",
        ]
    else:
        subjects = [
            f"🔺 Thử thách hình học hôm nay đã sẵn sàng, {user_name}!",
            f"💡 5 phút hình học không gian — bắt đầu hành trình!",
            f"🌟 SpatialMind đang chờ bạn, {user_name}!",
        ]
    subject = random.choice(subjects)

    html_body = build_html_email(user_name, streak, xp, rank_name, challenge)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"SpatialMind <{GMAIL_USER}>"
    msg["To"]      = to_email

    # Plain text fallback
    plain = f"""Xin chao {user_name}!

Streak hom nay: {streak} ngay
XP: {xp} | Rank: {rank_name}

Thu thach hom nay: {challenge.get("title", "")}
{challenge.get("problem", "")[:200]}

Mo SpatialMind: {APP_URL}
"""
    msg.attach(MIMEText(plain, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(GMAIL_USER, GMAIL_PASSWORD)
            smtp.sendmail(GMAIL_USER, to_email, msg.as_string())
        print(f"Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        return False


def send_bulk_reminders(users: list) -> dict:
    """
    Gửi email cho nhiều users.
    users: list of dicts with keys: email, name, streak, xp, rank_name
    """
    results = {"sent": 0, "failed": 0}
    for user in users:
        success = send_daily_reminder(
            to_email  = user.get("email", ""),
            user_name = user.get("name", "bạn"),
            streak    = user.get("streak", 0),
            xp        = user.get("xp", 0),
            rank_name = user.get("rank_name", "Beginner"),
        )
        if success:
            results["sent"] += 1
        else:
            results["failed"] += 1
    return results
