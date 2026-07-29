from database import db
from datetime import datetime

class UserProfile(db.Model):
    __tablename__ = 'user_profiles'

    id = db.Column(db.String(64), primary_key=True)  # Supabase Auth User UUID
    email = db.Column(db.String(255), nullable=False, unique=True)
    full_name = db.Column(db.String(255), nullable=True)
    role = db.Column(db.String(50), nullable=False, default='Employee')  # Admin, ESG Manager, Employee
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, id=None, email=None, full_name=None, role='Employee', created_at=None, updated_at=None, **kwargs):
        super().__init__(**kwargs)
        if id is not None:
            self.id = id
        if email is not None:
            self.email = email
        if full_name is not None:
            self.full_name = full_name
        if role is not None:
            self.role = role
        if created_at is not None:
            self.created_at = created_at
        if updated_at is not None:
            self.updated_at = updated_at

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name or '',
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Department(db.Model):
    __tablename__ = 'departments'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    head = db.Column(db.String(150), nullable=True)
    parent_department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    employee_count = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), nullable=False, default='Active')  # Active, Inactive
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    parent = db.relationship('Department', remote_side=[id], backref=db.backref('sub_departments', lazy='dynamic'))

    def __init__(self, id=None, name=None, code=None, head=None, parent_department_id=None, employee_count=0, status='Active', created_at=None, updated_at=None, **kwargs):
        super().__init__(**kwargs)
        if id is not None:
            self.id = id
        if name is not None:
            self.name = name
        if code is not None:
            self.code = code
        if head is not None:
            self.head = head
        self.parent_department_id = parent_department_id
        if employee_count is not None:
            self.employee_count = employee_count
        if status is not None:
            self.status = status
        if created_at is not None:
            self.created_at = created_at
        if updated_at is not None:
            self.updated_at = updated_at

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'head': self.head or '',
            'parent_department_id': self.parent_department_id,
            'parent_department_name': self.parent.name if self.parent else None,
            'employee_count': self.employee_count or 0,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # 'CSR Activity' or 'Challenge'
    status = db.Column(db.String(20), nullable=False, default='Active')  # Active, Inactive
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, id=None, name=None, type=None, status='Active', created_at=None, updated_at=None, **kwargs):
        super().__init__(**kwargs)
        if id is not None:
            self.id = id
        if name is not None:
            self.name = name
        if type is not None:
            self.type = type
        if status is not None:
            self.status = status
        if created_at is not None:
            self.created_at = created_at
        if updated_at is not None:
            self.updated_at = updated_at

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
