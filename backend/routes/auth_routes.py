from flask import Blueprint, jsonify, request, g
from database import db
from models import UserProfile
from auth import token_required

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    return jsonify({
        'user': g.current_user.to_dict()
    }), 200

@auth_bp.route('/sync', methods=['POST'])
@token_required
def sync_profile():
    data = request.get_json() or {}
    if 'full_name' in data:
        g.current_user.full_name = data['full_name']
        db.session.commit()
    return jsonify({
        'user': g.current_user.to_dict()
    }), 200
