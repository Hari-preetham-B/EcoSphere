from flask import Blueprint, jsonify, request, g
from database import db
from models import EmissionFactor
from auth import token_required, require_role

emission_factors_bp = Blueprint('emission_factors', __name__)


@emission_factors_bp.route('', methods=['GET'])
@token_required
def get_emission_factors():
    factors = EmissionFactor.query.order_by(EmissionFactor.activity_type.asc()).all()
    return jsonify([f.to_dict() for f in factors]), 200


@emission_factors_bp.route('/<int:factor_id>', methods=['GET'])
@token_required
def get_emission_factor(factor_id):
    factor = EmissionFactor.query.get(factor_id)
    if not factor:
        return jsonify({'error': 'Emission factor not found'}), 404
    return jsonify(factor.to_dict()), 200


@emission_factors_bp.route('', methods=['POST'])
@token_required
@require_role('Admin', 'ESG Manager')
def create_emission_factor():
    data = request.get_json() or {}
    activity_type = data.get('activity_type', '').strip()
    unit = data.get('unit', '').strip()
    co2e_factor = data.get('co2e_factor')

    if not activity_type or not unit or co2e_factor is None:
        return jsonify({'error': 'activity_type, unit, and co2e_factor are required'}), 400

    try:
        co2e_factor = float(co2e_factor)
    except (TypeError, ValueError):
        return jsonify({'error': 'co2e_factor must be a number'}), 400

    factor = EmissionFactor(
        activity_type=activity_type,
        unit=unit,
        co2e_factor=co2e_factor,
        description=data.get('description', '').strip()
    )
    db.session.add(factor)
    db.session.commit()
    return jsonify(factor.to_dict()), 201


@emission_factors_bp.route('/<int:factor_id>', methods=['PUT'])
@token_required
@require_role('Admin', 'ESG Manager')
def update_emission_factor(factor_id):
    factor = EmissionFactor.query.get(factor_id)
    if not factor:
        return jsonify({'error': 'Emission factor not found'}), 404

    data = request.get_json() or {}
    if 'activity_type' in data and data['activity_type']:
        factor.activity_type = data['activity_type'].strip()
    if 'unit' in data and data['unit']:
        factor.unit = data['unit'].strip()
    if 'co2e_factor' in data:
        try:
            factor.co2e_factor = float(data['co2e_factor'])
        except (TypeError, ValueError):
            return jsonify({'error': 'co2e_factor must be a number'}), 400
    if 'description' in data:
        factor.description = data['description'].strip()

    db.session.commit()
    return jsonify(factor.to_dict()), 200


@emission_factors_bp.route('/<int:factor_id>', methods=['DELETE'])
@token_required
@require_role('Admin', 'ESG Manager')
def delete_emission_factor(factor_id):
    factor = EmissionFactor.query.get(factor_id)
    if not factor:
        return jsonify({'error': 'Emission factor not found'}), 404

    db.session.delete(factor)
    db.session.commit()
    return jsonify({'message': 'Emission factor deleted', 'id': factor_id}), 200
