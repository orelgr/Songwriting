"""Marshmallow schemas for request/response validation."""
from marshmallow import Schema, fields, validate, validates, ValidationError


class UserSchema(Schema):
    """Schema for user data."""
    id = fields.Int(dump_only=True)
    email = fields.Email(required=True, validate=validate.Length(max=255))
    password = fields.Str(load_only=True, required=True, validate=validate.Length(min=8))
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    is_active = fields.Bool(dump_only=True)


class FolderSchema(Schema):
    """Schema for folder data."""
    id = fields.Int(dump_only=True)
    user_id = fields.Int(dump_only=True, allow_none=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    created_at = fields.DateTime(dump_only=True)
    songs_count = fields.Int(dump_only=True)


class SongSchema(Schema):
    """Schema for song data."""
    id = fields.Int(dump_only=True)
    user_id = fields.Int(dump_only=True, allow_none=True)
    folder_id = fields.Int(allow_none=True)
    title = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    author = fields.Str(allow_none=True, validate=validate.Length(max=255))
    capo = fields.Int(load_default=0, validate=validate.Range(min=0, max=12))
    transpose_semitones = fields.Int(load_default=0, validate=validate.Range(min=-12, max=12))
    content_chordpro = fields.Str(required=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates('capo')
    def validate_capo(self, value):
        if value < 0 or value > 12:
            raise ValidationError('Capo must be between 0 and 12')

    @validates('transpose_semitones')
    def validate_transpose(self, value):
        if value < -12 or value > 12:
            raise ValidationError('Transpose must be between -12 and 12')


class SongVersionSchema(Schema):
    """Schema for song version history."""
    id = fields.Int(dump_only=True)
    song_id = fields.Int(required=True)
    content_chordpro = fields.Str(required=True)
    capo = fields.Int()
    transpose_semitones = fields.Int()
    created_at = fields.DateTime(dump_only=True)


class LoginSchema(Schema):
    """Schema for login requests."""
    email = fields.Email(required=True)
    password = fields.Str(required=True)


class RegisterSchema(Schema):
    """Schema for registration requests."""
    email = fields.Email(required=True, validate=validate.Length(max=255))
    password = fields.Str(required=True, validate=validate.Length(min=8))

    @validates('password')
    def validate_password(self, value):
        # Basic password validation
        if len(value) < 8:
            raise ValidationError('Password must be at least 8 characters long')
        if not any(c.isdigit() for c in value):
            raise ValidationError('Password must contain at least one digit')
        if not any(c.isupper() for c in value):
            raise ValidationError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in value):
            raise ValidationError('Password must contain at least one lowercase letter')