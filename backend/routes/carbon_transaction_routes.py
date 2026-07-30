from datetime import date as date_type
from flask import Blueprint, jsonify, request, g
from sqlalchemy import func, extract
from database import db
from models import CarbonTransaction, EmissionFactor, Department, ERPRecord, Setting
from auth import token_required, require_role

carbon_transactions_bp = Blueprint('carbon_transactions', __name__)


def _get_auto_calc_enabled():
    s = Setting.query.filter_by(key='auto_emission_calc').first()
    return s and s.value == 'true'


@carbon_transactions_bp.route('', methods=['GET'])
@token_required
def get_transactions():
    query = CarbonTransaction.query
    dept_id = request.args.get('department_id')
    year = request.args.get('year')
    if dept_id:
        query = query.filter(CarbonTransaction.department_id == int(dept_id))
    if year:
        query = query.filter(extract('year', CarbonTransaction.date) == int(year))
    txns = query.order_by(CarbonTransaction.date.desc()).all()
    return jsonify([t.to_dict() for t in txns]), 200


@carbon_transactions_bp.route('/<int:txn_id>', methods=['GET'])
@token_required
def get_transaction(txn_id):
    txn = CarbonTransaction.query.get(txn_id)
    if not txn:
        return jsonify({'error': 'Transaction not found'}), 404
    return jsonify(txn.to_dict()), 200


@carbon_transactions_bp.route('', methods=['POST'])
@token_required
def create_transaction():
    data = request.get_json() or {}

    dept_id = data.get('department_id')
    source = data.get('source', '').strip()
    quantity = data.get('quantity')
    factor_id = data.get('emission_factor_id')
    txn_date = data.get('date')
    notes = data.get('notes', '')
    erp_record_id = data.get('erp_record_id')

    if not dept_id or not source or quantity is None or not factor_id or not txn_date:
        return jsonify({'error': 'department_id, source, quantity, emission_factor_id, and date are required'}), 400

    dept = Department.query.get(dept_id)
    if not dept:
        return jsonify({'error': 'Department not found'}), 404

    factor = EmissionFactor.query.get(factor_id)
    if not factor:
        return jsonify({'error': 'Emission factor not found'}), 404

    try:
        quantity = float(quantity)
    except (TypeError, ValueError):
        return jsonify({'error': 'quantity must be a number'}), 400

    co2e = round(quantity * factor.co2e_factor, 4)

    txn = CarbonTransaction(
        department_id=int(dept_id),
        source=source,
        quantity=quantity,
        emission_factor_id=int(factor_id),
        co2e=co2e,
        date=date_type.fromisoformat(txn_date),
        notes=notes.strip() if notes else '',
        erp_record_id=int(erp_record_id) if erp_record_id else None,
        created_by=g.current_user.id
    )
    db.session.add(txn)
    db.session.commit()
    return jsonify(txn.to_dict()), 201


@carbon_transactions_bp.route('/<int:txn_id>', methods=['PUT'])
@token_required
def update_transaction(txn_id):
    txn = CarbonTransaction.query.get(txn_id)
    if not txn:
        return jsonify({'error': 'Transaction not found'}), 404

    # Only Admin/ESG Manager or creator may edit
    cu = g.current_user
    if cu.role not in ('Admin', 'ESG Manager') and txn.created_by != cu.id:
        return jsonify({'error': 'Forbidden'}), 403

    data = request.get_json() or {}
    recalc = False

    if 'department_id' in data:
        dept = Department.query.get(data['department_id'])
        if not dept:
            return jsonify({'error': 'Department not found'}), 404
        txn.department_id = data['department_id']

    if 'source' in data:
        txn.source = data['source'].strip()

    if 'quantity' in data:
        txn.quantity = float(data['quantity'])
        recalc = True

    if 'emission_factor_id' in data:
        factor = EmissionFactor.query.get(data['emission_factor_id'])
        if not factor:
            return jsonify({'error': 'Emission factor not found'}), 404
        txn.emission_factor_id = data['emission_factor_id']
        recalc = True

    if recalc:
        factor = EmissionFactor.query.get(txn.emission_factor_id)
        txn.co2e = round(txn.quantity * factor.co2e_factor, 4)

    if 'date' in data:
        txn.date = date_type.fromisoformat(data['date'])

    if 'notes' in data:
        txn.notes = data['notes'].strip()

    db.session.commit()
    return jsonify(txn.to_dict()), 200


@carbon_transactions_bp.route('/<int:txn_id>', methods=['DELETE'])
@token_required
@require_role('Admin', 'ESG Manager')
def delete_transaction(txn_id):
    txn = CarbonTransaction.query.get(txn_id)
    if not txn:
        return jsonify({'error': 'Transaction not found'}), 404
    db.session.delete(txn)
    db.session.commit()
    return jsonify({'message': 'Transaction deleted', 'id': txn_id}), 200


@carbon_transactions_bp.route('/department-summary', methods=['GET'])
@token_required
def department_summary():
    rows = (
        db.session.query(
            Department.id.label('department_id'),
            Department.name.label('department_name'),
            func.coalesce(func.sum(CarbonTransaction.co2e), 0).label('total_co2e'),
            func.count(CarbonTransaction.id).label('transaction_count')
        )
        .join(CarbonTransaction, CarbonTransaction.department_id == Department.id, isouter=True)
        .filter(Department.status == 'Active')
        .group_by(Department.id, Department.name)
        .order_by(func.sum(CarbonTransaction.co2e).desc().nullslast())
        .all()
    )
    return jsonify([
        {
            'department_id': r.department_id,
            'department_name': r.department_name,
            'total_co2e': float(r.total_co2e),
            'transaction_count': r.transaction_count
        }
        for r in rows
    ]), 200


@carbon_transactions_bp.route('/trend', methods=['GET'])
@token_required
def monthly_trend():
    year = request.args.get('year', date_type.today().year)
    rows = (
        db.session.query(
            extract('month', CarbonTransaction.date).label('month'),
            func.sum(CarbonTransaction.co2e).label('total_co2e')
        )
        .filter(extract('year', CarbonTransaction.date) == int(year))
        .group_by(extract('month', CarbonTransaction.date))
        .order_by(extract('month', CarbonTransaction.date))
        .all()
    )

    MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    result = []
    totals = {int(r.month): float(r.total_co2e) for r in rows}
    for i, name in enumerate(MONTHS, start=1):
        result.append({'month': name, 'co2e': totals.get(i, 0)})
    return jsonify(result), 200


@carbon_transactions_bp.route('/settings/auto-calc', methods=['GET'])
@token_required
def get_auto_calc():
    return jsonify({'auto_emission_calc': _get_auto_calc_enabled()}), 200
