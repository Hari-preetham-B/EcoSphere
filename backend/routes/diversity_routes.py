from flask import Blueprint, jsonify, request, g
from database import db
from models import DiversityMetric, Department
from auth import token_required, require_role

diversity_bp = Blueprint('diversity', __name__)


@diversity_bp.route('', methods=['GET'])
@token_required
def get_diversity_metrics():
    year = request.args.get('year')
    dept_id = request.args.get('department_id')

    query = DiversityMetric.query
    if year:
        query = query.filter(DiversityMetric.year == int(year))
    if dept_id:
        query = query.filter(DiversityMetric.department_id == int(dept_id))

    metrics = query.order_by(DiversityMetric.year.desc(), DiversityMetric.department_id.asc()).all()
    return jsonify([m.to_dict() for m in metrics]), 200


@diversity_bp.route('/<int:metric_id>', methods=['GET'])
@token_required
def get_diversity_metric(metric_id):
    m = DiversityMetric.query.get(metric_id)
    if not m:
        return jsonify({'error': 'Diversity metric record not found'}), 404
    return jsonify(m.to_dict()), 200


@diversity_bp.route('', methods=['POST'])
@token_required
@require_role('Admin', 'ESG Manager')
def create_or_update_diversity():
    data = request.get_json() or {}
    dept_id = data.get('department_id')
    year = data.get('year')

    if not dept_id or not year:
        return jsonify({'error': 'department_id and year are required'}), 400

    dept = Department.query.get(dept_id)
    if not dept:
        return jsonify({'error': 'Department not found'}), 404

    # Upsert pattern: if record for this dept + year exists, update it
    existing = DiversityMetric.query.filter_by(department_id=int(dept_id), year=int(year)).first()
    if existing:
        m = existing
    else:
        m = DiversityMetric(department_id=int(dept_id), year=int(year), created_by=g.current_user.id)
        db.session.add(m)

    m.male_pct = float(data.get('male_pct', 0))
    m.female_pct = float(data.get('female_pct', 0))
    m.other_pct = float(data.get('other_pct', 0))
    m.age_under30 = int(data.get('age_under30', 0))
    m.age_30to50 = int(data.get('age_30to50', 0))
    m.age_over50 = int(data.get('age_over50', 0))

    db.session.commit()
    return jsonify(m.to_dict()), 200 if existing else 201


@diversity_bp.route('/<int:metric_id>', methods=['DELETE'])
@token_required
@require_role('Admin', 'ESG Manager')
def delete_diversity(metric_id):
    m = DiversityMetric.query.get(metric_id)
    if not m:
        return jsonify({'error': 'Diversity metric record not found'}), 404
    db.session.delete(m)
    db.session.commit()
    return jsonify({'message': 'Diversity record deleted', 'id': metric_id}), 200
