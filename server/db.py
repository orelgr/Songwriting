"""Database configuration and initialization."""
import os
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

def init_db(app):
    """Initialize the database with the Flask app."""
    # Ensure data directory exists
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)

    # Configure SQLAlchemy - use absolute path for SQLite
    db_path = os.path.join(data_dir, 'app.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize database
    db.init_app(app)

    # Create tables
    with app.app_context():
        # Import models here to avoid circular imports
        from models import User, Folder, Song, SongVersion
        db.create_all()
        print(f"Database initialized successfully at: {db_path}")