from flask import Blueprint, jsonify, request, g
from database import db
from models import Department
from auth import token_required, require_role

department_bp = Blueprint('departments', __name__)

@department_bp.route('', methods=['GET'])
@token_required
def get_departments():
    status = request.args.get('status')
    query = Department.query
    if status:
        query = query.filter_by(status=status)
    departments = query.order_by(Department.name.asc()).all()
    return jsonify([dept.to_dict() for dept in departments]), 200

@department_bp.route('/<int:dept_id>', methods=['GET'])
@token_required
def get_department(dept_id):
    dept = Department.query.get(dept_id)
    if not dept:
        return jsonify({'error': 'Department not found'}), 404
    return jsonify(dept.to_dict()), 200

@department_bp.route('', methods=['POST'])
@token_required
@require_role('Admin')
def create_department():
    data = request.get_json() or {}
    
    name = data.get('name')
    code = data.get('code')
    
    if not name or not code:
        return jsonify({'error': 'Department name and code are required'}), 400

    # Check for duplicate code
    existing = Department.query.filter_by(code=code.upper().strip()).first()
    if existing:
        return jsonify({'error': f'Department code "{code}" already exists'}), 400

    parent_id = data.get('parent_department_id')
    if parent_id:
        parent = Department.query.get(parent_id)
        if not parent:
            return jsonify({'error': 'Parent department not found'}), 400

    dept = Department(
        name=name.strip(),
        code=code.upper().strip(),
        head=data.get('head', '').strip(),
        parent_department_id=parent_id if parent_id else None,
        employee_count=int(data.get('employee_count', 0)),
        status=data.get('status', 'Active')
    )

    db.session.add(dept)
    db.session.commit()

    return jsonify(dept.to_dict()), 201

@department_bp.route('/<int:dept_id>', methods=['PUT'])
@token_required
@require_role('Admin')
def update_department(dept_id):
    dept = Department.query.get(dept_id)
    if not dept:
        return jsonify({'error': 'Department not found'}), 404

    data = request.get_json() or {}

    if 'name' in data and data['name']:
        dept.name = data['name'].strip()

    if 'code' in data and data['code']:
        new_code = data['code'].upper().strip()
        existing = Department.query.filter(Department.code == new_code, Department.id != dept_id).first()
        if existing:
            return jsonify({'error': f'Department code "{new_code}" already in use'}), 400
        dept.code = new_code

    if 'head' in data:
        dept.head = data['head'].strip()

    if 'parent_department_id' in data:
        parent_id = data['parent_department_id']
        if parent_id == dept_id:
            return jsonify({'error': 'Department cannot be its own parent'}), 400
        if parent_id:
            parent = Department.query.get(parent_id)
            if not parent:
                return jsonify({'error': 'Parent department not found'}), 400
        dept.parent_department_id = parent_id if parent_id else None

    if 'employee_count' in data:
        dept.employee_count = int(data['employee_count'])

    if 'status' in data:
        if data['status'] in ['Active', 'Inactive']:
            dept.status = data['status']

    db.session.commit()
    return jsonify(dept.to_dict()), 200

@department_bp.route('/<int:dept_id>', methods=['DELETE'])
@token_required
@require_role('Admin')
def delete_department(dept_id):
    dept = Department.query.get(dept_id)
    if not dept:
        return jsonify({'error': 'Department not found'}), 404

    # Prevent deleting if sub-departments exist
    sub_count = Department.query.filter_by(parent_department_id=dept_id).count()
    if sub_count > 0:
        return jsonify({'error': 'Cannot delete department that has child sub-departments'}), 400

    db.session.delete(dept)
    db.session.commit()
    return jsonify({'message': 'Department deleted successfully', 'id': dept_id}), 200
