from flask import Blueprint, jsonify, request, g
from database import db
from models import Category
from auth import token_required, require_role

category_bp = Blueprint('categories', __name__)

@category_bp.route('', methods=['GET'])
@token_required
def get_categories():
    type_filter = request.args.get('type')
    status_filter = request.args.get('status')
    
    query = Category.query
    if type_filter:
        query = query.filter_by(type=type_filter)
    if status_filter:
        query = query.filter_by(status=status_filter)
        
    categories = query.order_by(Category.name.asc()).all()
    return jsonify([cat.to_dict() for cat in categories]), 200

@category_bp.route('/<int:cat_id>', methods=['GET'])
@token_required
def get_category(cat_id):
    cat = Category.query.get(cat_id)
    if not cat:
        return jsonify({'error': 'Category not found'}), 404
    return jsonify(cat.to_dict()), 200

@category_bp.route('', methods=['POST'])
@token_required
@require_role('Admin')
def create_category():
    data = request.get_json() or {}
    
    name = data.get('name')
    cat_type = data.get('type')
    
    allowed_types = ['CSR Activity', 'Challenge']
    if not name or not cat_type or cat_type not in allowed_types:
        return jsonify({'error': f'Category name and valid type ({allowed_types}) are required'}), 400

    cat = Category(
        name=name.strip(),
        type=cat_type,
        status=data.get('status', 'Active')
    )

    db.session.add(cat)
    db.session.commit()

    return jsonify(cat.to_dict()), 201

@category_bp.route('/<int:cat_id>', methods=['PUT'])
@token_required
@require_role('Admin')
def update_category(cat_id):
    cat = Category.query.get(cat_id)
    if not cat:
        return jsonify({'error': 'Category not found'}), 404

    data = request.get_json() or {}

    if 'name' in data and data['name']:
        cat.name = data['name'].strip()

    if 'type' in data and data['type']:
        if data['type'] in ['CSR Activity', 'Challenge']:
            cat.type = data['type']

    if 'status' in data and data['status']:
        if data['status'] in ['Active', 'Inactive']:
            cat.status = data['status']

    db.session.commit()
    return jsonify(cat.to_dict()), 200

@category_bp.route('/<int:cat_id>', methods=['DELETE'])
@token_required
@require_role('Admin')
def delete_category(cat_id):
    cat = Category.query.get(cat_id)
    if not cat:
        return jsonify({'error': 'Category not found'}), 404

    db.session.delete(cat)
    db.session.commit()
    return jsonify({'message': 'Category deleted successfully', 'id': cat_id}), 200
