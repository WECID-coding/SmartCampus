"""
SmartCampus MITS (Findora) - Email Notification Service
Handles automated welcome emails upon user registration, ownership claim verifications,
and status updates via Gmail SMTP or API service.
"""

import os
import ssl
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, Optional
import urllib.request
import json

logger = logging.getLogger("smartcampus.email")

# Config from environment
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER") or os.environ.get("GMAIL_USER") or ""
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD") or os.environ.get("SMTP_PASS") or os.environ.get("GMAIL_APP_PASSWORD") or ""
SMTP_FROM_NAME = os.environ.get("SMTP_FROM_NAME", "Findora - SmartCampus MITS")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")

def generate_welcome_html(user_name: str, to_email: str, role: str = "student") -> str:
    role_label = "Faculty Member" if role.lower() == "faculty" else "Institute Student"
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Findora (SmartCampus MITS)</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }}
    .email-container {{
      max-width: 600px;
      margin: 20px auto;
      background: #111827;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }}
    .header {{
      background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
      padding: 32px 24px;
      text-align: center;
      border-bottom: 1px solid rgba(59, 130, 246, 0.3);
    }}
    .brand-mark {{
      display: inline-block;
      width: 44px;
      height: 44px;
      line-height: 44px;
      border-radius: 10px;
      background: #2563eb;
      color: #ffffff;
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 10px;
    }}
    .header h1 {{
      margin: 0;
      font-size: 24px;
      color: #ffffff;
      font-weight: 800;
      letter-spacing: -0.02em;
    }}
    .header p {{
      margin: 6px 0 0;
      color: #93c5fd;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}
    .content {{
      padding: 30px 24px;
    }}
    .greeting {{
      font-size: 18px;
      font-weight: 700;
      color: #f8fafc;
      margin-bottom: 14px;
    }}
    .lead {{
      font-size: 15px;
      line-height: 1.6;
      color: #cbd5e1;
      margin-bottom: 24px;
    }}
    .card {{
      background: #1f2937;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 18px;
      margin-bottom: 24px;
    }}
    .card-row {{
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 13.5px;
    }}
    .card-row:last-child {{
      border-bottom: none;
    }}
    .card-label {{
      color: #94a3b8;
    }}
    .card-val {{
      color: #f1f5f9;
      font-weight: 600;
    }}
    .btn-container {{
      text-align: center;
      margin: 28px 0;
    }}
    .btn {{
      display: inline-block;
      background: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      padding: 13px 28px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 15px;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
    }}
    .feature-list {{
      background: rgba(30, 41, 59, 0.6);
      border-radius: 8px;
      padding: 18px;
      margin-bottom: 24px;
    }}
    .feature-item {{
      margin-bottom: 12px;
      font-size: 13.5px;
      line-height: 1.5;
      color: #cbd5e1;
    }}
    .feature-item:last-child {{
      margin-bottom: 0;
    }}
    .footer {{
      background: #0f172a;
      padding: 24px;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }}
    .footer a {{
      color: #60a5fa;
      text-decoration: none;
    }}
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="brand-mark">✓</div>
      <h1>SmartCampus MITS</h1>
      <p>Findora Lost & Found Network</p>
    </div>

    <div class="content">
      <div class="greeting">Welcome, {user_name}! 👋</div>
      <p class="lead">
        Your institute account has been verified and registered on the <strong>SmartCampus Findora</strong> network at Madhav Institute of Technology & Science (MITS Gwalior).
      </p>

      <div class="card">
        <div class="card-row">
          <span class="card-label">Registered Name:</span>
          <span class="card-val">{user_name}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Email Address:</span>
          <span class="card-val">{to_email}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Account Role:</span>
          <span class="card-val">{role_label}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Campus Center:</span>
          <span class="card-val">MITS Gwalior (Central Hub)</span>
        </div>
        <div class="card-row">
          <span class="card-label">Account Status:</span>
          <span class="card-val" style="color: #10b981;">● Active & Ready</span>
        </div>
      </div>

      <div class="btn-container">
        <a href="https://smartcampusmits.vercel.app/" class="btn" target="_blank">
          Open SmartCampus Portal →
        </a>
      </div>

      <div class="feature-list">
        <strong style="color: #93c5fd; display: block; margin-bottom: 8px; font-size: 14px;">How to use Findora on Campus:</strong>
        <div class="feature-item">
          📍 <strong>Report Lost Belongings</strong> — Pinpoint the exact room, hall, or lab (e.g. CIoT Lab M007, Canteen, Central Library) to trigger instant AI alerts.
        </div>
        <div class="feature-item">
          🛡️ <strong>1-Step Ownership Verification</strong> — Found items are securely logged. Submit your private identifying mark (e.g. lock screen wallpaper, engraved mark) to authorize pickup at the Central Library Circulation Desk.
        </div>
        <div class="feature-item">
          🤖 <strong>AI Semantic Matchmaker</strong> — Automatically matches lost items with recently found submissions across campus departments.
        </div>
      </div>

      <p style="font-size: 13px; color: #94a3b8; text-align: center; margin: 0;">
        Need to hand over a found item? You can deposit it with the Security Desk at the Main Gate or the Central Library Reception.
      </p>
    </div>

    <div class="footer">
      <p>
        <strong>SmartCampus MITS Gwalior</strong><br>
        Madhav Institute of Technology & Science, Gola Ka Mandir, Gwalior, MP 474005<br>
        Web: <a href="https://smartcampusmits.vercel.app/" target="_blank">smartcampusmits.vercel.app</a>
      </p>
      <p style="margin-top: 10px; font-size: 11px;">
        This automated confirmation was dispatched because an account was registered with {to_email}. If you did not create this account, please notify security@mitsgwalior.in.
      </p>
    </div>
  </div>
</body>
</html>"""

def send_welcome_email(to_email: str, user_name: str, role: str = "student") -> Dict[str, Any]:
    """
    Sends a rich welcome confirmation email to the user's Gmail / institute address.
    Supports Resend HTTP API and standard Gmail / TLS SMTP.
    """
    if not to_email or "@" not in to_email:
        return {"sent": False, "reason": "Invalid email address"}

    html_content = generate_welcome_html(user_name, to_email, role)
    text_content = (
        f"Welcome to SmartCampus MITS, {user_name}!\n\n"
        f"Your account ({to_email}) has been successfully created on the MITS Findora network.\n"
        f"Visit the portal at https://smartcampusmits.vercel.app/ to report or claim lost articles.\n\n"
        f"Campus Pickup Hub: Central Library Circulation Desk\n"
        f"Madhav Institute of Technology & Science, Gwalior"
    )
    subject = f"🎉 Welcome to Findora (SmartCampus MITS) — Account Registered"

    # Option 1: Resend HTTP API (Works seamlessly on Vercel without SMTP ports)
    if RESEND_API_KEY:
        try:
            req_data = {
                "from": os.environ.get("RESEND_FROM", "Findora MITS <onboarding@resend.dev>"),
                "to": [to_email],
                "subject": subject,
                "html": html_content,
                "text": text_content
            }
            req = urllib.request.Request(
                "https://api.resend.com/emails",
                data=json.dumps(req_data).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status in (200, 201):
                    logger.info(f"Welcome email sent via Resend API to {to_email}")
                    return {"sent": True, "provider": "resend", "to": to_email}
        except Exception as e:
            logger.warning(f"Resend API send failed: {e}. Falling back to SMTP.")

    # Option 2: Gmail SMTP / Standard SMTP
    if SMTP_USER and SMTP_PASSWORD:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_USER}>"
            msg["To"] = to_email

            msg.attach(MIMEText(text_content, "plain", "utf-8"))
            msg.attach(MIMEText(html_content, "html", "utf-8"))

            context = ssl.create_default_context()
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=12) as server:
                server.ehlo()
                server.starttls(context=context)
                server.ehlo()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(SMTP_USER, [to_email], msg.as_string())

            logger.info(f"Welcome email successfully sent via Gmail SMTP to {to_email}")
            return {"sent": True, "provider": "smtp", "to": to_email}
        except Exception as e:
            logger.error(f"SMTP dispatch error to {to_email}: {e}")
            return {
                "sent": False,
                "provider": "smtp",
                "error": str(e),
                "message": f"SMTP dispatch failed: {str(e)}"
            }

    # Fallback / Simulated mode when SMTP is not yet configured in environment variables
    logger.info(
        f"[DEMO / SIMULATED] Welcome email prepared for {to_email}. "
        f"To send live emails to Gmail, add SMTP_USER and SMTP_PASSWORD in Vercel environment variables."
    )
    return {
        "sent": False,
        "simulated": True,
        "to": to_email,
        "message": "Welcome email logged. Configure SMTP_USER and SMTP_PASSWORD to deliver live to Gmail."
    }
