from datetime import date as date_type
from flask import Blueprint, jsonify, request
from database import db
from models import ERPRecord, Department
from auth import token_required, require_role

erp_bp = Blueprint('erp', __name__)


def seed_erp_records():
    """Seed realistic mock ERP records if the table is empty."""
    if ERPRecord.query.count() > 0:
        return

    # Use first available department IDs (fallback to None if no depts yet)
    depts = Department.query.filter_by(status='Active').limit(4).all()
    dept_ids = [d.id for d in depts]

    def dept(idx):
        return dept_ids[idx] if idx < len(dept_ids) else None

    records = [
        # Purchase
        ERPRecord(record_type='Purchase', reference_no='PO-2025-0001', department_id=dept(0),
                  quantity=500, unit='kg', description='Office paper & supplies bulk order',
                  date=date_type(2025, 1, 15)),
        ERPRecord(record_type='Purchase', reference_no='PO-2025-0087', department_id=dept(1),
                  quantity=1200, unit='kg', description='Electronic hardware procurement (servers)',
                  date=date_type(2025, 3, 22)),
        ERPRecord(record_type='Purchase', reference_no='PO-2025-0142', department_id=dept(2),
                  quantity=800, unit='litre', description='Industrial cleaning chemicals',
                  date=date_type(2025, 5, 10)),
        # Manufacturing
        ERPRecord(record_type='Manufacturing', reference_no='MFG-2025-0034', department_id=dept(0),
                  quantity=3000, unit='kWh', description='Assembly line energy consumption – Q1',
                  date=date_type(2025, 2, 28)),
        ERPRecord(record_type='Manufacturing', reference_no='MFG-2025-0078', department_id=dept(1),
                  quantity=1500, unit='kg', description='Packaging material used in production run',
                  date=date_type(2025, 4, 14)),
        # Expense
        ERPRecord(record_type='Expense', reference_no='EXP-2025-0211', department_id=dept(2),
                  quantity=8400, unit='km', description='Business air travel – regional sales team',
                  date=date_type(2025, 3, 5)),
        ERPRecord(record_type='Expense', reference_no='EXP-2025-0349', department_id=dept(3),
                  quantity=90, unit='night', description='Hotel accommodation – executive conference',
                  date=date_type(2025, 6, 18)),
        # Fleet
        ERPRecord(record_type='Fleet', reference_no='FLT-2025-0012', department_id=dept(0),
                  quantity=2200, unit='litre', description='Diesel – delivery trucks fleet refuel',
                  date=date_type(2025, 1, 31)),
        ERPRecord(record_type='Fleet', reference_no='FLT-2025-0035', department_id=dept(1),
                  quantity=650, unit='litre', description='Petrol – company car pool monthly',
                  date=date_type(2025, 4, 30)),
        ERPRecord(record_type='Fleet', reference_no='FLT-2025-0058', department_id=dept(2),
                  quantity=3100, unit='litre', description='Diesel – logistics long-haul vehicles',
                  date=date_type(2025, 6, 30)),
    ]

    for r in records:
        db.session.add(r)
    db.session.commit()
    print(f"[ERP Seeder] Seeded {len(records)} mock ERP records.")


@erp_bp.route('', methods=['GET'])
@token_required
def get_erp_records():
    query = ERPRecord.query
    record_type = request.args.get('type')
    dept_id = request.args.get('department_id')
    if record_type:
        query = query.filter(ERPRecord.record_type == record_type)
    if dept_id:
        query = query.filter(ERPRecord.department_id == int(dept_id))
    records = query.order_by(ERPRecord.date.desc()).all()
    return jsonify([r.to_dict() for r in records]), 200


@erp_bp.route('/<int:record_id>', methods=['GET'])
@token_required
def get_erp_record(record_id):
    record = ERPRecord.query.get(record_id)
    if not record:
        return jsonify({'error': 'ERP record not found'}), 404
    return jsonify(record.to_dict()), 200


@erp_bp.route('', methods=['POST'])
@token_required
@require_role('Admin', 'ESG Manager')
def create_erp_record():
    data = request.get_json() or {}
    record_type = data.get('record_type', '').strip()
    reference_no = data.get('reference_no', '').strip()
    quantity = data.get('quantity')
    rec_date = data.get('date')

    if not record_type or not reference_no or quantity is None or not rec_date:
        return jsonify({'error': 'record_type, reference_no, quantity, and date are required'}), 400

    record = ERPRecord(
        record_type=record_type,
        reference_no=reference_no,
        department_id=int(data['department_id']) if data.get('department_id') else None,
        quantity=float(quantity),
        unit=data.get('unit', '').strip(),
        description=data.get('description', '').strip(),
        date=date_type.fromisoformat(rec_date),
    )
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201
