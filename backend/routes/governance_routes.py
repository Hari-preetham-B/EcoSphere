from datetime import datetime, date as date_type
from flask import Blueprint, jsonify, request, g
from database import db
from models import ESGPolicy, PolicyAcknowledgement, Audit, ComplianceIssue, Department, UserProfile
from auth import token_required, require_role

governance_bp = Blueprint('governance', __name__)


def seed_governance_data():
    try:
        dept = Department.query.first()
        if not dept:
            dept = Department(name='Sustainability & Operations', code='SO-01', head='Jane Doe', status='Active')
            db.session.add(dept)
            db.session.commit()
        dept_id = dept.id

        admin_user = UserProfile.query.filter_by(role='Admin').first() or UserProfile.query.first()
        if not admin_user:
            admin_user = UserProfile(id='system-admin-uuid', email='admin@ecosphere.com', full_name='Admin User', role='Admin')
            db.session.add(admin_user)
            db.session.commit()
        admin_id = admin_user.id

        if ESGPolicy.query.count() == 0:
            p1 = ESGPolicy(
                title='Code of Conduct & Corporate Integrity',
                description='Mandatory ethical guidelines for all employees regarding anti-bribery, conflict of interest, and workplace equality.',
                category='Ethics & Compliance',
                version='1.2',
                status='Active',
                department_id=None,
                effective_date=date_type(2026, 1, 15),
                created_by=admin_id
            )
            p2 = ESGPolicy(
                title='Data Privacy & Information Security Policy (ISO 27001)',
                description='Protocols for handling employee, customer, and environmental monitoring data securely.',
                category='Data Privacy',
                version='2.0',
                status='Active',
                department_id=None,
                effective_date=date_type(2026, 2, 1),
                created_by=admin_id
            )
            p3 = ESGPolicy(
                title='Departmental Environmental Waste & Emissions Protocol',
                description='Specific waste handling, emissions monitoring, and hazardous materials disposal rules.',
                category='Environmental Governance',
                version='1.0',
                status='Active',
                department_id=dept_id,
                effective_date=date_type(2026, 3, 10),
                created_by=admin_id
            )
            db.session.add_all([p1, p2, p3])
            db.session.commit()

            ack1 = PolicyAcknowledgement(policy_id=p1.id, user_id=admin_id, status='Acknowledged', acknowledged_at=datetime.utcnow())
            db.session.add(ack1)
            db.session.commit()

        # Seed sample Audit if none exists
        if Audit.query.count() == 0:
            audit1 = Audit(
                title='Q2 Departmental Environmental & Safety Audit',
                department_id=dept_id,
                auditor_name='Global Sustainability Assurance Ltd',
                audit_date=date_type(2026, 5, 20),
                scope='Facility energy emissions, waste classification logs, and safety protocols.',
                findings_summary='Overall compliance is satisfactory. Identified 2 non-conformances requiring urgent corrective action.',
                status='Completed',
                created_by=admin_id
            )
            db.session.add(audit1)
            db.session.commit()

        # Seed sample Compliance Issues if none exist
        if ComplianceIssue.query.count() == 0:
            audit1 = Audit.query.first()
            if audit1:
                issue1 = ComplianceIssue(
                    audit_id=audit1.id,
                    severity='High',
                    description='Hazardous chemical storage log missing weekly manager sign-off.',
                    owner_id=admin_id,
                    due_date=date_type(2026, 6, 15),  # OVERDUE relative to July 2026
                    status='Open',
                    resolution_notes=''
                )
                issue2 = ComplianceIssue(
                    audit_id=audit1.id,
                    severity='Medium',
                    description='Calibrate secondary Scope 1 emission meter sensors in main plant.',
                    owner_id=admin_id,
                    due_date=date_type(2026, 8, 30),
                    status='In Progress',
                    resolution_notes='Sensor vendor dispatched.'
                )
                db.session.add_all([issue1, issue2])
                db.session.commit()

        print("Default Governance seed data populated.")
    except Exception as e:
        db.session.rollback()
        print(f"Error seeding governance data: {e}")



# ─── Governance Dashboard API ──────────────────────────────────────────────

@governance_bp.route('/dashboard', methods=['GET'])
@token_required
def get_governance_dashboard():
    # 1. Active policies count & total policies count
    total_policies = ESGPolicy.query.count()
    active_policies = ESGPolicy.query.filter_by(status='Active').count()

    # 2. Overall Policy Acknowledgement Rate
    total_users = UserProfile.query.count()
    total_expected_acks = (active_policies * total_users) if total_users > 0 else 0
    total_actual_acks = PolicyAcknowledgement.query.filter_by(status='Acknowledged').count()
    ack_rate = round((total_actual_acks / total_expected_acks * 100), 1) if total_expected_acks > 0 else 100.0

    # 3. Audits summary
    total_audits = Audit.query.count()
    completed_audits = Audit.query.filter_by(status='Completed').count()

    # 4. Compliance Issues & Overdue Open Issues
    total_issues = ComplianceIssue.query.count()
    all_issues = ComplianceIssue.query.all()
    overdue_issues = [issue.to_dict() for issue in all_issues if issue.is_overdue]

    open_issues_count = ComplianceIssue.query.filter(ComplianceIssue.status.in_(['Open', 'In Progress'])).count()

    # Department breakdown
    departments = Department.query.all()
    dept_stats = []
    for dept in departments:
        dept_audits = Audit.query.filter_by(department_id=dept.id).count()
        dept_issues = [issue for issue in all_issues if issue.audit and issue.audit.department_id == dept.id]
        dept_overdue = sum(1 for issue in dept_issues if issue.is_overdue)
        dept_stats.append({
            'department_id': dept.id,
            'department_name': dept.name,
            'audits_count': dept_audits,
            'issues_count': len(dept_issues),
            'overdue_issues_count': dept_overdue
        })

    return jsonify({
        'total_policies': total_policies,
        'active_policies': active_policies,
        'acknowledgement_rate_pct': ack_rate,
        'total_audits': total_audits,
        'completed_audits': completed_audits,
        'total_issues': total_issues,
        'open_issues_count': open_issues_count,
        'overdue_issues_count': len(overdue_issues),
        'overdue_issues_list': overdue_issues,
        'department_stats': dept_stats
    }), 200


# ─── ESG Policies API ──────────────────────────────────────────────────────

@governance_bp.route('/policies', methods=['GET'])
@token_required
def get_policies():
    dept_id = request.args.get('department_id')
    status = request.args.get('status')

    query = ESGPolicy.query
    if dept_id:
        # Show specific department OR company-wide policies
        query = query.filter((ESGPolicy.department_id == int(dept_id)) | (ESGPolicy.department_id.is_(None)))
    if status:
        query = query.filter(ESGPolicy.status == status)

    policies = query.order_by(ESGPolicy.effective_date.desc()).all()
    total_users_count = UserProfile.query.count()

    result = []
    for pol in policies:
        # Count acknowledgements
        acks = PolicyAcknowledgement.query.filter_by(policy_id=pol.id, status='Acknowledged').count()
        p_dict = pol.to_dict()
        p_dict['ack_count'] = acks
        p_dict['total_users'] = total_users_count
        p_dict['user_acknowledged'] = PolicyAcknowledgement.query.filter_by(
            policy_id=pol.id, user_id=g.current_user.id, status='Acknowledged'
        ).first() is not None
        result.append(p_dict)

    return jsonify(result), 200


@governance_bp.route('/policies/<int:policy_id>', methods=['GET'])
@token_required
def get_policy(policy_id):
    pol = ESGPolicy.query.get(policy_id)
    if not pol:
        return jsonify({'error': 'ESG Policy not found'}), 404

    acks = PolicyAcknowledgement.query.filter_by(policy_id=pol.id, status='Acknowledged').count()
    total_users_count = UserProfile.query.count()

    res = pol.to_dict()
    res['ack_count'] = acks
    res['total_users'] = total_users_count
    res['user_acknowledged'] = PolicyAcknowledgement.query.filter_by(
        policy_id=pol.id, user_id=g.current_user.id, status='Acknowledged'
    ).first() is not None

    return jsonify(res), 200


@governance_bp.route('/policies', methods=['POST'])
@token_required
@require_role('Admin', 'ESG Manager')
def create_policy():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    if not title:
        return jsonify({'error': 'Title is required'}), 400

    dept_id = data.get('department_id')
    if dept_id:
        dept = Department.query.get(dept_id)
        if not dept:
            return jsonify({'error': 'Department not found'}), 404

    eff_date = data.get('effective_date')
    parsed_date = date_type.fromisoformat(eff_date) if eff_date else date_type.today()

    pol = ESGPolicy(
        title=title,
        description=data.get('description', '').strip(),
        category=data.get('category', 'General Governance').strip(),
        version=data.get('version', '1.0').strip(),
        status=data.get('status', 'Active'),
        department_id=int(dept_id) if dept_id else None,
        effective_date=parsed_date,
        created_by=g.current_user.id
    )

    db.session.add(pol)
    db.session.commit()
    return jsonify(pol.to_dict()), 201


@governance_bp.route('/policies/<int:policy_id>', methods=['PUT'])
@token_required
@require_role('Admin', 'ESG Manager')
def update_policy(policy_id):
    pol = ESGPolicy.query.get(policy_id)
    if not pol:
        return jsonify({'error': 'ESG Policy not found'}), 404

    data = request.get_json() or {}
    if 'title' in data and data['title']:
        pol.title = data['title'].strip()
    if 'description' in data:
        pol.description = data['description'].strip()
    if 'category' in data:
        pol.category = data['category'].strip()
    if 'version' in data:
        pol.version = data['version'].strip()
    if 'status' in data:
        pol.status = data['status']
    if 'department_id' in data:
        pol.department_id = int(data['department_id']) if data['department_id'] else None
    if 'effective_date' in data and data['effective_date']:
        pol.effective_date = date_type.fromisoformat(data['effective_date'])

    db.session.commit()
    return jsonify(pol.to_dict()), 200


@governance_bp.route('/policies/<int:policy_id>', methods=['DELETE'])
@token_required
@require_role('Admin', 'ESG Manager')
def delete_policy(policy_id):
    pol = ESGPolicy.query.get(policy_id)
    if not pol:
        return jsonify({'error': 'ESG Policy not found'}), 404

    db.session.delete(pol)
    db.session.commit()
    return jsonify({'message': 'Policy deleted successfully', 'id': policy_id}), 200


# ─── Policy Acknowledgements & Reminders API ─────────────────────────────────

@governance_bp.route('/policies/<int:policy_id>/acknowledge', methods=['POST'])
@token_required
def acknowledge_policy(policy_id):
    pol = ESGPolicy.query.get(policy_id)
    if not pol:
        return jsonify({'error': 'ESG Policy not found'}), 404

    existing = PolicyAcknowledgement.query.filter_by(policy_id=policy_id, user_id=g.current_user.id).first()
    if existing:
        existing.status = 'Acknowledged'
        existing.acknowledged_at = datetime.utcnow()
        db.session.commit()
        return jsonify(existing.to_dict()), 200

    ack = PolicyAcknowledgement(
        policy_id=policy_id,
        user_id=g.current_user.id,
        status='Acknowledged',
        acknowledged_at=datetime.utcnow()
    )
    db.session.add(ack)
    db.session.commit()
    return jsonify(ack.to_dict()), 201


@governance_bp.route('/policies/<int:policy_id>/acknowledgements', methods=['GET'])
@token_required
def get_policy_acknowledgements(policy_id):
    pol = ESGPolicy.query.get(policy_id)
    if not pol:
        return jsonify({'error': 'ESG Policy not found'}), 404

    users = UserProfile.query.all()
    acks = {ack.user_id: ack for ack in PolicyAcknowledgement.query.filter_by(policy_id=policy_id).all()}

    user_status_list = []
    for user in users:
        ack_record = acks.get(user.id)
        user_status_list.append({
            'user_id': user.id,
            'user_name': user.full_name or 'Unknown',
            'user_email': user.email,
            'role': user.role,
            'status': ack_record.status if ack_record else 'Pending',
            'acknowledged_at': ack_record.acknowledged_at.isoformat() if (ack_record and ack_record.acknowledged_at) else None,
            'reminder_sent_at': ack_record.reminder_sent_at.isoformat() if (ack_record and ack_record.reminder_sent_at) else None
        })

    return jsonify({
        'policy_id': pol.id,
        'policy_title': pol.title,
        'total_employees': len(users),
        'acknowledged_count': sum(1 for u in user_status_list if u['status'] == 'Acknowledged'),
        'pending_count': sum(1 for u in user_status_list if u['status'] == 'Pending'),
        'acknowledgements': user_status_list
    }), 200


@governance_bp.route('/policies/<int:policy_id>/remind', methods=['POST'])
@token_required
@require_role('Admin', 'ESG Manager')
def remind_policy_acknowledgement(policy_id):
    """
    STUB ONLY: Logs reminder_sent_at for pending users and returns success response.
    Does NOT send actual emails or external notifications.
    """
    pol = ESGPolicy.query.get(policy_id)
    if not pol:
        return jsonify({'error': 'ESG Policy not found'}), 404

    users = UserProfile.query.all()
    existing_acks = {ack.user_id: ack for ack in PolicyAcknowledgement.query.filter_by(policy_id=policy_id).all()}

    now = datetime.utcnow()
    reminded_count = 0

    for user in users:
        ack = existing_acks.get(user.id)
        if not ack:
            # Create a pending acknowledgement record with reminder timestamp logged
            new_ack = PolicyAcknowledgement(
                policy_id=policy_id,
                user_id=user.id,
                status='Pending',
                reminder_sent_at=now
            )
            db.session.add(new_ack)
            reminded_count += 1
        elif ack.status == 'Pending':
            ack.reminder_sent_at = now
            reminded_count += 1

    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': f'Reminder notifications logged for {reminded_count} employees pending policy acknowledgement.',
        'policy_id': policy_id,
        'reminded_count': reminded_count,
        'timestamp': now.isoformat()
    }), 200


# ─── Audits API ─────────────────────────────────────────────────────────────

@governance_bp.route('/audits', methods=['GET'])
@token_required
def get_audits():
    dept_id = request.args.get('department_id')
    status = request.args.get('status')

    query = Audit.query
    if dept_id:
        query = query.filter(Audit.department_id == int(dept_id))
    if status:
        query = query.filter(Audit.status == status)

    audits = query.order_by(Audit.audit_date.desc()).all()
    return jsonify([a.to_dict() for a in audits]), 200


@governance_bp.route('/audits/<int:audit_id>', methods=['GET'])
@token_required
def get_audit(audit_id):
    audit = Audit.query.get(audit_id)
    if not audit:
        return jsonify({'error': 'Audit record not found'}), 404
    return jsonify(audit.to_dict()), 200


@governance_bp.route('/audits', methods=['POST'])
@token_required
@require_role('Admin', 'ESG Manager')
def create_audit():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    auditor_name = data.get('auditor_name', '').strip()
    dept_id = data.get('department_id')
    audit_date_str = data.get('audit_date')

    if not title or not auditor_name or not dept_id or not audit_date_str:
        return jsonify({'error': 'title, auditor_name, department_id, and audit_date are required'}), 400

    dept = Department.query.get(dept_id)
    if not dept:
        return jsonify({'error': 'Department not found'}), 404

    audit = Audit(
        title=title,
        department_id=int(dept_id),
        auditor_name=auditor_name,
        audit_date=date_type.fromisoformat(audit_date_str),
        scope=data.get('scope', '').strip(),
        findings_summary=data.get('findings_summary', '').strip(),
        status=data.get('status', 'Completed'),
        created_by=g.current_user.id
    )

    db.session.add(audit)
    db.session.commit()
    return jsonify(audit.to_dict()), 201


@governance_bp.route('/audits/<int:audit_id>', methods=['PUT'])
@token_required
@require_role('Admin', 'ESG Manager')
def update_audit(audit_id):
    audit = Audit.query.get(audit_id)
    if not audit:
        return jsonify({'error': 'Audit record not found'}), 404

    data = request.get_json() or {}
    if 'title' in data and data['title']:
        audit.title = data['title'].strip()
    if 'auditor_name' in data and data['auditor_name']:
        audit.auditor_name = data['auditor_name'].strip()
    if 'department_id' in data and data['department_id']:
        audit.department_id = int(data['department_id'])
    if 'audit_date' in data and data['audit_date']:
        audit.audit_date = date_type.fromisoformat(data['audit_date'])
    if 'scope' in data:
        audit.scope = data['scope'].strip()
    if 'findings_summary' in data:
        audit.findings_summary = data['findings_summary'].strip()
    if 'status' in data:
        audit.status = data['status']

    db.session.commit()
    return jsonify(audit.to_dict()), 200


@governance_bp.route('/audits/<int:audit_id>', methods=['DELETE'])
@token_required
@require_role('Admin', 'ESG Manager')
def delete_audit(audit_id):
    audit = Audit.query.get(audit_id)
    if not audit:
        return jsonify({'error': 'Audit record not found'}), 404

    db.session.delete(audit)
    db.session.commit()
    return jsonify({'message': 'Audit deleted successfully', 'id': audit_id}), 200


# ─── Compliance Issues API ─────────────────────────────────────────────────

@governance_bp.route('/issues', methods=['GET'])
@token_required
def get_compliance_issues():
    audit_id = request.args.get('audit_id')
    severity = request.args.get('severity')
    status = request.args.get('status')
    overdue_only = request.args.get('overdue_only', '').lower() == 'true'

    query = ComplianceIssue.query
    if audit_id:
        query = query.filter(ComplianceIssue.audit_id == int(audit_id))
    if severity:
        query = query.filter(ComplianceIssue.severity == severity)
    if status:
        query = query.filter(ComplianceIssue.status == status)

    issues = query.order_by(ComplianceIssue.due_date.asc()).all()

    result = [i.to_dict() for i in issues]
    if overdue_only:
        result = [i for i in result if i['is_overdue']]

    return jsonify(result), 200


@governance_bp.route('/issues/<int:issue_id>', methods=['GET'])
@token_required
def get_compliance_issue(issue_id):
    issue = ComplianceIssue.query.get(issue_id)
    if not issue:
        return jsonify({'error': 'Compliance Issue not found'}), 404
    return jsonify(issue.to_dict()), 200


@governance_bp.route('/issues', methods=['POST'])
@token_required
@require_role('Admin', 'ESG Manager')
def create_compliance_issue():
    data = request.get_json() or {}
    audit_id = data.get('audit_id')
    severity = data.get('severity')
    description = data.get('description', '').strip()
    owner_id = data.get('owner_id')
    due_date_str = data.get('due_date')

    if not audit_id or not severity or not description or not owner_id or not due_date_str:
        return jsonify({'error': 'audit_id, severity, description, owner_id, and due_date are required'}), 400

    audit = Audit.query.get(audit_id)
    if not audit:
        return jsonify({'error': 'Audit not found'}), 404

    owner = UserProfile.query.get(owner_id)
    if not owner:
        return jsonify({'error': 'Assigned owner user profile not found'}), 404

    issue = ComplianceIssue(
        audit_id=int(audit_id),
        severity=severity,
        description=description,
        owner_id=owner_id,
        due_date=date_type.fromisoformat(due_date_str),
        status=data.get('status', 'Open'),
        resolution_notes=data.get('resolution_notes', '').strip()
    )

    db.session.add(issue)
    db.session.commit()
    return jsonify(issue.to_dict()), 201


@governance_bp.route('/issues/<int:issue_id>', methods=['PUT'])
@token_required
@require_role('Admin', 'ESG Manager')
def update_compliance_issue(issue_id):
    issue = ComplianceIssue.query.get(issue_id)
    if not issue:
        return jsonify({'error': 'Compliance Issue not found'}), 404

    data = request.get_json() or {}
    if 'severity' in data and data['severity']:
        issue.severity = data['severity']
    if 'description' in data and data['description']:
        issue.description = data['description'].strip()
    if 'owner_id' in data and data['owner_id']:
        owner = UserProfile.query.get(data['owner_id'])
        if not owner:
            return jsonify({'error': 'Assigned owner user profile not found'}), 404
        issue.owner_id = data['owner_id']
    if 'due_date' in data and data['due_date']:
        issue.due_date = date_type.fromisoformat(data['due_date'])
    if 'status' in data:
        issue.status = data['status']
    if 'resolution_notes' in data:
        issue.resolution_notes = data['resolution_notes'].strip()

    db.session.commit()
    return jsonify(issue.to_dict()), 200


@governance_bp.route('/issues/<int:issue_id>', methods=['DELETE'])
@token_required
@require_role('Admin', 'ESG Manager')
def delete_compliance_issue(issue_id):
    issue = ComplianceIssue.query.get(issue_id)
    if not issue:
        return jsonify({'error': 'Compliance Issue not found'}), 404

    db.session.delete(issue)
    db.session.commit()
    return jsonify({'message': 'Compliance Issue deleted', 'id': issue_id}), 200
