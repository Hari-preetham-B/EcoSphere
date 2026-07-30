from datetime import datetime, date as date_type
from flask import Blueprint, jsonify, request, g
from database import db
from models import CSRActivity, CSRParticipation, Category, Department, UserProfile, Setting
from auth import token_required, require_role

# Import badge auto-award helper (deferred to avoid circular imports)
def _check_badges(user_id):
    from routes.gamification_routes import check_and_award_badges
    check_and_award_badges(user_id)

csr_bp = Blueprint('csr', __name__)


def _require_proof_for_approval():
    s = Setting.query.filter_by(key='require_proof_for_csr').first()
    return s and s.value == 'true'


# ─── CSR Activities ─────────────────────────────────────────────────────────

@csr_bp.route('', methods=['GET'])
@token_required
def get_activities():
    query = CSRActivity.query
    dept_id = request.args.get('department_id')
    category_id = request.args.get('category_id')
    status = request.args.get('status')

    if dept_id:
        query = query.filter(CSRActivity.department_id == int(dept_id))
    if category_id:
        query = query.filter(CSRActivity.category_id == int(category_id))
    if status:
        query = query.filter(CSRActivity.status == status)

    activities = query.order_by(CSRActivity.date.asc()).all()
    return jsonify([a.to_dict() for a in activities]), 200


@csr_bp.route('/<int:act_id>', methods=['GET'])
@token_required
def get_activity(act_id):
    act = CSRActivity.query.get(act_id)
    if not act:
        return jsonify({'error': 'CSR Activity not found'}), 404
    return jsonify(act.to_dict()), 200


@csr_bp.route('', methods=['POST'])
@token_required
@require_role('Admin', 'ESG Manager')
def create_activity():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    act_date = data.get('date')
    if not title or not act_date:
        return jsonify({'error': 'title and date are required'}), 400

    dept_id = data.get('department_id')
    if dept_id:
        dept = Department.query.get(dept_id)
        if not dept:
            return jsonify({'error': 'Department not found'}), 404

    cat_id = data.get('category_id')
    if cat_id:
        cat = Category.query.get(cat_id)
        if not cat:
            return jsonify({'error': 'Category not found'}), 404

    points = data.get('points_reward', 50)
    try:
        points = int(points)
    except (TypeError, ValueError):
        points = 50

    act = CSRActivity(
        title=title,
        category_id=int(cat_id) if cat_id else None,
        description=data.get('description', '').strip(),
        department_id=int(dept_id) if dept_id else None,
        date=date_type.fromisoformat(act_date),
        points_reward=points,
        status=data.get('status', 'Active'),
        created_by=g.current_user.id
    )
    db.session.add(act)
    db.session.commit()
    return jsonify(act.to_dict()), 201


@csr_bp.route('/<int:act_id>', methods=['PUT'])
@token_required
@require_role('Admin', 'ESG Manager')
def update_activity(act_id):
    act = CSRActivity.query.get(act_id)
    if not act:
        return jsonify({'error': 'CSR Activity not found'}), 404

    data = request.get_json() or {}
    if 'title' in data and data['title']:
        act.title = data['title'].strip()
    if 'description' in data:
        act.description = data['description'].strip()
    if 'category_id' in data:
        act.category_id = int(data['category_id']) if data['category_id'] else None
    if 'department_id' in data:
        act.department_id = int(data['department_id']) if data['department_id'] else None
    if 'date' in data:
        act.date = date_type.fromisoformat(data['date'])
    if 'points_reward' in data:
        act.points_reward = int(data['points_reward'])
    if 'status' in data:
        act.status = data['status']

    db.session.commit()
    return jsonify(act.to_dict()), 200


@csr_bp.route('/<int:act_id>', methods=['DELETE'])
@token_required
@require_role('Admin', 'ESG Manager')
def delete_activity(act_id):
    act = CSRActivity.query.get(act_id)
    if not act:
        return jsonify({'error': 'CSR Activity not found'}), 404
    db.session.delete(act)
    db.session.commit()
    return jsonify({'message': 'CSR Activity deleted', 'id': act_id}), 200


# ─── Employee Participation ───────────────────────────────────────────────

@csr_bp.route('/<int:act_id>/register', methods=['POST'])
@token_required
def register_participation(act_id):
    act = CSRActivity.query.get(act_id)
    if not act:
        return jsonify({'error': 'CSR Activity not found'}), 404

    existing = CSRParticipation.query.filter_by(activity_id=act_id, user_id=g.current_user.id).first()
    if existing:
        return jsonify({'error': 'You are already registered for this CSR activity'}), 400

    data = request.get_json() or {}
    part = CSRParticipation(
        activity_id=act_id,
        user_id=g.current_user.id,
        status='Pending',
        proof_url=data.get('proof_url', '').strip(),
        notes=data.get('notes', '').strip()
    )
    db.session.add(part)
    db.session.commit()
    return jsonify(part.to_dict()), 201


@csr_bp.route('/participations/my', methods=['GET'])
@token_required
def get_my_participations():
    parts = CSRParticipation.query.filter_by(user_id=g.current_user.id).order_by(CSRParticipation.registered_at.desc()).all()
    return jsonify([p.to_dict() for p in parts]), 200


@csr_bp.route('/participations/<int:part_id>/proof', methods=['PUT'])
@token_required
def update_proof(part_id):
    part = CSRParticipation.query.get(part_id)
    if not part:
        return jsonify({'error': 'Participation record not found'}), 404

    if part.user_id != g.current_user.id and g.current_user.role not in ('Admin', 'ESG Manager'):
        return jsonify({'error': 'Forbidden'}), 403

    data = request.get_json() or {}
    proof_url = data.get('proof_url', '').strip()
    if not proof_url:
        return jsonify({'error': 'proof_url is required'}), 400

    part.proof_url = proof_url
    if 'notes' in data:
        part.notes = data['notes'].strip()
    db.session.commit()
    return jsonify(part.to_dict()), 200


@csr_bp.route('/participations', methods=['GET'])
@token_required
@require_role('Admin', 'ESG Manager')
def get_all_participations():
    status = request.args.get('status')
    query = CSRParticipation.query
    if status:
        query = query.filter(CSRParticipation.status == status)
    parts = query.order_by(CSRParticipation.registered_at.desc()).all()
    return jsonify([p.to_dict() for p in parts]), 200


@csr_bp.route('/participations/<int:part_id>/approve', methods=['PUT'])
@token_required
@require_role('Admin', 'ESG Manager')
def approve_participation(part_id):
    part = CSRParticipation.query.get(part_id)
    if not part:
        return jsonify({'error': 'Participation record not found'}), 404

    # Check Settings toggle: "Require proof for CSR approval"
    if _require_proof_for_approval() and not part.proof_url:
        return jsonify({
            'error': 'Cannot approve: System policy requires an uploaded proof file before approving CSR participation.'
        }), 400

    if part.status != 'Approved':
        part.status = 'Approved'
        part.reviewed_at = datetime.utcnow()

        # Award points to UserProfile (single shared spendable balance)
        reward = part.activity.points_reward if part.activity else 50
        part.points_awarded = reward

        user_prof = UserProfile.query.get(part.user_id)
        if user_prof:
            # Increment BOTH spendable balance and non-decreasing lifetime balance
            user_prof.points = (user_prof.points or 0) + reward
            user_prof.lifetime_points_earned = (user_prof.lifetime_points_earned or 0) + reward

        db.session.commit()

        # Auto-award badges based on updated lifetime_points_earned and CSR count
        _check_badges(part.user_id)

        try:
            from services.notification_service import send_notification
            act_name = part.activity.name if part.activity else 'CSR Activity'
            send_notification(
                user_id=part.user_id,
                title=f"CSR Participation Approved: {act_name}",
                message=f"Your participation in '{act_name}' has been approved and {reward} points have been awarded.",
                event_type="csr_decision",
                link="/social"
            )
        except Exception as e:
            print(f"[Notification Warning] CSR approve notification failed: {e}")

    return jsonify(part.to_dict()), 200


@csr_bp.route('/participations/<int:part_id>/reject', methods=['PUT'])
@token_required
@require_role('Admin', 'ESG Manager')
def reject_participation(part_id):
    part = CSRParticipation.query.get(part_id)
    if not part:
        return jsonify({'error': 'Participation record not found'}), 404

    data = request.get_json() or {}
    part.status = 'Rejected'
    part.reviewed_at = datetime.utcnow()
    if 'notes' in data:
        part.notes = data['notes'].strip()

    db.session.commit()

    try:
        from services.notification_service import send_notification
        act_name = part.activity.name if part.activity else 'CSR Activity'
        notes_txt = data.get('notes', '')
        send_notification(
            user_id=part.user_id,
            title=f"CSR Participation Rejected: {act_name}",
            message=f"Your participation in '{act_name}' was not approved.{' Note: ' + notes_txt if notes_txt else ''}",
            event_type="csr_decision",
            link="/social"
        )
    except Exception as e:
        print(f"[Notification Warning] CSR reject notification failed: {e}")

    return jsonify(part.to_dict()), 200
