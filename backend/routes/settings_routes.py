from flask import Blueprint, jsonify, request
from database import db
from models import Setting
from auth import token_required, require_role
from datetime import datetime

settings_bp = Blueprint('settings', __name__)

_DEFAULT_SETTINGS = {
    'auto_emission_calc': 'true',
    'require_proof_for_csr': 'true',
    'badge_auto_award': 'true',
    'weight_env': '0.40',
    'weight_soc': '0.30',
    'weight_gov': '0.30',
}


def _ensure_defaults():
    for key, val in _DEFAULT_SETTINGS.items():
        if not Setting.query.filter_by(key=key).first():
            db.session.add(Setting(key=key, value=val, updated_at=datetime.utcnow()))
    db.session.commit()


@settings_bp.route('', methods=['GET'])
@token_required
def get_settings():
    _ensure_defaults()
    rows = Setting.query.all()
    return jsonify({r.key: r.value for r in rows}), 200


@settings_bp.route('', methods=['PUT'])
@token_required
@require_role('Admin')
def update_settings():
    data = request.get_json() or {}
    for key, value in data.items():
        setting = Setting.query.filter_by(key=key).first()
        if setting:
            setting.value = str(value)
            setting.updated_at = datetime.utcnow()
        else:
            db.session.add(Setting(key=key, value=str(value), updated_at=datetime.utcnow()))
    db.session.commit()
    rows = Setting.query.all()
    return jsonify({r.key: r.value for r in rows}), 200


# ─── Notification Settings API ───────────────────────────────────────────────

_DEFAULT_EVENT_TYPES = ['compliance_issue', 'csr_decision', 'policy_reminder', 'badge_unlock']

def _ensure_notification_pref_defaults():
    for et in _DEFAULT_EVENT_TYPES:
        if not NotificationPref.query.filter_by(event_type=et).first():
            db.session.add(NotificationPref(event_type=et, in_app_enabled=True, email_enabled=False))
    db.session.commit()


@settings_bp.route('/notifications', methods=['GET'])
@token_required
def get_notification_settings():
    from models import NotificationPref
    _ensure_notification_pref_defaults()
    prefs = NotificationPref.query.all()
    return jsonify([p.to_dict() for p in prefs]), 200


@settings_bp.route('/notifications', methods=['PUT'])
@token_required
@require_role('Admin')
def update_notification_settings():
    from models import NotificationPref
    data = request.get_json() or []  # List of {event_type, in_app_enabled, email_enabled}
    if isinstance(data, dict):
        data = [data]

    for item in data:
        et = item.get('event_type')
        if not et:
            continue
        pref = NotificationPref.query.filter_by(event_type=et).first()
        if not pref:
            pref = NotificationPref(event_type=et)
            db.session.add(pref)
        if 'in_app_enabled' in item:
            pref.in_app_enabled = bool(item['in_app_enabled'])
        if 'email_enabled' in item:
            pref.email_enabled = bool(item['email_enabled'])
        pref.updated_at = datetime.utcnow()

    db.session.commit()
    prefs = NotificationPref.query.all()
    return jsonify([p.to_dict() for p in prefs]), 200

