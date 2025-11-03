"""Security module for password hashing and JWT authentication."""
import os
from functools import wraps
from datetime import timedelta
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHash
from flask import current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required as jwt_required_orig,
    verify_jwt_in_request
)


# Initialize Argon2 password hasher with secure parameters
ph = PasswordHasher(
    time_cost=2,        # Number of iterations
    memory_cost=65536,  # 64 MB
    parallelism=1,      # Number of parallel threads
    hash_len=32,        # Length of the hash in bytes
    salt_len=16         # Length of the salt in bytes
)


def hash_password(password: str) -> str:
    """
    Hash a password using Argon2id with pepper.

    Args:
        password: Plain text password

    Returns:
        Hashed password string
    """
    pepper = os.getenv('PEPPER', 'default_pepper_change_in_production')
    peppered_password = password + pepper
    return ph.hash(peppered_password)


def verify_password(password: str, password_hash: str) -> bool:
    """
    Verify a password against its hash.

    Args:
        password: Plain text password to verify
        password_hash: Argon2id hash to verify against

    Returns:
        True if password matches, False otherwise
    """
    try:
        pepper = os.getenv('PEPPER', 'default_pepper_change_in_production')
        peppered_password = password + pepper
        ph.verify(password_hash, peppered_password)

        # Check if rehashing is needed (parameters changed)
        if ph.check_needs_rehash(password_hash):
            # In production, you might want to rehash and update the database
            pass

        return True
    except (VerifyMismatchError, VerificationError, InvalidHash):
        return False


def create_tokens(user_id: int) -> dict:
    """
    Create JWT access and refresh tokens for a user.

    Args:
        user_id: ID of the authenticated user

    Returns:
        Dictionary with access_token and refresh_token
    """
    # Create access token (15 minutes)
    access_token = create_access_token(
        identity=user_id,
        expires_delta=timedelta(minutes=15)
    )

    # Create refresh token (30 days)
    refresh_token = create_refresh_token(
        identity=user_id,
        expires_delta=timedelta(days=30)
    )

    return {
        'access_token': access_token,
        'refresh_token': refresh_token
    }


def optional_auth(f):
    """
    Decorator that makes JWT authentication optional.
    If AUTH_ENABLED is false, proceeds without authentication.
    If AUTH_ENABLED is true, requires valid JWT.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_enabled = os.getenv('AUTH_ENABLED', 'false').lower() == 'true'

        if auth_enabled:
            # Verify JWT if auth is enabled
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        else:
            # In demo mode, use a default user_id
            user_id = None

        # Pass user_id to the route handler
        return f(user_id=user_id, *args, **kwargs)

    return decorated_function


def require_auth(f):
    """
    Decorator that requires JWT authentication.
    Only works when AUTH_ENABLED is true.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_enabled = os.getenv('AUTH_ENABLED', 'false').lower() == 'true'

        if not auth_enabled:
            # In demo mode, use a default user_id
            return f(user_id=None, *args, **kwargs)

        # Use Flask-JWT-Extended's jwt_required decorator
        return jwt_required_orig()(f)(*args, **kwargs)

    return decorated_function


# JWT Configuration helper
def configure_jwt(app):
    """Configure JWT settings for the Flask app."""
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET', 'change_me_in_production')
    app.config['JWT_TOKEN_LOCATION'] = ['cookies']
    app.config['JWT_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
    app.config['JWT_COOKIE_HTTPONLY'] = True
    app.config['JWT_COOKIE_SAMESITE'] = 'Lax'
    app.config['JWT_ACCESS_COOKIE_NAME'] = 'access_token'
    app.config['JWT_REFRESH_COOKIE_NAME'] = 'refresh_token'
    app.config['JWT_COOKIE_CSRF_PROTECT'] = False  # Enable in production

    # Token expiration times
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=15)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)