from flask import Blueprint, jsonify, request, g
from database import db
from models import Notification, NotificationPref
from auth import token_required, require_role

notification_bp = Blueprint('notifications', __name__)


@notification_bp.route('', methods=['GET'])
@token_required
def get_notifications():
    """Fetch all notifications for the current authenticated user + unread count."""
    notifications = Notification.query.filter_by(user_id=g.current_user.id).order_by(Notification.created_at.desc()).all()
    unread_count = Notification.query.filter_by(user_id=g.current_user.id, is_read=False).count()
    return jsonify({
        'unread_count': unread_count,
        'notifications': [n.to_dict() for n in notifications]
    }), 200


@notification_bp.route('/<int:notif_id>/read', methods=['PUT'])
@token_required
def mark_notification_read(notif_id):
    """Mark a single notification as read."""
    notif = Notification.query.get(notif_id)
    if not notif:
        return jsonify({'error': 'Notification not found'}), 404
    if notif.user_id != g.current_user.id:
        return jsonify({'error': 'Forbidden'}), 403

    notif.is_read = True
    db.session.commit()
    return jsonify(notif.to_dict()), 200


@notification_bp.route('/read-all', methods=['PUT'])
@token_required
def mark_all_notifications_read():
    """Mark all notifications as read for current user."""
    notifications = Notification.query.filter_by(user_id=g.current_user.id, is_read=False).all()
    for n in notifications:
        n.is_read = True
    db.session.commit()
    return jsonify({'message': 'All notifications marked as read', 'updated_count': len(notifications)}), 200
