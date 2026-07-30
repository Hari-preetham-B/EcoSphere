from flask import Blueprint, jsonify, request, g
from database import db
from models import EmissionFactor
from auth import token_required, require_role

emission_factors_bp = Blueprint('emission_factors', __name__)


def seed_emission_factors():
    """Seed commonly-used default Emission Factors if the table is empty.
    NOTE: These are widely-cited approximate CO2e conversion values and are
    provided as a starting point only.  An Admin should review and refine them
    for the organisation's specific energy supplier, country grid mix, and
    vehicle fleet before relying on them in production reports.
    Sources: DEFRA 2023 GHG Conversion Factors, IPCC AR6.
    """
    if EmissionFactor.query.count() > 0:
        return

    defaults = [
        EmissionFactor(
            activity_type='Diesel Combustion',
            unit='litre',
            co2e_factor=2.68,
            description='Road diesel (DEFRA 2023 scope 1). '
                        'Placeholder – refine for actual fuel grade.',
        ),
        EmissionFactor(
            activity_type='Petrol Combustion',
            unit='litre',
            co2e_factor=2.31,
            description='Motor gasoline (DEFRA 2023 scope 1). '
                        'Placeholder – refine for actual fuel grade.',
        ),
        EmissionFactor(
            activity_type='Grid Electricity',
            unit='kWh',
            co2e_factor=0.233,
            description='UK national grid average (DEFRA 2023 scope 2). '
                        'Placeholder – replace with your country / supplier factor.',
        ),
        EmissionFactor(
            activity_type='Natural Gas',
            unit='m³',
            co2e_factor=2.03,
            description='Natural gas combustion (DEFRA 2023 scope 1). '
                        'Placeholder – verify calorific value for your supply.',
        ),
        EmissionFactor(
            activity_type='Air Travel (Economy)',
            unit='km',
            co2e_factor=0.151,
            description='Short-haul economy class, including RFI (DEFRA 2023). '
                        'Placeholder – use distance-band factors for accuracy.',
        ),
        EmissionFactor(
            activity_type='Water Supply',
            unit='litre',
            co2e_factor=0.000344,
            description='Mains water supply + treatment (DEFRA 2023). '
                        'Placeholder – refine for local water authority.',
        ),
    ]

    for ef in defaults:
        db.session.add(ef)
    db.session.commit()
    print(f'[Emission Factor Seeder] Seeded {len(defaults)} default factors.')


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
