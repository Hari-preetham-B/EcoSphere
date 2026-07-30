from datetime import date as date_type
from flask import Blueprint, jsonify, request, g
from database import db
from models import TrainingCompletion, UserProfile
from auth import token_required, require_role

training_bp = Blueprint('training', __name__)


@training_bp.route('', methods=['GET'])
@token_required
def get_trainings():
    # Employees can view their own; Admin/ESG Manager view all or filter by user_id
    query = TrainingCompletion.query

    if g.current_user.role == 'Employee':
        query = query.filter(TrainingCompletion.user_id == g.current_user.id)
    else:
        user_id = request.args.get('user_id')
        if user_id:
            query = query.filter(TrainingCompletion.user_id == user_id)

    status = request.args.get('status')
    if status:
        query = query.filter(TrainingCompletion.status == status)

    records = query.order_by(TrainingCompletion.created_at.desc()).all()
    return jsonify([r.to_dict() for r in records]), 200


@training_bp.route('/<int:rec_id>', methods=['GET'])
@token_required
def get_training(rec_id):
    rec = TrainingCompletion.query.get(rec_id)
    if not rec:
        return jsonify({'error': 'Training record not found'}), 404

    if g.current_user.role == 'Employee' and rec.user_id != g.current_user.id:
        return jsonify({'error': 'Forbidden'}), 403

    return jsonify(rec.to_dict()), 200


@training_bp.route('', methods=['POST'])
@token_required
def create_training():
    data = request.get_json() or {}
    name = data.get('training_name', '').strip()
    if not name:
        return jsonify({'error': 'training_name is required'}), 400

    # User rule enforcement: Employees can enroll themselves (status='Enrolled'),
    # but only Admin/ESG Manager can set status directly to 'Completed'.
    target_user_id = data.get('user_id', g.current_user.id)
    if g.current_user.role == 'Employee':
        target_user_id = g.current_user.id
        requested_status = 'Enrolled'
    else:
        requested_status = data.get('status', 'Enrolled')

    c_date = data.get('completion_date')
    parsed_date = date_type.fromisoformat(c_date) if c_date else None

    rec = TrainingCompletion(
        user_id=target_user_id,
        training_name=name,
        completion_date=parsed_date,
        status=requested_status,
        cert_url=data.get('cert_url', '').strip()
    )
    db.session.add(rec)
    db.session.commit()
    return jsonify(rec.to_dict()), 201


@training_bp.route('/<int:rec_id>', methods=['PUT'])
@token_required
def update_training(rec_id):
    rec = TrainingCompletion.query.get(rec_id)
    if not rec:
        return jsonify({'error': 'Training record not found'}), 404

    is_admin = g.current_user.role in ('Admin', 'ESG Manager')
    if not is_admin and rec.user_id != g.current_user.id:
        return jsonify({'error': 'Forbidden'}), 403

    data = request.get_json() or {}

    if 'training_name' in data and data['training_name']:
        rec.training_name = data['training_name'].strip()

    if 'cert_url' in data:
        rec.cert_url = data['cert_url'].strip()

    if 'completion_date' in data:
        rec.completion_date = date_type.fromisoformat(data['completion_date']) if data['completion_date'] else None

    # Status change rule: ONLY Admin / ESG Manager can mark status as 'Completed' or 'Failed'
    if 'status' in data:
        new_status = data['status']
        if new_status in ('Completed', 'Failed') and not is_admin:
            return jsonify({
                'error': 'Forbidden: Setting training status to Completed or Failed requires Manager/Admin approval.'
            }), 403
        rec.status = new_status

    db.session.commit()
    return jsonify(rec.to_dict()), 200


@training_bp.route('/<int:rec_id>', methods=['DELETE'])
@token_required
@require_role('Admin', 'ESG Manager')
def delete_training(rec_id):
    rec = TrainingCompletion.query.get(rec_id)
    if not rec:
        return jsonify({'error': 'Training record not found'}), 404
    db.session.delete(rec)
    db.session.commit()
    return jsonify({'message': 'Training record deleted', 'id': rec_id}), 200
