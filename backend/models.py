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

# ─── Environmental Module Models ──────────────────────────────────────────────

class EmissionFactor(db.Model):
    __tablename__ = 'emission_factors'

    id = db.Column(db.Integer, primary_key=True)
    activity_type = db.Column(db.String(150), nullable=False)
    unit = db.Column(db.String(50), nullable=False)
    co2e_factor = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, activity_type=None, unit=None, co2e_factor=None, description=None, **kwargs):
        super().__init__(**kwargs)
        if activity_type is not None:
            self.activity_type = activity_type
        if unit is not None:
            self.unit = unit
        if co2e_factor is not None:
            self.co2e_factor = co2e_factor
        if description is not None:
            self.description = description

    def to_dict(self):
        return {
            'id': self.id,
            'activity_type': self.activity_type,
            'unit': self.unit,
            'co2e_factor': self.co2e_factor,
            'description': self.description or '',
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class ERPRecord(db.Model):
    __tablename__ = 'erp_records'

    id = db.Column(db.Integer, primary_key=True)
    record_type = db.Column(db.String(50), nullable=False)
    reference_no = db.Column(db.String(100), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    quantity = db.Column(db.Float, nullable=False, default=0)
    unit = db.Column(db.String(50), nullable=True)
    description = db.Column(db.Text, nullable=True)
    date = db.Column(db.Date, nullable=False)
    linked_transaction_id = db.Column(
        db.Integer,
        db.ForeignKey('carbon_transactions.id', use_alter=True, name='fk_erp_linked_tx'),
        nullable=True
    )

    department = db.relationship('Department', foreign_keys=[department_id])

    def __init__(self, record_type=None, reference_no=None, department_id=None,
                 quantity=0, unit=None, description=None, date=None,
                 linked_transaction_id=None, **kwargs):
        super().__init__(**kwargs)
        if record_type is not None:
            self.record_type = record_type
        if reference_no is not None:
            self.reference_no = reference_no
        self.department_id = department_id
        self.quantity = quantity
        if unit is not None:
            self.unit = unit
        if description is not None:
            self.description = description
        if date is not None:
            self.date = date
        self.linked_transaction_id = linked_transaction_id

    def to_dict(self):
        return {
            'id': self.id,
            'record_type': self.record_type,
            'reference_no': self.reference_no,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'quantity': self.quantity,
            'unit': self.unit or '',
            'description': self.description or '',
            'date': self.date.isoformat() if self.date else None,
            'linked_transaction_id': self.linked_transaction_id,
        }


class CarbonTransaction(db.Model):
    __tablename__ = 'carbon_transactions'

    id = db.Column(db.Integer, primary_key=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    source = db.Column(db.String(50), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    emission_factor_id = db.Column(db.Integer, db.ForeignKey('emission_factors.id'), nullable=False)
    co2e = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    erp_record_id = db.Column(db.Integer, db.ForeignKey('erp_records.id'), nullable=True)
    created_by = db.Column(db.String(64), db.ForeignKey('user_profiles.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    department = db.relationship('Department', foreign_keys=[department_id])
    emission_factor = db.relationship('EmissionFactor', foreign_keys=[emission_factor_id])
    erp_record = db.relationship('ERPRecord', foreign_keys=[erp_record_id], backref='transaction')
    creator = db.relationship('UserProfile', foreign_keys=[created_by])

    def __init__(self, department_id=None, source=None, quantity=None,
                 emission_factor_id=None, co2e=None, date=None, notes=None,
                 erp_record_id=None, created_by=None, **kwargs):
        super().__init__(**kwargs)
        if department_id is not None:
            self.department_id = department_id
        if source is not None:
            self.source = source
        if quantity is not None:
            self.quantity = quantity
        if emission_factor_id is not None:
            self.emission_factor_id = emission_factor_id
        if co2e is not None:
            self.co2e = co2e
        if date is not None:
            self.date = date
        if notes is not None:
            self.notes = notes
        self.erp_record_id = erp_record_id
        self.created_by = created_by

    def to_dict(self):
        return {
            'id': self.id,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'source': self.source,
            'quantity': self.quantity,
            'emission_factor_id': self.emission_factor_id,
            'emission_factor': self.emission_factor.activity_type if self.emission_factor else None,
            'co2e_factor': self.emission_factor.co2e_factor if self.emission_factor else None,
            'unit': self.emission_factor.unit if self.emission_factor else None,
            'co2e': self.co2e,
            'date': self.date.isoformat() if self.date else None,
            'notes': self.notes or '',
            'erp_record_id': self.erp_record_id,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class SustainabilityGoal(db.Model):
    __tablename__ = 'sustainability_goals'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    metric = db.Column(db.String(100), nullable=False)
    target_value = db.Column(db.Float, nullable=False)
    deadline = db.Column(db.Date, nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    status = db.Column(db.String(20), nullable=False, default='Active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    department = db.relationship('Department', foreign_keys=[department_id])

    def __init__(self, name=None, metric=None, target_value=None, deadline=None,
                 department_id=None, status='Active', **kwargs):
        super().__init__(**kwargs)
        if name is not None:
            self.name = name
        if metric is not None:
            self.metric = metric
        if target_value is not None:
            self.target_value = target_value
        if deadline is not None:
            self.deadline = deadline
        self.department_id = department_id
        if status is not None:
            self.status = status

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'metric': self.metric,
            'target_value': self.target_value,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else 'Company-wide',
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class Setting(db.Model):
    __tablename__ = 'settings'

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.String(500), nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, key=None, value=None, updated_at=None, **kwargs):
        super().__init__(**kwargs)
        if key is not None:
            self.key = key
        if value is not None:
            self.value = value
        if updated_at is not None:
            self.updated_at = updated_at

    def to_dict(self):
        return {
            'key': self.key,
            'value': self.value,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

