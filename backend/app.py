import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from database import db
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.department_routes import department_bp
from routes.category_routes import category_bp
from routes.emission_factor_routes import emission_factors_bp
from routes.carbon_transaction_routes import carbon_transactions_bp
from routes.sustainability_goal_routes import sustainability_goals_bp
from routes.settings_routes import settings_bp
from routes.erp_routes import erp_bp, seed_erp_records
from routes.emission_factor_routes import emission_factors_bp, seed_emission_factors
from routes.csr_routes import csr_bp
from routes.diversity_routes import diversity_bp
from routes.training_routes import training_bp
from routes.governance_routes import governance_bp, seed_governance_data
from routes.gamification_routes import gamification_bp, seed_gamification_data
from routes.scoring_routes import scoring_bp, seed_multi_department_scoring_data
from routes.notification_routes import notification_bp

from sqlalchemy import text

def ensure_schema():
    try:
        with db.engine.begin() as conn:
            conn.execute(text("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS points INT DEFAULT 0;"))
            conn.execute(text("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS lifetime_points_earned INT DEFAULT 0;"))
    except Exception as e:
        print(f"Schema migration note: {e}")

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for frontend integration (read FRONTEND_URL env var, default to http://localhost:5173)
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    CORS(app, resources={r"/api/*": {"origins": [frontend_url], "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], "allow_headers": "*"}})

    # Initialize extensions
    db.init_app(app)

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(department_bp, url_prefix='/api/departments')
    app.register_blueprint(category_bp, url_prefix='/api/categories')
    app.register_blueprint(emission_factors_bp, url_prefix='/api/emission-factors')
    app.register_blueprint(carbon_transactions_bp, url_prefix='/api/carbon-transactions')
    app.register_blueprint(sustainability_goals_bp, url_prefix='/api/sustainability-goals')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')
    app.register_blueprint(erp_bp, url_prefix='/api/erp-records')
    app.register_blueprint(csr_bp, url_prefix='/api/csr-activities')
    app.register_blueprint(diversity_bp, url_prefix='/api/diversity')
    app.register_blueprint(training_bp, url_prefix='/api/trainings')
    app.register_blueprint(governance_bp, url_prefix='/api/governance')
    app.register_blueprint(gamification_bp, url_prefix='/api/gamification')
    app.register_blueprint(scoring_bp, url_prefix='/api/scoring')
    app.register_blueprint(notification_bp, url_prefix='/api/notifications')

    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'EcoSphere Backend API'
        }), 200

    # Auto create tables on launch
    with app.app_context():
        try:
            ensure_schema()
            db.create_all()
            print("Database tables initialized successfully.")
            seed_erp_records()
            seed_emission_factors()
            seed_governance_data()
            seed_gamification_data()
            seed_multi_department_scoring_data()
        except Exception as e:
            print(f"Error initializing database tables: {e}")

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
