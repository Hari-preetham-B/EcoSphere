import requests
from functools import wraps
from flask import request, jsonify, g, current_app
from database import db
from models import UserProfile

def get_supabase_user(token):
    """
    Verifies token directly against Supabase Auth API (GET /auth/v1/user).
    Returns real user payload dictionary from Supabase Auth or None if invalid.
    No unverified fallback allowed.
    """
    supabase_url = current_app.config.get('SUPABASE_URL')
    anon_key = current_app.config.get('SUPABASE_PUBLISHABLE_KEY')
    
    if not supabase_url or not anon_key:
        print("Error: SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY not configured in backend")
        return None

    try:
        url = f"{supabase_url.rstrip('/')}/auth/v1/user"
        headers = {
            'Authorization': f"Bearer {token}",
            'apikey': anon_key
        }
        res = requests.get(url, headers=headers, timeout=5)
        if res.status_code == 200:
            return res.json()
        else:
            print(f"Supabase auth validation failed with HTTP {res.status_code}: {res.text}")
    except Exception as e:
        print(f"Supabase auth connection error: {e}")

    return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization header missing or invalid format'}), 401
        
        token = auth_header.split(' ')[1]
        user_data = get_supabase_user(token)

        if not user_data:
            return jsonify({'error': 'Invalid or expired Supabase Auth token'}), 401

        user_id = user_data.get('id')
        user_email = user_data.get('email', '')
        user_meta = user_data.get('user_metadata', {})
        full_name = user_meta.get('full_name') or user_meta.get('name') or user_email.split('@')[0]

        # Sync/fetch user profile in our database using real Supabase Auth UUID
        user_profile = UserProfile.query.get(user_id)
        if not user_profile:
            # Check if this is the very first user in the database
            total_users = UserProfile.query.count()
            assigned_role = 'Admin' if total_users == 0 else 'Employee'
            
            user_profile = UserProfile(
                id=user_id,
                email=user_email,
                full_name=full_name,
                role=assigned_role
            )
            db.session.add(user_profile)
            db.session.commit()

        g.current_user = user_profile
        return f(*args, **kwargs)

    return decorated

def require_role(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(g, 'current_user') or not g.current_user:
                return jsonify({'error': 'Authentication required'}), 401
            
            if g.current_user.role not in roles:
                return jsonify({
                    'error': 'Forbidden: Insufficient privileges',
                    'required_roles': list(roles),
                    'your_role': g.current_user.role
                }), 403
                
            return f(*args, **kwargs)
        return decorated
    return decorator
