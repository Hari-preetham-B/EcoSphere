import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from database import db
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.department_routes import department_bp
from routes.category_routes import category_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for frontend integration
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize extensions
    db.init_app(app)

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(department_bp, url_prefix='/api/departments')
    app.register_blueprint(category_bp, url_prefix='/api/categories')

    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'EcoSphere Backend API'
        }), 200

    # Auto create tables on launch
    with app.app_context():
        try:
            db.create_all()
            print("Database tables initialized successfully.")
        except Exception as e:
            print(f"Error initializing database tables: {e}")

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
