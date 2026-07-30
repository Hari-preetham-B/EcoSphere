import sys
import os
from unittest.mock import patch

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from database import db
from models import UserProfile, ESGPolicy, PolicyAcknowledgement, Audit, ComplianceIssue, Department

def run_tests():
    app = create_app()
    client = app.test_client()

    with app.app_context():
        # Retrieve test admin user
        admin = UserProfile.query.filter_by(role='Admin').first()
        if not admin:
            admin = UserProfile(id='test-admin-uuid', email='admin@ecosphere.com', full_name='Admin User', role='Admin')
            db.session.add(admin)
            db.session.commit()

        mock_supabase_payload = {
            'id': admin.id,
            'email': admin.email,
            'user_metadata': {'full_name': admin.full_name}
        }

        headers = {'Authorization': 'Bearer fake-test-token'}

        with patch('auth.get_supabase_user', return_value=mock_supabase_payload):
            print("--- Testing Governance API ---")

            # Debug existing issues in DB
            all_db_issues = ComplianceIssue.query.all()
            print(f"Total ComplianceIssues in DB: {len(all_db_issues)}")
            from datetime import date
            for iss in all_db_issues:
                print(f"Issue #{iss.id}: status={iss.status}, due_date={iss.due_date} (type {type(iss.due_date)}), today={date.today()}, is_overdue={iss.is_overdue}")

            # 1. Dashboard Endpoint
            res = client.get('/api/governance/dashboard', headers=headers)
            print("Dashboard Response Code:", res.status_code)
            dashboard_data = res.get_json()
            print("Overdue Issues Count:", dashboard_data.get('overdue_issues_count'))
            print("Overdue Issues List Count:", len(dashboard_data.get('overdue_issues_list', [])))
            assert res.status_code == 200
            assert dashboard_data.get('overdue_issues_count', 0) >= 1

            # 2. Get Policies
            res = client.get('/api/governance/policies', headers=headers)
            print("Get Policies Status:", res.status_code)
            policies = res.get_json()
            print("Policies Count:", len(policies))
            assert res.status_code == 200
            assert len(policies) >= 1

            policy_id = policies[0]['id']

            # 3. Acknowledge Policy
            res = client.post(f'/api/governance/policies/{policy_id}/acknowledge', headers=headers)
            print("Acknowledge Policy Status:", res.status_code)
            assert res.status_code in (200, 201)

            # 4. Remind Policy (Stub verification)
            res = client.post(f'/api/governance/policies/{policy_id}/remind', headers=headers)
            print("Remind Policy Stub Status:", res.status_code)
            remind_json = res.get_json()
            print("Remind Payload:", remind_json)
            assert res.status_code == 200
            assert remind_json.get('status') == 'success'

            # 5. Get Audits
            res = client.get('/api/governance/audits', headers=headers)
            print("Get Audits Status:", res.status_code)
            audits = res.get_json()
            print("Audits Count:", len(audits))
            assert res.status_code == 200
            assert len(audits) >= 1

            # 6. Get Compliance Issues
            res = client.get('/api/governance/issues', headers=headers)
            print("Get Compliance Issues Status:", res.status_code)
            issues = res.get_json()
            print("Compliance Issues Count:", len(issues))
            assert res.status_code == 200
            assert len(issues) >= 1

            print("\n>>> ALL BACKEND GOVERNANCE TESTS PASSED SUCCESSFULLY! <<<")

if __name__ == '__main__':
    run_tests()
