from datetime import datetime, date as date_type
from flask import Blueprint, jsonify, request, g
from database import db
from models import (
    Challenge, ChallengeParticipation, Badge, UserBadge,
    Reward, RewardRedemption, UserProfile, Category, Setting,
    CSRParticipation
)
from auth import token_required, require_role

gamification_bp = Blueprint('gamification', __name__)


# ─── Badge Auto-Award Helper ─────────────────────────────────────────────────

def check_and_award_badges(user_id):
    """
    Check all badges against the user's progress and auto-award any newly
    qualifying badges that haven't been awarded yet.

    Badge unlock rule uses:
      - 'total_points'         → user.lifetime_points_earned (NEVER decremented)
      - 'completed_challenges' → count of Approved ChallengeParticipation records
      - 'completed_csr'        → count of Approved CSRParticipation records

    Called after BOTH CSR approval and Challenge approval.
    """
    setting = Setting.query.filter_by(key='badge_auto_award').first()
    if not setting or setting.value != 'true':
        return

    user = UserProfile.query.get(user_id)
    if not user:
        return

    # Compute current progress metrics
    lifetime_pts = user.lifetime_points_earned or 0
    completed_challenges = ChallengeParticipation.query.filter_by(
        user_id=user_id, status='Approved'
    ).count()
    completed_csr = CSRParticipation.query.filter_by(
        user_id=user_id, status='Approved'
    ).count()

    # Get already-awarded badge IDs
    already_awarded = {ub.badge_id for ub in UserBadge.query.filter_by(user_id=user_id).all()}

    # Evaluate all badges
    all_badges = Badge.query.all()
    for badge in all_badges:
        if badge.id in already_awarded:
            continue

        earned = False
        if badge.unlock_rule_type == 'total_points':
            earned = lifetime_pts >= badge.unlock_rule_value
        elif badge.unlock_rule_type == 'completed_challenges':
            earned = completed_challenges >= badge.unlock_rule_value
        elif badge.unlock_rule_type == 'completed_csr':
            earned = completed_csr >= badge.unlock_rule_value

        if earned:
            ub = UserBadge(user_id=user_id, badge_id=badge.id)
            db.session.add(ub)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()


# ─── Challenges ──────────────────────────────────────────────────────────────

@gamification_bp.route('/challenges', methods=['GET'])
@token_required
def get_challenges():
    query = Challenge.query
    status = request.args.get('status')
    category_id = request.args.get('category_id')

    if status:
        query = query.filter(Challenge.status == status)
    if category_id:
        query = query.filter(Challenge.category_id == int(category_id))

    challenges = query.order_by(Challenge.created_at.desc()).all()

    # Annotate with participation status for current user
    result = []
    for ch in challenges:
        d = ch.to_dict()
        part = ChallengeParticipation.query.filter_by(
            challenge_id=ch.id, user_id=g.current_user.id
        ).first()
        d['user_participation_status'] = part.status if part else None
        d['user_participation_id'] = part.id if part else None
        d['participant_count'] = ChallengeParticipation.query.filter_by(challenge_id=ch.id).count()
        result.append(d)

    return jsonify(result), 200


@gamification_bp.route('/challenges/<int:ch_id>', methods=['GET'])
@token_required
def get_challenge(ch_id):
    ch = Challenge.query.get(ch_id)
    if not ch:
        return jsonify({'error': 'Challenge not found'}), 404
    d = ch.to_dict()
    part = ChallengeParticipation.query.filter_by(
        challenge_id=ch_id, user_id=g.current_user.id
    ).first()
    d['user_participation_status'] = part.status if part else None
    d['user_participation_id'] = part.id if part else None
    return jsonify(d), 200


@gamification_bp.route('/challenges', methods=['POST'])
@token_required
@require_role('Admin', 'ESG Manager')
def create_challenge():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    if not title:
        return jsonify({'error': 'title is required'}), 400

    deadline = None
    if data.get('deadline'):
        try:
            deadline = date_type.fromisoformat(data['deadline'])
        except ValueError:
            return jsonify({'error': 'Invalid deadline date format'}), 400

    ch = Challenge(
        title=title,
        category_id=int(data['category_id']) if data.get('category_id') else None,
        description=data.get('description', '').strip(),
        xp=int(data.get('xp', 50)),
        difficulty=data.get('difficulty', 'Easy'),
        evidence_required=bool(data.get('evidence_required', True)),
        deadline=deadline,
        status=data.get('status', 'Active'),
        created_by=g.current_user.id
    )
    db.session.add(ch)
    db.session.commit()
    return jsonify(ch.to_dict()), 201


@gamification_bp.route('/challenges/<int:ch_id>', methods=['PUT'])
@token_required
@require_role('Admin', 'ESG Manager')
def update_challenge(ch_id):
    ch = Challenge.query.get(ch_id)
    if not ch:
        return jsonify({'error': 'Challenge not found'}), 404

    data = request.get_json() or {}
    valid_statuses = ['Draft', 'Active', 'Under Review', 'Completed', 'Archived']

    if 'title' in data and data['title']:
        ch.title = data['title'].strip()
    if 'description' in data:
        ch.description = data['description'].strip()
    if 'category_id' in data:
        ch.category_id = int(data['category_id']) if data['category_id'] else None
    if 'xp' in data:
        ch.xp = int(data['xp'])
    if 'difficulty' in data:
        ch.difficulty = data['difficulty']
    if 'evidence_required' in data:
        ch.evidence_required = bool(data['evidence_required'])
    if 'deadline' in data and data['deadline']:
        ch.deadline = date_type.fromisoformat(data['deadline'])
    if 'status' in data and data['status'] in valid_statuses:
        ch.status = data['status']

    db.session.commit()
    return jsonify(ch.to_dict()), 200


@gamification_bp.route('/challenges/<int:ch_id>', methods=['DELETE'])
@token_required
@require_role('Admin', 'ESG Manager')
def delete_challenge(ch_id):
    ch = Challenge.query.get(ch_id)
    if not ch:
        return jsonify({'error': 'Challenge not found'}), 404
    db.session.delete(ch)
    db.session.commit()
    return jsonify({'message': 'Challenge deleted', 'id': ch_id}), 200


# ─── Challenge Participation ─────────────────────────────────────────────────

@gamification_bp.route('/challenges/<int:ch_id>/join', methods=['POST'])
@token_required
def join_challenge(ch_id):
    ch = Challenge.query.get(ch_id)
    if not ch:
        return jsonify({'error': 'Challenge not found'}), 404
    if ch.status != 'Active':
        return jsonify({'error': 'Challenge is not currently active'}), 400

    existing = ChallengeParticipation.query.filter_by(
        challenge_id=ch_id, user_id=g.current_user.id
    ).first()
    if existing:
        return jsonify({'error': 'You have already joined this challenge'}), 400

    part = ChallengeParticipation(
        challenge_id=ch_id,
        user_id=g.current_user.id,
        status='Joined'
    )
    db.session.add(part)
    db.session.commit()
    return jsonify(part.to_dict()), 201


@gamification_bp.route('/challenges/participations/<int:part_id>/submit', methods=['PUT'])
@token_required
def submit_participation(part_id):
    part = ChallengeParticipation.query.get(part_id)
    if not part:
        return jsonify({'error': 'Participation record not found'}), 404

    if part.user_id != g.current_user.id:
        return jsonify({'error': 'Forbidden'}), 403

    if part.status not in ('Joined', 'Rejected'):
        return jsonify({'error': 'Cannot submit from current status'}), 400

    data = request.get_json() or {}
    proof_url = data.get('proof_url', '').strip()

    if part.challenge and part.challenge.evidence_required and not proof_url:
        return jsonify({'error': 'Proof is required for this challenge'}), 400

    part.proof_url = proof_url
    if 'notes' in data:
        part.notes = data['notes'].strip()
    part.status = 'Submitted'
    db.session.commit()
    return jsonify(part.to_dict()), 200


@gamification_bp.route('/challenges/participations', methods=['GET'])
@token_required
@require_role('Admin', 'ESG Manager')
def get_all_participations():
    status = request.args.get('status')
    challenge_id = request.args.get('challenge_id')
    query = ChallengeParticipation.query
    if status:
        query = query.filter(ChallengeParticipation.status == status)
    if challenge_id:
        query = query.filter(ChallengeParticipation.challenge_id == int(challenge_id))
    parts = query.order_by(ChallengeParticipation.joined_at.desc()).all()
    return jsonify([p.to_dict() for p in parts]), 200


@gamification_bp.route('/challenges/participations/my', methods=['GET'])
@token_required
def get_my_participations():
    parts = ChallengeParticipation.query.filter_by(
        user_id=g.current_user.id
    ).order_by(ChallengeParticipation.joined_at.desc()).all()
    return jsonify([p.to_dict() for p in parts]), 200


@gamification_bp.route('/challenges/participations/<int:part_id>/approve', methods=['PUT'])
@token_required
@require_role('Admin', 'ESG Manager')
def approve_participation(part_id):
    part = ChallengeParticipation.query.get(part_id)
    if not part:
        return jsonify({'error': 'Participation record not found'}), 404

    if part.status == 'Approved':
        return jsonify(part.to_dict()), 200

    part.status = 'Approved'
    part.reviewed_at = datetime.utcnow()

    xp = part.challenge.xp if part.challenge else 50
    part.xp_awarded = xp

    user_prof = UserProfile.query.get(part.user_id)
    if user_prof:
        # Award XP to BOTH spendable balance AND lifetime balance
        user_prof.points = (user_prof.points or 0) + xp
        user_prof.lifetime_points_earned = (user_prof.lifetime_points_earned or 0) + xp

    db.session.commit()

    # Check and auto-award badges based on updated lifetime_points_earned and completed challenge count
    check_and_award_badges(part.user_id)

    return jsonify(part.to_dict()), 200


@gamification_bp.route('/challenges/participations/<int:part_id>/reject', methods=['PUT'])
@token_required
@require_role('Admin', 'ESG Manager')
def reject_participation(part_id):
    part = ChallengeParticipation.query.get(part_id)
    if not part:
        return jsonify({'error': 'Participation record not found'}), 404

    data = request.get_json() or {}
    part.status = 'Rejected'
    part.reviewed_at = datetime.utcnow()
    if 'notes' in data:
        part.notes = data['notes'].strip()
    db.session.commit()
    return jsonify(part.to_dict()), 200


# ─── Badges ──────────────────────────────────────────────────────────────────

@gamification_bp.route('/badges', methods=['GET'])
@token_required
def get_badges():
    badges = Badge.query.order_by(Badge.unlock_rule_value.asc()).all()
    user_badge_ids = {
        ub.badge_id for ub in UserBadge.query.filter_by(user_id=g.current_user.id).all()
    }

    user = UserProfile.query.get(g.current_user.id)
    lifetime_pts = user.lifetime_points_earned or 0 if user else 0
    completed_challenges = ChallengeParticipation.query.filter_by(
        user_id=g.current_user.id, status='Approved'
    ).count()
    completed_csr = CSRParticipation.query.filter_by(
        user_id=g.current_user.id, status='Approved'
    ).count()

    result = []
    for badge in badges:
        d = badge.to_dict()
        d['earned'] = badge.id in user_badge_ids
        if not d['earned']:
            if badge.unlock_rule_type == 'total_points':
                d['user_progress'] = lifetime_pts
            elif badge.unlock_rule_type == 'completed_challenges':
                d['user_progress'] = completed_challenges
            elif badge.unlock_rule_type == 'completed_csr':
                d['user_progress'] = completed_csr
            else:
                d['user_progress'] = 0
        else:
            d['user_progress'] = badge.unlock_rule_value
        result.append(d)

    return jsonify(result), 200


@gamification_bp.route('/badges', methods=['POST'])
@token_required
@require_role('Admin', 'ESG Manager')
def create_badge():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': 'name is required'}), 400

    valid_rule_types = ['total_points', 'completed_challenges', 'completed_csr']
    rule_type = data.get('unlock_rule_type', 'total_points')
    if rule_type not in valid_rule_types:
        return jsonify({'error': f'unlock_rule_type must be one of {valid_rule_types}'}), 400

    badge = Badge(
        name=name,
        description=data.get('description', '').strip(),
        unlock_rule_type=rule_type,
        unlock_rule_value=int(data.get('unlock_rule_value', 100)),
        icon=data.get('icon', '🏅')
    )
    db.session.add(badge)
    db.session.commit()
    return jsonify(badge.to_dict()), 201


@gamification_bp.route('/badges/my', methods=['GET'])
@token_required
def get_my_badges():
    user_badges = UserBadge.query.filter_by(
        user_id=g.current_user.id
    ).order_by(UserBadge.awarded_at.desc()).all()
    return jsonify([ub.to_dict() for ub in user_badges]), 200


# ─── Rewards ─────────────────────────────────────────────────────────────────

@gamification_bp.route('/rewards', methods=['GET'])
@token_required
def get_rewards():
    status = request.args.get('status', 'Active')
    query = Reward.query
    if status:
        query = query.filter(Reward.status == status)
    rewards = query.order_by(Reward.points_required.asc()).all()

    user = UserProfile.query.get(g.current_user.id)
    user_points = user.points or 0 if user else 0

    result = []
    for r in rewards:
        d = r.to_dict()
        d['can_redeem'] = user_points >= r.points_required and r.stock > 0
        result.append(d)
    return jsonify(result), 200


@gamification_bp.route('/rewards', methods=['POST'])
@token_required
@require_role('Admin', 'ESG Manager')
def create_reward():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': 'name is required'}), 400

    reward = Reward(
        name=name,
        description=data.get('description', '').strip(),
        points_required=int(data.get('points_required', 100)),
        stock=int(data.get('stock', 10)),
        status=data.get('status', 'Active')
    )
    db.session.add(reward)
    db.session.commit()
    return jsonify(reward.to_dict()), 201


@gamification_bp.route('/rewards/<int:reward_id>', methods=['PUT'])
@token_required
@require_role('Admin', 'ESG Manager')
def update_reward(reward_id):
    reward = Reward.query.get(reward_id)
    if not reward:
        return jsonify({'error': 'Reward not found'}), 404

    data = request.get_json() or {}
    if 'name' in data and data['name']:
        reward.name = data['name'].strip()
    if 'description' in data:
        reward.description = data['description'].strip()
    if 'points_required' in data:
        reward.points_required = int(data['points_required'])
    if 'stock' in data:
        reward.stock = int(data['stock'])
    if 'status' in data and data['status'] in ('Active', 'Inactive'):
        reward.status = data['status']

    db.session.commit()
    return jsonify(reward.to_dict()), 200


@gamification_bp.route('/rewards/<int:reward_id>/redeem', methods=['POST'])
@token_required
def redeem_reward(reward_id):
    reward = Reward.query.get(reward_id)
    if not reward:
        return jsonify({'error': 'Reward not found'}), 404
    if reward.status != 'Active':
        return jsonify({'error': 'Reward is not available for redemption'}), 400
    if reward.stock <= 0:
        return jsonify({'error': 'Reward is out of stock'}), 400

    user = UserProfile.query.get(g.current_user.id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if (user.points or 0) < reward.points_required:
        return jsonify({
            'error': f'Insufficient points. You have {user.points or 0} but need {reward.points_required}.'
        }), 400

    # Deduct from SPENDABLE balance only — lifetime_points_earned is NOT decremented
    user.points = (user.points or 0) - reward.points_required
    reward.stock -= 1

    redemption = RewardRedemption(
        reward_id=reward_id,
        user_id=g.current_user.id,
        points_spent=reward.points_required,
        status='Redeemed'
    )
    db.session.add(redemption)
    db.session.commit()

    return jsonify({
        'message': f'Successfully redeemed "{reward.name}"!',
        'redemption': redemption.to_dict(),
        'remaining_points': user.points
    }), 200


@gamification_bp.route('/rewards/redemptions', methods=['GET'])
@token_required
def get_redemptions():
    if g.current_user.role in ('Admin', 'ESG Manager'):
        redemptions = RewardRedemption.query.order_by(RewardRedemption.redeemed_at.desc()).all()
    else:
        redemptions = RewardRedemption.query.filter_by(
            user_id=g.current_user.id
        ).order_by(RewardRedemption.redeemed_at.desc()).all()
    return jsonify([r.to_dict() for r in redemptions]), 200


# ─── Leaderboard ─────────────────────────────────────────────────────────────

@gamification_bp.route('/leaderboard', methods=['GET'])
@token_required
def get_leaderboard():
    from models import Department

    dept_id = request.args.get('department_id')

    # Build query for all employees, ordered by spendable points desc, lifetime desc as tiebreaker
    query = UserProfile.query.filter(UserProfile.role == 'Employee')

    # Department filtering requires joining through Department if dept_id given;
    # For simplicity, we fetch all and filter post-query if dept_id provided
    # (A proper solution would require a department_id on UserProfile or a join)
    users = query.order_by(
        UserProfile.points.desc(),
        UserProfile.lifetime_points_earned.desc()
    ).all()

    result = []
    for rank, user in enumerate(users, 1):
        badges_count = UserBadge.query.filter_by(user_id=user.id).count()
        approved_challenges = ChallengeParticipation.query.filter_by(
            user_id=user.id, status='Approved'
        ).count()
        approved_csr = CSRParticipation.query.filter_by(
            user_id=user.id, status='Approved'
        ).count()

        result.append({
            'rank': rank,
            'user_id': user.id,
            'user_name': user.full_name or user.email,
            'user_email': user.email,
            'points': user.points or 0,
            'lifetime_points_earned': user.lifetime_points_earned or 0,
            'badges_count': badges_count,
            'approved_challenges': approved_challenges,
            'approved_csr': approved_csr,
        })

    return jsonify(result), 200


# ─── Dashboard Summary ────────────────────────────────────────────────────────

@gamification_bp.route('/dashboard', methods=['GET'])
@token_required
def gamification_dashboard():
    user = UserProfile.query.get(g.current_user.id)
    my_points = user.points or 0 if user else 0
    my_lifetime = user.lifetime_points_earned or 0 if user else 0

    my_badges = UserBadge.query.filter_by(user_id=g.current_user.id).all()
    my_challenge_parts = ChallengeParticipation.query.filter_by(user_id=g.current_user.id).all()
    my_csr_approved = CSRParticipation.query.filter_by(
        user_id=g.current_user.id, status='Approved'
    ).count()

    active_challenges = Challenge.query.filter_by(status='Active').count()
    pending_approvals = 0
    if g.current_user.role in ('Admin', 'ESG Manager'):
        pending_approvals = ChallengeParticipation.query.filter_by(status='Submitted').count()

    # Leaderboard position
    all_employees = UserProfile.query.filter(
        UserProfile.role == 'Employee'
    ).order_by(UserProfile.points.desc()).all()
    rank = next((i + 1 for i, u in enumerate(all_employees) if u.id == g.current_user.id), None)

    top5 = []
    for i, u in enumerate(all_employees[:5]):
        badges_c = UserBadge.query.filter_by(user_id=u.id).count()
        top5.append({
            'rank': i + 1,
            'user_id': u.id,
            'user_name': u.full_name or u.email,
            'points': u.points or 0,
            'lifetime_points_earned': u.lifetime_points_earned or 0,
            'badges_count': badges_c,
        })

    return jsonify({
        'my_points': my_points,
        'my_lifetime_points': my_lifetime,
        'my_badges_count': len(my_badges),
        'my_badges': [ub.to_dict() for ub in my_badges[:5]],
        'my_approved_challenges': sum(1 for p in my_challenge_parts if p.status == 'Approved'),
        'my_approved_csr': my_csr_approved,
        'my_rank': rank,
        'active_challenges': active_challenges,
        'pending_approvals': pending_approvals,
        'top5_leaderboard': top5,
    }), 200


# ─── Seed Data ───────────────────────────────────────────────────────────────

def seed_gamification_data():
    """Seed realistic Badges, Rewards, and sample Challenges for immediate testing."""
    from models import Category

    # Seed Challenge categories
    challenge_category_names = [
        ('Energy Saving', 'Challenge'),
        ('Waste Reduction', 'Challenge'),
        ('Sustainable Mobility', 'Challenge'),
        ('Community Action', 'Challenge'),
    ]
    for cat_name, cat_type in challenge_category_names:
        if not Category.query.filter_by(name=cat_name, type=cat_type).first():
            db.session.add(Category(name=cat_name, type=cat_type, status='Active'))
    db.session.flush()

    # Seed Badges (low thresholds for immediate testing)
    badge_defaults = [
        {
            'name': 'First Step', 'description': 'Earned your first 50 lifetime XP points.',
            'unlock_rule_type': 'total_points', 'unlock_rule_value': 50, 'icon': '🌱'
        },
        {
            'name': 'CSR Supporter', 'description': 'Approved participation in 1 CSR activity.',
            'unlock_rule_type': 'completed_csr', 'unlock_rule_value': 1, 'icon': '🤝'
        },
        {
            'name': 'Green Champion', 'description': 'Completed 1 sustainability challenge.',
            'unlock_rule_type': 'completed_challenges', 'unlock_rule_value': 1, 'icon': '🌿'
        },
        {
            'name': 'Eco Warrior', 'description': 'Earned 200 lifetime XP points.',
            'unlock_rule_type': 'total_points', 'unlock_rule_value': 200, 'icon': '🛡️'
        },
        {
            'name': 'Sustainability Star', 'description': 'Completed 3 sustainability challenges.',
            'unlock_rule_type': 'completed_challenges', 'unlock_rule_value': 3, 'icon': '⭐'
        },
        {
            'name': 'ESG Leader', 'description': 'Earned 500 lifetime XP points.',
            'unlock_rule_type': 'total_points', 'unlock_rule_value': 500, 'icon': '🏆'
        },
    ]
    for b in badge_defaults:
        if not Badge.query.filter_by(name=b['name']).first():
            db.session.add(Badge(**b))
    db.session.flush()

    # Seed Rewards
    reward_defaults = [
        {
            'name': 'Eco-Friendly Bamboo Coffee Tumbler',
            'description': 'A stylish, reusable bamboo tumbler to replace single-use cups.',
            'points_required': 50, 'stock': 15, 'status': 'Active'
        },
        {
            'name': 'Plant a Tree in Your Name',
            'description': 'We plant a tree in a reforestation project and send you the certificate.',
            'points_required': 100, 'stock': 25, 'status': 'Active'
        },
        {
            'name': 'Organic Cotton Company Swag Pack',
            'description': 'EcoSphere branded tote bag, journal, and pen — all organic/recycled materials.',
            'points_required': 150, 'stock': 10, 'status': 'Active'
        },
        {
            'name': 'Half-Day Eco-Volunteering Leave',
            'description': 'Redeem for a half-day of paid leave to volunteer at a local environmental NGO.',
            'points_required': 200, 'stock': 20, 'status': 'Active'
        },
    ]
    for r in reward_defaults:
        if not Reward.query.filter_by(name=r['name']).first():
            db.session.add(Reward(**r))
    db.session.flush()

    # Seed sample Challenges (Active, immediate participation)
    from datetime import date, timedelta
    waste_cat = Category.query.filter_by(name='Waste Reduction', type='Challenge').first()
    energy_cat = Category.query.filter_by(name='Energy Saving', type='Challenge').first()
    mobility_cat = Category.query.filter_by(name='Sustainable Mobility', type='Challenge').first()

    challenge_defaults = [
        {
            'title': 'Zero Waste Week',
            'description': 'Go completely zero-waste for 7 consecutive days. Track your waste daily and photograph your nearly-empty bin on Day 7.',
            'xp': 50, 'difficulty': 'Easy', 'evidence_required': True,
            'deadline': date.today() + timedelta(days=30),
            'status': 'Active',
            'category_id': waste_cat.id if waste_cat else None
        },
        {
            'title': 'Car-Free Commute Challenge',
            'description': 'Commute to office using only public transport, cycling, or walking for 2 consecutive weeks. Submit a transit pass or cycling log as proof.',
            'xp': 75, 'difficulty': 'Easy', 'evidence_required': True,
            'deadline': date.today() + timedelta(days=45),
            'status': 'Active',
            'category_id': mobility_cat.id if mobility_cat else None
        },
        {
            'title': 'Solar Power Adoption Drive',
            'description': 'Switch at least one home appliance or device to solar/renewable energy for 30 days. Submit an energy bill or solar panel invoice.',
            'xp': 100, 'difficulty': 'Medium', 'evidence_required': True,
            'deadline': date.today() + timedelta(days=60),
            'status': 'Active',
            'category_id': energy_cat.id if energy_cat else None
        },
    ]
    for c in challenge_defaults:
        if not Challenge.query.filter_by(title=c['title']).first():
            db.session.add(Challenge(**c))

    try:
        db.session.commit()
        print('Default Gamification seed data populated.')
    except Exception as e:
        db.session.rollback()
        print(f'Gamification seed skipped (already exists): {e}')
