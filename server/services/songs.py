"""Service for song operations."""
from typing import Optional, List, Dict
from datetime import datetime
from sqlalchemy import or_, and_
from models import Song, SongVersion, Folder
from services.chordpro import ChordProService
from db import db


class SongsService:
    """Service class for song-related operations."""

    @staticmethod
    def create_song(
        title: str,
        content_chordpro: str,
        folder_id: Optional[int] = None,
        author: Optional[str] = None,
        capo: int = 0,
        transpose_semitones: int = 0,
        user_id: Optional[int] = None
    ) -> Song:
        """
        Create a new song.

        Args:
            title: Song title
            content_chordpro: ChordPro formatted content
            folder_id: Optional folder ID
            author: Optional author name
            capo: Capo position (0-12)
            transpose_semitones: Transposition in semitones (-12 to 12)
            user_id: Optional user ID

        Returns:
            Created song object
        """
        # Clean content first
        content_chordpro = ChordProService.clean_content(content_chordpro)

        # Validate ChordPro content (but be lenient)
        is_valid, error = ChordProService.validate(content_chordpro)
        if not is_valid and error and 'Unclosed block' not in str(error):
            # Only fail on critical errors, not formatting issues
            raise ValueError(f"Invalid ChordPro content: {error}")

        # Inject metadata
        try:
            content_chordpro = ChordProService.inject_metadata(
                content_chordpro,
                title=title,
                artist=author if author else None,
                capo=capo if capo else 0
            )
        except Exception as e:
            # If metadata injection fails, use original content
            print(f"Warning: Failed to inject metadata: {e}")
            pass

        # Create song
        song = Song(
            title=title,
            content_chordpro=content_chordpro,
            folder_id=folder_id,
            author=author,
            capo=capo,
            transpose_semitones=transpose_semitones,
            user_id=user_id
        )
        db.session.add(song)
        db.session.commit()

        # Create initial version
        version = SongVersion(
            song_id=song.id,
            content_chordpro=content_chordpro,
            capo=capo,
            transpose_semitones=transpose_semitones
        )
        db.session.add(version)
        db.session.commit()

        return song

    @staticmethod
    def get_song(song_id: int, user_id: Optional[int] = None) -> Optional[Song]:
        """
        Get a song by ID.

        Args:
            song_id: Song ID
            user_id: Optional user ID for filtering

        Returns:
            Song object or None
        """
        query = db.session.query(Song).filter(Song.id == song_id)

        if user_id is not None:
            query = query.filter(Song.user_id == user_id)

        return query.first()

    @staticmethod
    def get_songs(user_id: Optional[int] = None) -> List[Song]:
        """
        Get all songs for a user or all songs if no user.

        Args:
            user_id: Optional user ID for filtering

        Returns:
            List of song objects
        """
        query = db.session.query(Song)

        if user_id is not None:
            query = query.filter(Song.user_id == user_id)
        else:
            # In demo mode, get songs with null user_id
            query = query.filter(Song.user_id.is_(None))

        return query.order_by(Song.updated_at.desc()).all()

    @staticmethod
    def update_song(
        song_id: int,
        title: Optional[str] = None,
        content_chordpro: Optional[str] = None,
        folder_id: Optional[int] = None,
        author: Optional[str] = None,
        capo: Optional[int] = None,
        transpose_semitones: Optional[int] = None,
        user_id: Optional[int] = None
    ) -> Optional[Song]:
        """
        Update a song and create a version history entry.

        Args:
            song_id: Song ID
            title: New title
            content_chordpro: New ChordPro content
            folder_id: New folder ID
            author: New author
            capo: New capo position
            transpose_semitones: New transposition
            user_id: Optional user ID for authorization

        Returns:
            Updated song object or None
        """
        song = SongsService.get_song(song_id, user_id)

        if not song:
            return None

        # Save current version before updating
        if content_chordpro and content_chordpro != song.content_chordpro:
            version = SongVersion(
                song_id=song.id,
                content_chordpro=song.content_chordpro,
                capo=song.capo,
                transpose_semitones=song.transpose_semitones
            )
            db.session.add(version)

        # Validate new content if provided (be lenient)
        if content_chordpro:
            content_chordpro = ChordProService.clean_content(content_chordpro)

            is_valid, error = ChordProService.validate(content_chordpro)
            if not is_valid and error and 'Unclosed block' not in str(error):
                # Only fail on critical errors
                raise ValueError(f"Invalid ChordPro content: {error}")

        # Update fields
        if title is not None:
            song.title = title
        if content_chordpro is not None:
            # Inject updated metadata
            try:
                content_chordpro = ChordProService.inject_metadata(
                    content_chordpro,
                    title=title or song.title,
                    artist=author if author is not None else song.author,
                    capo=capo if capo is not None else song.capo
                )
            except Exception as e:
                # If metadata injection fails, use original content
                print(f"Warning: Failed to inject metadata: {e}")
                pass
            song.content_chordpro = content_chordpro
        if folder_id is not None:
            song.folder_id = folder_id
        if author is not None:
            song.author = author
        if capo is not None:
            song.capo = capo
        if transpose_semitones is not None:
            song.transpose_semitones = transpose_semitones

        song.updated_at = datetime.utcnow()
        db.session.commit()

        return song

    @staticmethod
    def delete_song(song_id: int, user_id: Optional[int] = None) -> bool:
        """
        Delete a song and its version history.

        Args:
            song_id: Song ID
            user_id: Optional user ID for authorization

        Returns:
            True if deleted, False otherwise
        """
        song = SongsService.get_song(song_id, user_id)

        if song:
            # Versions will be deleted automatically due to cascade
            db.session.delete(song)
            db.session.commit()
            return True

        return False

    @staticmethod
    def search_songs(
        query: str,
        user_id: Optional[int] = None
    ) -> List[Song]:
        """
        Search songs by title, author, or content.

        Args:
            query: Search query
            user_id: Optional user ID for filtering

        Returns:
            List of matching song objects
        """
        search_pattern = f"%{query}%"

        db_query = db.session.query(Song).filter(
            or_(
                Song.title.ilike(search_pattern),
                Song.author.ilike(search_pattern),
                Song.content_chordpro.ilike(search_pattern)
            )
        )

        if user_id is not None:
            db_query = db_query.filter(Song.user_id == user_id)
        else:
            # In demo mode, search songs with null user_id
            db_query = db_query.filter(Song.user_id.is_(None))

        return db_query.order_by(Song.updated_at.desc()).all()

    @staticmethod
    def get_song_versions(song_id: int, user_id: Optional[int] = None) -> List[SongVersion]:
        """
        Get version history for a song.

        Args:
            song_id: Song ID
            user_id: Optional user ID for authorization

        Returns:
            List of song versions
        """
        # First check if user has access to the song
        song = SongsService.get_song(song_id, user_id)
        if not song:
            return []

        return db.session.query(SongVersion)\
            .filter(SongVersion.song_id == song_id)\
            .order_by(SongVersion.created_at.desc())\
            .all()

    @staticmethod
    def restore_version(song_id: int, version_id: int, user_id: Optional[int] = None) -> Optional[Song]:
        """
        Restore a song to a previous version.

        Args:
            song_id: Song ID
            version_id: Version ID to restore
            user_id: Optional user ID for authorization

        Returns:
            Updated song object or None
        """
        song = SongsService.get_song(song_id, user_id)
        if not song:
            return None

        version = db.session.query(SongVersion)\
            .filter(SongVersion.id == version_id, SongVersion.song_id == song_id)\
            .first()

        if not version:
            return None

        # Save current state as a version before restoring
        current_version = SongVersion(
            song_id=song.id,
            content_chordpro=song.content_chordpro,
            capo=song.capo,
            transpose_semitones=song.transpose_semitones
        )
        db.session.add(current_version)

        # Restore from version
        song.content_chordpro = version.content_chordpro
        song.capo = version.capo
        song.transpose_semitones = version.transpose_semitones
        song.updated_at = datetime.utcnow()

        db.session.commit()

        return song