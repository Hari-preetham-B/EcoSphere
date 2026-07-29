from app import app
from database import db
from models import UserProfile

def cleanup():
    with app.app_context():
        count = UserProfile.query.count()
        print(f"Current rows in user_profiles: {count}")
        if count > 0:
            db.session.query(UserProfile).delete()
            db.session.commit()
            print("Successfully deleted all suspect rows from user_profiles table.")
        else:
            print("user_profiles table is already empty.")

        remaining = UserProfile.query.count()
        print(f"Remaining user_profiles count: {remaining}")

if __name__ == '__main__':
    cleanup()
