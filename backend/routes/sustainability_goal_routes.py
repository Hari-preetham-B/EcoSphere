from datetime import date as date_type
from flask import Blueprint, jsonify, request
from sqlalchemy import func
from database import db
from models import SustainabilityGoal, CarbonTransaction, Department
from auth import token_required, require_role

sustainability_goals_bp = Blueprint('sustainability_goals', __name__)


def _compute_progress(goal):
    """Return actual CO2e emitted for a goal's scope (department or company-wide)."""
    query = db.session.query(func.coalesce(func.sum(CarbonTransaction.co2e), 0))
    if goal.department_id:
        query = query.filter(CarbonTransaction.department_id == goal.department_id)
    # Filter to transactions up to the goal deadline
    query = query.filter(CarbonTransaction.date <= goal.deadline)
    actual = float(query.scalar() or 0)
    progress_pct = min(round((actual / goal.target_value) * 100, 1), 100) if goal.target_value else 0
    return actual, progress_pct


@sustainability_goals_bp.route('', methods=['GET'])
@token_required
def get_goals():
    goals = SustainabilityGoal.query.order_by(SustainabilityGoal.deadline.asc()).all()
    result = []
    for g in goals:
        d = g.to_dict()
        actual, pct = _compute_progress(g)
        d['actual_co2e'] = actual
        d['progress_pct'] = pct
        result.append(d)
    return jsonify(result), 200


@sustainability_goals_bp.route('/<int:goal_id>', methods=['GET'])
@token_required
def get_goal(goal_id):
    goal = SustainabilityGoal.query.get(goal_id)
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
    d = goal.to_dict()
    actual, pct = _compute_progress(goal)
    d['actual_co2e'] = actual
    d['progress_pct'] = pct
    return jsonify(d), 200


@sustainability_goals_bp.route('', methods=['POST'])
@token_required
@require_role('Admin', 'ESG Manager')
def create_goal():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    metric = data.get('metric', '').strip()
    target_value = data.get('target_value')
    deadline = data.get('deadline')

    if not name or not metric or target_value is None or not deadline:
        return jsonify({'error': 'name, metric, target_value, and deadline are required'}), 400

    dept_id = data.get('department_id')
    if dept_id:
        dept = Department.query.get(dept_id)
        if not dept:
            return jsonify({'error': 'Department not found'}), 404

    goal = SustainabilityGoal(
        name=name,
        metric=metric,
        target_value=float(target_value),
        deadline=date_type.fromisoformat(deadline),
        department_id=int(dept_id) if dept_id else None,
        status=data.get('status', 'Active')
    )
    db.session.add(goal)
    db.session.commit()
    return jsonify(goal.to_dict()), 201


@sustainability_goals_bp.route('/<int:goal_id>', methods=['PUT'])
@token_required
@require_role('Admin', 'ESG Manager')
def update_goal(goal_id):
    goal = SustainabilityGoal.query.get(goal_id)
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404

    data = request.get_json() or {}
    if 'name' in data and data['name']:
        goal.name = data['name'].strip()
    if 'metric' in data and data['metric']:
        goal.metric = data['metric'].strip()
    if 'target_value' in data:
        goal.target_value = float(data['target_value'])
    if 'deadline' in data:
        goal.deadline = date_type.fromisoformat(data['deadline'])
    if 'department_id' in data:
        goal.department_id = int(data['department_id']) if data['department_id'] else None
    if 'status' in data and data['status'] in ('Active', 'Achieved', 'Expired'):
        goal.status = data['status']

    db.session.commit()
    return jsonify(goal.to_dict()), 200


@sustainability_goals_bp.route('/<int:goal_id>', methods=['DELETE'])
@token_required
@require_role('Admin', 'ESG Manager')
def delete_goal(goal_id):
    goal = SustainabilityGoal.query.get(goal_id)
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
    db.session.delete(goal)
    db.session.commit()
    return jsonify({'message': 'Goal deleted', 'id': goal_id}), 200
