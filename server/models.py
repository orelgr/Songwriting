"""Database models for the song writing application."""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, Integer, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db import db


class User(db.Model):
    """User model for authentication."""
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    folders: Mapped[List["Folder"]] = relationship("Folder", back_populates="user", cascade="all, delete-orphan")
    songs: Mapped[List["Song"]] = relationship("Song", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f'<User {self.email}>'


class Folder(db.Model):
    """Folder model for organizing songs."""
    __tablename__ = 'folders'

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey('users.id'), nullable=True)  # Nullable in MVP
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="folders")
    songs: Mapped[List["Song"]] = relationship("Song", back_populates="folder", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_folders_user', 'user_id'),
    )

    def __repr__(self):
        return f'<Folder {self.name}>'


class Song(db.Model):
    """Song model with ChordPro content."""
    __tablename__ = 'songs'

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey('users.id'), nullable=True)  # Nullable in MVP
    folder_id: Mapped[Optional[int]] = mapped_column(ForeignKey('folders.id'), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    author: Mapped[Optional[str]] = mapped_column(String(255))
    capo: Mapped[int] = mapped_column(Integer, default=0)
    transpose_semitones: Mapped[int] = mapped_column(Integer, default=0)
    content_chordpro: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="songs")
    folder: Mapped[Optional["Folder"]] = relationship("Folder", back_populates="songs")
    versions: Mapped[List["SongVersion"]] = relationship("SongVersion", back_populates="song", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_songs_folder', 'folder_id'),
        Index('idx_songs_title', 'title'),
        Index('idx_songs_author', 'author'),
        Index('idx_songs_user', 'user_id'),
    )

    def __repr__(self):
        return f'<Song {self.title}>'


class SongVersion(db.Model):
    """Song version history for safe editing."""
    __tablename__ = 'song_versions'

    id: Mapped[int] = mapped_column(primary_key=True)
    song_id: Mapped[int] = mapped_column(ForeignKey('songs.id'), nullable=False)
    content_chordpro: Mapped[str] = mapped_column(Text)
    capo: Mapped[int] = mapped_column(Integer)
    transpose_semitones: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    song: Mapped["Song"] = relationship("Song", back_populates="versions")

    def __repr__(self):
        return f'<SongVersion song_id={self.song_id} created_at={self.created_at}>'