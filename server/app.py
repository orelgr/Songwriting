"""Main Flask application for the song writing app."""
import os
from flask import Flask, jsonify, request, send_from_directory, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager, get_jwt_identity
from marshmallow import ValidationError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import modules
from db import init_db, db
from security import configure_jwt, hash_password, verify_password, create_tokens, optional_auth
from schemas import (
    FolderSchema, SongSchema, LoginSchema, RegisterSchema
)
from services.folders import FoldersService
from services.songs import SongsService
from models import User

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET', 'dev_secret_key')
DEBUG = os.getenv('DEBUG', 'true').lower() == 'true'
AUTH_ENABLED = os.getenv('AUTH_ENABLED', 'false').lower() == 'true'

# Initialize extensions
CORS(app, origins=['http://localhost:5173'], supports_credentials=True)
jwt = JWTManager(app)

# Configure JWT
configure_jwt(app)

# Initialize database
init_db(app)

# Initialize schemas
folder_schema = FolderSchema()
folders_schema = FolderSchema(many=True)
song_schema = SongSchema()
songs_schema = SongSchema(many=True)
login_schema = LoginSchema()
register_schema = RegisterSchema()


# Error handlers
@app.errorhandler(ValidationError)
def handle_validation_error(e):
    return jsonify({'error': 'Validation error', 'messages': e.messages}), 400


@app.errorhandler(ValueError)
def handle_value_error(e):
    return jsonify({'error': str(e)}), 400


@app.errorhandler(404)
def handle_not_found(e):
    # For non-API routes, serve the React app
    if not request.path.startswith('/api'):
        return send_from_directory('static', 'index.html')
    return jsonify({'error': 'Not found'}), 404


# Authentication endpoints (skeleton for now)
@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user."""
    if not AUTH_ENABLED:
        return jsonify({'message': 'Authentication is disabled'}), 200

    try:
        data = register_schema.load(request.json)
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'messages': e.messages}), 400

    # Check if user exists
    existing_user = db.session.query(User).filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({'error': 'Email already registered'}), 409

    # Create new user
    user = User(
        email=data['email'],
        password_hash=hash_password(data['password'])
    )
    db.session.add(user)
    db.session.commit()

    # Create tokens
    tokens = create_tokens(user.id)

    response = jsonify({
        'message': 'User registered successfully',
        'user': {'id': user.id, 'email': user.email}
    })

    # Set cookies
    response.set_cookie('access_token', tokens['access_token'], httponly=True, samesite='Lax')
    response.set_cookie('refresh_token', tokens['refresh_token'], httponly=True, samesite='Lax')

    return response, 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user and return JWT tokens."""
    if not AUTH_ENABLED:
        return jsonify({'message': 'Authentication is disabled'}), 200

    try:
        data = login_schema.load(request.json)
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'messages': e.messages}), 400

    # Find user
    user = db.session.query(User).filter_by(email=data['email']).first()
    if not user or not verify_password(data['password'], user.password_hash):
        return jsonify({'error': 'Invalid email or password'}), 401

    if not user.is_active:
        return jsonify({'error': 'Account is disabled'}), 403

    # Create tokens
    tokens = create_tokens(user.id)

    response = jsonify({
        'message': 'Login successful',
        'user': {'id': user.id, 'email': user.email}
    })

    # Set cookies
    response.set_cookie('access_token', tokens['access_token'], httponly=True, samesite='Lax')
    response.set_cookie('refresh_token', tokens['refresh_token'], httponly=True, samesite='Lax')

    return response, 200


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout user and clear JWT cookies."""
    response = jsonify({'message': 'Logout successful'})
    response.delete_cookie('access_token')
    response.delete_cookie('refresh_token')
    return response, 200


# Folder endpoints
@app.route('/api/folders', methods=['GET'])
@optional_auth
def get_folders(user_id=None):
    """Get all folders for the current user."""
    folders = FoldersService.get_folders_with_counts(user_id)
    return jsonify(folders), 200


@app.route('/api/folders', methods=['POST'])
@optional_auth
def create_folder(user_id=None):
    """Create a new folder."""
    try:
        data = folder_schema.load(request.json, partial=True)
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'messages': e.messages}), 400

    folder = FoldersService.create_folder(data['name'], user_id)
    return jsonify(folder_schema.dump(folder)), 201


@app.route('/api/folders/<int:folder_id>', methods=['PATCH'])
@optional_auth
def update_folder(folder_id, user_id=None):
    """Update a folder's name."""
    try:
        data = folder_schema.load(request.json, partial=True)
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'messages': e.messages}), 400

    folder = FoldersService.update_folder(folder_id, data['name'], user_id)
    if not folder:
        return jsonify({'error': 'Folder not found'}), 404

    return jsonify(folder_schema.dump(folder)), 200


@app.route('/api/folders/<int:folder_id>', methods=['DELETE'])
@optional_auth
def delete_folder(folder_id, user_id=None):
    """Delete a folder and all its songs."""
    if FoldersService.delete_folder(folder_id, user_id):
        return jsonify({'message': 'Folder deleted'}), 200
    return jsonify({'error': 'Folder not found'}), 404


@app.route('/api/folders/<int:folder_id>/songs', methods=['GET'])
@optional_auth
def get_folder_songs(folder_id, user_id=None):
    """Get all songs in a folder."""
    songs = FoldersService.get_folder_songs(folder_id, user_id)
    return jsonify(songs_schema.dump(songs)), 200


# Song endpoints
@app.route('/api/songs', methods=['POST'])
@optional_auth
def create_song(user_id=None):
    """Create a new song."""
    try:
        data = song_schema.load(request.json)
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'messages': e.messages}), 400

    try:
        song = SongsService.create_song(
            title=data['title'],
            content_chordpro=data['content_chordpro'],
            folder_id=data.get('folder_id'),
            author=data.get('author'),
            capo=data.get('capo', 0),
            transpose_semitones=data.get('transpose_semitones', 0),
            user_id=user_id
        )
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

    return jsonify(song_schema.dump(song)), 201


@app.route('/api/songs/<int:song_id>', methods=['GET'])
@optional_auth
def get_song(song_id, user_id=None):
    """Get a song by ID."""
    song = SongsService.get_song(song_id, user_id)
    if not song:
        return jsonify({'error': 'Song not found'}), 404

    return jsonify(song_schema.dump(song)), 200


@app.route('/api/songs/<int:song_id>', methods=['PATCH'])
@optional_auth
def update_song(song_id, user_id=None):
    """Update a song."""
    try:
        data = song_schema.load(request.json, partial=True)
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'messages': e.messages}), 400

    try:
        song = SongsService.update_song(
            song_id=song_id,
            title=data.get('title'),
            content_chordpro=data.get('content_chordpro'),
            folder_id=data.get('folder_id'),
            author=data.get('author'),
            capo=data.get('capo'),
            transpose_semitones=data.get('transpose_semitones'),
            user_id=user_id
        )
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

    if not song:
        return jsonify({'error': 'Song not found'}), 404

    return jsonify(song_schema.dump(song)), 200


@app.route('/api/songs/<int:song_id>', methods=['DELETE'])
@optional_auth
def delete_song(song_id, user_id=None):
    """Delete a song."""
    if SongsService.delete_song(song_id, user_id):
        return jsonify({'message': 'Song deleted'}), 200
    return jsonify({'error': 'Song not found'}), 404


@app.route('/api/search', methods=['GET'])
@optional_auth
def search_songs(user_id=None):
    """Search songs by title, author, or content."""
    query = request.args.get('q', '')
    if not query:
        return jsonify({'error': 'Search query required'}), 400

    songs = SongsService.search_songs(query, user_id)
    return jsonify(songs_schema.dump(songs)), 200


@app.route('/api/songs/<int:song_id>/versions', methods=['GET'])
@optional_auth
def get_song_versions(song_id, user_id=None):
    """Get version history for a song."""
    versions = SongsService.get_song_versions(song_id, user_id)
    return jsonify([{
        'id': v.id,
        'created_at': v.created_at,
        'capo': v.capo,
        'transpose_semitones': v.transpose_semitones
    } for v in versions]), 200


@app.route('/api/songs/<int:song_id>/export/pdf', methods=['POST'])
@optional_auth
def export_song_pdf(song_id, user_id=None):
    """Export a song as PDF (placeholder - actual PDF generation in frontend)."""
    song = SongsService.get_song(song_id, user_id)
    if not song:
        return jsonify({'error': 'Song not found'}), 404

    # In production, this would generate a PDF server-side or return a signed URL
    # For now, we return the song data for client-side PDF generation
    return jsonify({
        'song': song_schema.dump(song),
        'message': 'Generate PDF on client side'
    }), 200


# Health check
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'auth_enabled': AUTH_ENABLED,
        'debug': DEBUG
    }), 200


# Serve React app for all non-API routes
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    """Serve React application for all non-API routes."""
    if path and os.path.exists(os.path.join('static', path)):
        return send_from_directory('static', path)
    return send_from_directory('static', 'index.html')


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=DEBUG)