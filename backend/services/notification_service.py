import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from database import db
from models import Notification, NotificationPref, UserProfile


def get_notification_pref(event_type):
    """
    Returns (in_app_enabled, email_enabled) tuple for a given event_type.
    Default if no row exists: in_app_enabled=True, email_enabled=False.
    """
    pref = NotificationPref.query.filter_by(event_type=event_type).first()
    if not pref:
        return True, False
    return bool(pref.in_app_enabled), bool(pref.email_enabled)


def send_email_via_brevo(to_email, subject, body_html):
    """
    Sends an email using Brevo (formerly Sendinblue) SMTP.
    Gracefully logs warnings if credentials are missing or connection fails.
    """
    smtp_server = os.environ.get('BREVO_SMTP_SERVER', 'smtp-relay.brevo.com')
    smtp_port = int(os.environ.get('BREVO_SMTP_PORT', 587))
    smtp_user = os.environ.get('BREVO_SMTP_USER', '')
    smtp_key = os.environ.get('BREVO_SMTP_KEY', '')
    sender_email = os.environ.get('SENDER_EMAIL', 'noreply@ecosphere.com')

    if not smtp_key or not smtp_user or smtp_key == 'your_brevo_smtp_key_here':
        print(f"[Notification Engine Warning] Brevo SMTP key not configured in .env. Email to {to_email} skipped.")
        return False

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"EcoSphere Platform <{sender_email}>"
        msg['To'] = to_email

        html_part = MIMEText(body_html, 'html')
        msg.attach(html_part)

        with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_key)
            server.sendmail(sender_email, [to_email], msg.as_string())
        
        print(f"[Notification Engine] Email successfully sent to {to_email} via Brevo SMTP.")
        return True
    except Exception as e:
        print(f"[Notification Engine Error] Failed to send Brevo email to {to_email}: {e}")
        return False


def send_notification(user_id, title, message, event_type='general', link=None):
    """
    Core notification dispatcher:
    1. Evaluates NotificationPref (defaults to in_app=True, email=False if row missing).
    2. Creates in-app Notification DB record if in_app_enabled.
    3. Attempts Brevo SMTP email if email_enabled and user email exists.
    """
    in_app_enabled, email_enabled = get_notification_pref(event_type)

    user = UserProfile.query.get(user_id)
    if not user:
        print(f"[Notification Engine Warning] User {user_id} not found.")
        return None

    notification = None
    if in_app_enabled:
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=event_type,
            link=link
        )
        db.session.add(notification)

    if email_enabled and user.email:
        email_html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #059669;">EcoSphere Notification</h2>
            <h3>{title}</h3>
            <p>{message}</p>
            {f'<p><a href="{link}" style="color: #2563eb;">View in EcoSphere</a></p>' if link else ''}
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 20px;"/>
            <p style="font-size: 11px; color: #94a3b8;">You received this automated notification from EcoSphere ESG Platform.</p>
        </div>
        """
        send_email_via_brevo(user.email, f"[EcoSphere] {title}", email_html)

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"[Notification Engine Error] DB commit failed: {e}")

    return notification
