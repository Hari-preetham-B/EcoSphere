import os
from app import app
from database import db
from sqlalchemy import inspect, text

def initialize_database():
    with app.app_context():
        db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        # Mask password for display
        masked_uri = db_uri
        if '@' in db_uri:
            proto_user = db_uri.split('@')[0]
            host_part = db_uri.split('@')[1]
            if ':' in proto_user:
                proto_user = proto_user.split(':')[0] + ':****'
            masked_uri = f"{proto_user}@{host_part}"
        
        print(f"Connecting to Database URI: {masked_uri}")
        
        # Verify connection
        try:
            result = db.session.execute(text("SELECT current_database(), current_user, version();")).fetchone()
            print(f"Connected to DB: {result[0]} as user: {result[1]}")
            print(f"Postgres Version: {result[2]}")
        except Exception as e:
            print(f"Error testing DB connection: {e}")
            return

        # Run db.create_all()
        print("Executing db.create_all()...")
        db.create_all()
        print("db.create_all() executed successfully.")

        # Inspect tables in the database
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print("\nTables currently present in database:")
        for t in tables:
            print(f" - {t}")

        # Check column details for key tables
        for t in ['user_profiles', 'departments', 'categories']:
            if t in tables:
                columns = [c['name'] for c in inspector.get_columns(t)]
                print(f"Table '{t}' columns: {', '.join(columns)}")

if __name__ == '__main__':
    initialize_database()
