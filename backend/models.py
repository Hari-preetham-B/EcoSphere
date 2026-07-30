from database import db
from datetime import datetime

class UserProfile(db.Model):
    __tablename__ = 'user_profiles'

    id = db.Column(db.String(64), primary_key=True)  # Supabase Auth User UUID
    email = db.Column(db.String(255), nullable=False, unique=True)
    full_name = db.Column(db.String(255), nullable=True)
    role = db.Column(db.String(50), nullable=False, default='Employee')  # Admin, ESG Manager, Employee
    # SINGLE SHARED SPENDABLE BALANCE: incremented on awards, decremented on reward redemptions.
    points = db.Column(db.Integer, nullable=False, default=0)
    # CUMULATIVE LIFETIME POINTS: only ever incremented (never decremented). Used for badge threshold checks.
    lifetime_points_earned = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, id=None, email=None, full_name=None, role='Employee', points=0, lifetime_points_earned=0, created_at=None, updated_at=None, **kwargs):
        super().__init__(**kwargs)
        if id is not None:
            self.id = id
        if email is not None:
            self.email = email
        if full_name is not None:
            self.full_name = full_name
        if role is not None:
            self.role = role
        if points is not None:
            self.points = points
        if lifetime_points_earned is not None:
            self.lifetime_points_earned = lifetime_points_earned
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
            'points': self.points or 0,
            'lifetime_points_earned': self.lifetime_points_earned or 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
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


# ─── Social Module Models ──────────────────────────────────────────────────

class CSRActivity(db.Model):
    __tablename__ = 'csr_activities'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True)
    description = db.Column(db.Text, nullable=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    date = db.Column(db.Date, nullable=False)
    points_reward = db.Column(db.Integer, nullable=False, default=50)
    status = db.Column(db.String(20), nullable=False, default='Active')  # Active, Completed, Cancelled
    created_by = db.Column(db.String(64), db.ForeignKey('user_profiles.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    category = db.relationship('Category', foreign_keys=[category_id])
    department = db.relationship('Department', foreign_keys=[department_id])
    creator = db.relationship('UserProfile', foreign_keys=[created_by])

    def __init__(self, title=None, category_id=None, description=None, department_id=None,
                 date=None, points_reward=50, status='Active', created_by=None, **kwargs):
        super().__init__(**kwargs)
        if title is not None:
            self.title = title
        self.category_id = category_id
        if description is not None:
            self.description = description
        self.department_id = department_id
        if date is not None:
            self.date = date
        if points_reward is not None:
            self.points_reward = points_reward
        if status is not None:
            self.status = status
        self.created_by = created_by

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'description': self.description or '',
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else 'Company-wide',
            'date': self.date.isoformat() if self.date else None,
            'points_reward': self.points_reward,
            'status': self.status,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class CSRParticipation(db.Model):
    __tablename__ = 'csr_participations'

    id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(db.Integer, db.ForeignKey('csr_activities.id'), nullable=False)
    user_id = db.Column(db.String(64), db.ForeignKey('user_profiles.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='Pending')  # Pending, Approved, Rejected
    proof_url = db.Column(db.String(500), nullable=True)
    points_awarded = db.Column(db.Integer, nullable=False, default=0)
    notes = db.Column(db.Text, nullable=True)
    registered_at = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_at = db.Column(db.DateTime, nullable=True)

    activity = db.relationship('CSRActivity', foreign_keys=[activity_id], backref='participations')
    user = db.relationship('UserProfile', foreign_keys=[user_id])

    def __init__(self, activity_id=None, user_id=None, status='Pending', proof_url=None,
                 points_awarded=0, notes=None, **kwargs):
        super().__init__(**kwargs)
        if activity_id is not None:
            self.activity_id = activity_id
        if user_id is not None:
            self.user_id = user_id
        if status is not None:
            self.status = status
        if proof_url is not None:
            self.proof_url = proof_url
        if points_awarded is not None:
            self.points_awarded = points_awarded
        if notes is not None:
            self.notes = notes

    def to_dict(self):
        return {
            'id': self.id,
            'activity_id': self.activity_id,
            'activity_title': self.activity.title if self.activity else None,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else 'Unknown',
            'user_email': self.user.email if self.user else '',
            'status': self.status,
            'proof_url': self.proof_url or '',
            'points_awarded': self.points_awarded,
            'notes': self.notes or '',
            'registered_at': self.registered_at.isoformat() if self.registered_at else None,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
        }


class DiversityMetric(db.Model):
    __tablename__ = 'diversity_metrics'

    id = db.Column(db.Integer, primary_key=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    male_pct = db.Column(db.Float, nullable=False, default=0)
    female_pct = db.Column(db.Float, nullable=False, default=0)
    other_pct = db.Column(db.Float, nullable=False, default=0)
    age_under30 = db.Column(db.Integer, nullable=False, default=0)
    age_30to50 = db.Column(db.Integer, nullable=False, default=0)
    age_over50 = db.Column(db.Integer, nullable=False, default=0)
    created_by = db.Column(db.String(64), db.ForeignKey('user_profiles.id'), nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    department = db.relationship('Department', foreign_keys=[department_id])

    def __init__(self, department_id=None, year=None, male_pct=0, female_pct=0, other_pct=0,
                 age_under30=0, age_30to50=0, age_over50=0, created_by=None, **kwargs):
        super().__init__(**kwargs)
        if department_id is not None:
            self.department_id = department_id
        if year is not None:
            self.year = year
        self.male_pct = male_pct
        self.female_pct = female_pct
        self.other_pct = other_pct
        self.age_under30 = age_under30
        self.age_30to50 = age_30to50
        self.age_over50 = age_over50
        self.created_by = created_by

    def to_dict(self):
        return {
            'id': self.id,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'year': self.year,
            'male_pct': self.male_pct,
            'female_pct': self.female_pct,
            'other_pct': self.other_pct,
            'age_under30': self.age_under30,
            'age_30to50': self.age_30to50,
            'age_over50': self.age_over50,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class TrainingCompletion(db.Model):
    __tablename__ = 'training_completions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(64), db.ForeignKey('user_profiles.id'), nullable=False)
    training_name = db.Column(db.String(200), nullable=False)
    completion_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='Enrolled')  # Enrolled, Completed, Failed
    cert_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('UserProfile', foreign_keys=[user_id])

    def __init__(self, user_id=None, training_name=None, completion_date=None,
                 status='Enrolled', cert_url=None, **kwargs):
        super().__init__(**kwargs)
        if user_id is not None:
            self.user_id = user_id
        if training_name is not None:
            self.training_name = training_name
        if completion_date is not None:
            self.completion_date = completion_date
        if status is not None:
            self.status = status
        if cert_url is not None:
            self.cert_url = cert_url

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else 'Unknown',
            'user_email': self.user.email if self.user else '',
            'training_name': self.training_name,
            'completion_date': self.completion_date.isoformat() if self.completion_date else None,
            'status': self.status,
            'cert_url': self.cert_url or '',
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ─── Governance Module Models ──────────────────────────────────────────────

class ESGPolicy(db.Model):
    __tablename__ = 'esg_policies'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(100), nullable=False, default='General Governance')
    version = db.Column(db.String(50), nullable=False, default='1.0')
    status = db.Column(db.String(20), nullable=False, default='Active')  # Active, Draft, Archived
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)  # NULL = All Departments
    effective_date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    created_by = db.Column(db.String(64), db.ForeignKey('user_profiles.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    department = db.relationship('Department', foreign_keys=[department_id])
    creator = db.relationship('UserProfile', foreign_keys=[created_by])

    def __init__(self, title=None, description=None, category='General Governance',
                 version='1.0', status='Active', department_id=None,
                 effective_date=None, created_by=None, **kwargs):
        super().__init__(**kwargs)
        if title is not None:
            self.title = title
        if description is not None:
            self.description = description
        if category is not None:
            self.category = category
        if version is not None:
            self.version = version
        if status is not None:
            self.status = status
        self.department_id = department_id
        if effective_date is not None:
            self.effective_date = effective_date
        self.created_by = created_by

    def to_dict(self):
        ack_count = getattr(self, '_ack_count', None)
        total_users = getattr(self, '_total_users', None)
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description or '',
            'category': self.category,
            'version': self.version,
            'status': self.status,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else 'All Departments',
            'effective_date': self.effective_date.isoformat() if self.effective_date else None,
            'created_by': self.created_by,
            'creator_name': self.creator.full_name if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'ack_count': ack_count,
            'total_users': total_users
        }


class PolicyAcknowledgement(db.Model):
    __tablename__ = 'policy_acknowledgements'

    id = db.Column(db.Integer, primary_key=True)
    policy_id = db.Column(db.Integer, db.ForeignKey('esg_policies.id'), nullable=False)
    user_id = db.Column(db.String(64), db.ForeignKey('user_profiles.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='Acknowledged')  # Acknowledged, Pending
    acknowledged_at = db.Column(db.DateTime, default=datetime.utcnow)
    reminder_sent_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    policy = db.relationship('ESGPolicy', foreign_keys=[policy_id], backref=db.backref('acknowledgements', cascade='all, delete-orphan'))
    user = db.relationship('UserProfile', foreign_keys=[user_id])

    def __init__(self, policy_id=None, user_id=None, status='Acknowledged',
                 acknowledged_at=None, reminder_sent_at=None, **kwargs):
        super().__init__(**kwargs)
        if policy_id is not None:
            self.policy_id = policy_id
        if user_id is not None:
            self.user_id = user_id
        if status is not None:
            self.status = status
        if acknowledged_at is not None:
            self.acknowledged_at = acknowledged_at
        self.reminder_sent_at = reminder_sent_at

    def to_dict(self):
        return {
            'id': self.id,
            'policy_id': self.policy_id,
            'policy_title': self.policy.title if self.policy else None,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else 'Unknown',
            'user_email': self.user.email if self.user else '',
            'status': self.status,
            'acknowledged_at': self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            'reminder_sent_at': self.reminder_sent_at.isoformat() if self.reminder_sent_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Audit(db.Model):
    __tablename__ = 'audits'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    auditor_name = db.Column(db.String(150), nullable=False)
    audit_date = db.Column(db.Date, nullable=False)
    scope = db.Column(db.Text, nullable=True)
    findings_summary = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='Completed')  # Scheduled, In Progress, Completed
    created_by = db.Column(db.String(64), db.ForeignKey('user_profiles.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    department = db.relationship('Department', foreign_keys=[department_id])
    creator = db.relationship('UserProfile', foreign_keys=[created_by])

    def __init__(self, title=None, department_id=None, auditor_name=None, audit_date=None,
                 scope=None, findings_summary=None, status='Completed', created_by=None, **kwargs):
        super().__init__(**kwargs)
        if title is not None:
            self.title = title
        if department_id is not None:
            self.department_id = department_id
        if auditor_name is not None:
            self.auditor_name = auditor_name
        if audit_date is not None:
            self.audit_date = audit_date
        if scope is not None:
            self.scope = scope
        if findings_summary is not None:
            self.findings_summary = findings_summary
        if status is not None:
            self.status = status
        self.created_by = created_by

    def to_dict(self):
        issues_list = [issue.to_dict() for issue in self.issues] if hasattr(self, 'issues') and self.issues else []
        overdue_count = sum(1 for issue in issues_list if issue.get('is_overdue'))
        return {
            'id': self.id,
            'title': self.title,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'auditor_name': self.auditor_name,
            'audit_date': self.audit_date.isoformat() if self.audit_date else None,
            'scope': self.scope or '',
            'findings_summary': self.findings_summary or '',
            'status': self.status,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'issues_count': len(issues_list),
            'overdue_issues_count': overdue_count
        }


class ComplianceIssue(db.Model):
    __tablename__ = 'compliance_issues'

    id = db.Column(db.Integer, primary_key=True)
    audit_id = db.Column(db.Integer, db.ForeignKey('audits.id'), nullable=False)
    severity = db.Column(db.String(20), nullable=False)  # Low, Medium, High, Critical
    description = db.Column(db.Text, nullable=False)
    owner_id = db.Column(db.String(64), db.ForeignKey('user_profiles.id'), nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='Open')  # Open, In Progress, Resolved, Closed
    resolution_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    audit = db.relationship('Audit', foreign_keys=[audit_id], backref=db.backref('issues', cascade='all, delete-orphan'))
    owner = db.relationship('UserProfile', foreign_keys=[owner_id])

    def __init__(self, audit_id=None, severity=None, description=None, owner_id=None,
                 due_date=None, status='Open', resolution_notes=None, **kwargs):
        super().__init__(**kwargs)
        if audit_id is not None:
            self.audit_id = audit_id
        if severity is not None:
            self.severity = severity
        if description is not None:
            self.description = description
        if owner_id is not None:
            self.owner_id = owner_id
        if due_date is not None:
            self.due_date = due_date
        if status is not None:
            self.status = status
        if resolution_notes is not None:
            self.resolution_notes = resolution_notes

    @property
    def is_overdue(self):
        if self.status in ['Open', 'In Progress'] and self.due_date:
            from datetime import date
            return self.due_date < date.today()
        return False

    def to_dict(self):
        return {
            'id': self.id,
            'audit_id': self.audit_id,
            'audit_title': self.audit.title if self.audit else None,
            'department_id': self.audit.department_id if self.audit else None,
            'department_name': self.audit.department.name if (self.audit and self.audit.department) else None,
            'severity': self.severity,
            'description': self.description,
            'owner_id': self.owner_id,
            'owner_name': self.owner.full_name if (self.owner and self.owner.full_name) else (self.owner.email if self.owner else 'Unassigned'),
            'owner_email': self.owner.email if self.owner else '',
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'status': self.status,
            'resolution_notes': self.resolution_notes or '',
            'is_overdue': self.is_overdue,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


# ─── Gamification Module Models ──────────────────────────────────────────────

class Challenge(db.Model):
    __tablename__ = 'challenges'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True)
    description = db.Column(db.Text, nullable=True)
    xp = db.Column(db.Integer, nullable=False, default=50)
    difficulty = db.Column(db.String(20), nullable=False, default='Easy')  # Easy, Medium, Hard
    evidence_required = db.Column(db.Boolean, nullable=False, default=True)
    deadline = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='Draft')  # Draft, Active, Under Review, Completed, Archived
    created_by = db.Column(db.String(64), db.ForeignKey('user_profiles.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = db.relationship('Category', foreign_keys=[category_id])
    creator = db.relationship('UserProfile', foreign_keys=[created_by])

    def __init__(self, title=None, category_id=None, description=None, xp=50,
                 difficulty='Easy', evidence_required=True, deadline=None,
                 status='Draft', created_by=None, **kwargs):
        super().__init__(**kwargs)
        if title is not None:
            self.title = title
        self.category_id = category_id
        if description is not None:
            self.description = description
        if xp is not None:
            self.xp = xp
        if difficulty is not None:
            self.difficulty = difficulty
        self.evidence_required = evidence_required
        self.deadline = deadline
        if status is not None:
            self.status = status
        self.created_by = created_by

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'description': self.description or '',
            'xp': self.xp,
            'difficulty': self.difficulty,
            'evidence_required': self.evidence_required,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'status': self.status,
            'created_by': self.created_by,
            'creator_name': self.creator.full_name if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class ChallengeParticipation(db.Model):
    __tablename__ = 'challenge_participations'

    id = db.Column(db.Integer, primary_key=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey('challenges.id'), nullable=False)
    user_id = db.Column(db.String(64), db.ForeignKey('user_profiles.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='Joined')  # Joined, Submitted, Approved, Rejected
    proof_url = db.Column(db.String(500), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    xp_awarded = db.Column(db.Integer, nullable=False, default=0)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_at = db.Column(db.DateTime, nullable=True)

    challenge = db.relationship('Challenge', foreign_keys=[challenge_id], backref='participations')
    user = db.relationship('UserProfile', foreign_keys=[user_id])

    def __init__(self, challenge_id=None, user_id=None, status='Joined',
                 proof_url=None, notes=None, xp_awarded=0, **kwargs):
        super().__init__(**kwargs)
        if challenge_id is not None:
            self.challenge_id = challenge_id
        if user_id is not None:
            self.user_id = user_id
        if status is not None:
            self.status = status
        self.proof_url = proof_url
        self.notes = notes
        self.xp_awarded = xp_awarded

    def to_dict(self):
        return {
            'id': self.id,
            'challenge_id': self.challenge_id,
            'challenge_title': self.challenge.title if self.challenge else None,
            'challenge_xp': self.challenge.xp if self.challenge else 0,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else 'Unknown',
            'user_email': self.user.email if self.user else '',
            'status': self.status,
            'proof_url': self.proof_url or '',
            'notes': self.notes or '',
            'xp_awarded': self.xp_awarded,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
        }


class Badge(db.Model):
    __tablename__ = 'badges'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)
    # unlock_rule_type: 'total_points' uses lifetime_points_earned, 'completed_challenges', 'completed_csr'
    unlock_rule_type = db.Column(db.String(50), nullable=False, default='total_points')
    unlock_rule_value = db.Column(db.Integer, nullable=False, default=100)
    icon = db.Column(db.String(100), nullable=True)  # emoji or lucide icon name
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, name=None, description=None, unlock_rule_type='total_points',
                 unlock_rule_value=100, icon=None, **kwargs):
        super().__init__(**kwargs)
        if name is not None:
            self.name = name
        if description is not None:
            self.description = description
        if unlock_rule_type is not None:
            self.unlock_rule_type = unlock_rule_type
        if unlock_rule_value is not None:
            self.unlock_rule_value = unlock_rule_value
        self.icon = icon

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description or '',
            'unlock_rule_type': self.unlock_rule_type,
            'unlock_rule_value': self.unlock_rule_value,
            'icon': self.icon or '🏅',
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class UserBadge(db.Model):
    __tablename__ = 'user_badges'
    __table_args__ = (db.UniqueConstraint('user_id', 'badge_id', name='uq_user_badge'),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(64), db.ForeignKey('user_profiles.id'), nullable=False)
    badge_id = db.Column(db.Integer, db.ForeignKey('badges.id'), nullable=False)
    awarded_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('UserProfile', foreign_keys=[user_id])
    badge = db.relationship('Badge', foreign_keys=[badge_id])

    def __init__(self, user_id=None, badge_id=None, **kwargs):
        super().__init__(**kwargs)
        if user_id is not None:
            self.user_id = user_id
        if badge_id is not None:
            self.badge_id = badge_id

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else 'Unknown',
            'badge_id': self.badge_id,
            'badge_name': self.badge.name if self.badge else None,
            'badge_description': self.badge.description if self.badge else '',
            'badge_icon': self.badge.icon if self.badge else '🏅',
            'unlock_rule_type': self.badge.unlock_rule_type if self.badge else None,
            'unlock_rule_value': self.badge.unlock_rule_value if self.badge else None,
            'awarded_at': self.awarded_at.isoformat() if self.awarded_at else None,
        }


class Reward(db.Model):
    __tablename__ = 'rewards'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    points_required = db.Column(db.Integer, nullable=False, default=100)
    stock = db.Column(db.Integer, nullable=False, default=10)
    status = db.Column(db.String(20), nullable=False, default='Active')  # Active, Inactive
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, name=None, description=None, points_required=100,
                 stock=10, status='Active', **kwargs):
        super().__init__(**kwargs)
        if name is not None:
            self.name = name
        if description is not None:
            self.description = description
        if points_required is not None:
            self.points_required = points_required
        if stock is not None:
            self.stock = stock
        if status is not None:
            self.status = status

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description or '',
            'points_required': self.points_required,
            'stock': self.stock,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class RewardRedemption(db.Model):
    __tablename__ = 'reward_redemptions'

    id = db.Column(db.Integer, primary_key=True)
    reward_id = db.Column(db.Integer, db.ForeignKey('rewards.id'), nullable=False)
    user_id = db.Column(db.String(64), db.ForeignKey('user_profiles.id'), nullable=False)
    points_spent = db.Column(db.Integer, nullable=False, default=0)
    status = db.Column(db.String(20), nullable=False, default='Redeemed')  # Redeemed, Fulfilled
    redeemed_at = db.Column(db.DateTime, default=datetime.utcnow)

    reward = db.relationship('Reward', foreign_keys=[reward_id])
    user = db.relationship('UserProfile', foreign_keys=[user_id])

    def __init__(self, reward_id=None, user_id=None, points_spent=0, status='Redeemed', **kwargs):
        super().__init__(**kwargs)
        if reward_id is not None:
            self.reward_id = reward_id
        if user_id is not None:
            self.user_id = user_id
        if points_spent is not None:
            self.points_spent = points_spent
        if status is not None:
            self.status = status

    def to_dict(self):
        return {
            'id': self.id,
            'reward_id': self.reward_id,
            'reward_name': self.reward.name if self.reward else None,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else 'Unknown',
            'points_spent': self.points_spent,
            'status': self.status,
            'redeemed_at': self.redeemed_at.isoformat() if self.redeemed_at else None,
        }


# ─── Phase 6 Notifications & Settings Models ──────────────────────────────────

class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(64), db.ForeignKey('user_profiles.id'), nullable=False)
    title = db.Column(db.String(250), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), nullable=False, default='General')  # Compliance, CSR, Challenge, Policy, Badge, System
    is_read = db.Column(db.Boolean, nullable=False, default=False)
    link = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('UserProfile', foreign_keys=[user_id])

    def __init__(self, user_id=None, title=None, message=None, type='General', is_read=False, link=None, **kwargs):
        super().__init__(**kwargs)
        if user_id is not None:
            self.user_id = user_id
        if title is not None:
            self.title = title
        if message is not None:
            self.message = message
        if type is not None:
            self.type = type
        self.is_read = is_read
        if link is not None:
            self.link = link

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'is_read': self.is_read,
            'link': self.link or '',
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class NotificationPref(db.Model):
    __tablename__ = 'notification_prefs'

    id = db.Column(db.Integer, primary_key=True)
    event_type = db.Column(db.String(50), unique=True, nullable=False)  # compliance_issue, csr_decision, policy_reminder, badge_unlock
    in_app_enabled = db.Column(db.Boolean, nullable=False, default=True)
    email_enabled = db.Column(db.Boolean, nullable=False, default=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, event_type=None, in_app_enabled=True, email_enabled=False, **kwargs):
        super().__init__(**kwargs)
        if event_type is not None:
            self.event_type = event_type
        self.in_app_enabled = in_app_enabled
        self.email_enabled = email_enabled

    def to_dict(self):
        return {
            'id': self.id,
            'event_type': self.event_type,
            'in_app_enabled': self.in_app_enabled,
            'email_enabled': self.email_enabled,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

