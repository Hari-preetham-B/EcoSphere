from flask import Blueprint, jsonify, request, g
from database import db
from models import UserProfile
from auth import token_required, require_role

user_bp = Blueprint('users', __name__)

@user_bp.route('', methods=['GET'])
@token_required
@require_role('Admin')
def get_all_users():
    users = UserProfile.query.order_by(UserProfile.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users]), 200

@user_bp.route('/<user_id>/role', methods=['PUT'])
@token_required
@require_role('Admin')
def update_user_role(user_id):
    data = request.get_json() or {}
    new_role = data.get('role')
    
    allowed_roles = ['Admin', 'ESG Manager', 'Employee']
    if not new_role or new_role not in allowed_roles:
        return jsonify({'error': f'Invalid role. Allowed roles: {allowed_roles}'}), 400

    target_user = UserProfile.query.get(user_id)
    if not target_user:
        return jsonify({'error': 'User not found'}), 404

    # Prevent admin from demoting themselves if they are the only admin
    if target_user.id == g.current_user.id and new_role != 'Admin':
        admin_count = UserProfile.query.filter_by(role='Admin').count()
        if admin_count <= 1:
            return jsonify({'error': 'Cannot demote the sole Admin account'}), 400

    target_user.role = new_role
    db.session.commit()

    return jsonify({
        'message': 'Role updated successfully',
        'user': target_user.to_dict()
    }), 200
