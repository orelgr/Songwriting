"""Service for folder operations."""
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func
from models import Folder, Song
from db import db


class FoldersService:
    """Service class for folder-related operations."""

    @staticmethod
    def create_folder(name: str, user_id: Optional[int] = None) -> Folder:
        """
        Create a new folder.

        Args:
            name: Folder name
            user_id: Optional user ID (nullable in MVP)

        Returns:
            Created folder object
        """
        folder = Folder(name=name, user_id=user_id)
        db.session.add(folder)
        db.session.commit()
        return folder

    @staticmethod
    def get_folder(folder_id: int, user_id: Optional[int] = None) -> Optional[Folder]:
        """
        Get a folder by ID.

        Args:
            folder_id: Folder ID
            user_id: Optional user ID for filtering

        Returns:
            Folder object or None
        """
        query = db.session.query(Folder).filter(Folder.id == folder_id)

        if user_id is not None:
            query = query.filter(Folder.user_id == user_id)

        return query.first()

    @staticmethod
    def get_folders(user_id: Optional[int] = None) -> List[Folder]:
        """
        Get all folders for a user or all folders if no user.

        Args:
            user_id: Optional user ID for filtering

        Returns:
            List of folder objects
        """
        query = db.session.query(Folder)

        if user_id is not None:
            query = query.filter(Folder.user_id == user_id)
        else:
            # In demo mode, get folders with null user_id
            query = query.filter(Folder.user_id.is_(None))

        return query.order_by(Folder.created_at.desc()).all()

    @staticmethod
    def get_folders_with_counts(user_id: Optional[int] = None) -> List[Dict]:
        """
        Get all folders with their song counts.

        Args:
            user_id: Optional user ID for filtering

        Returns:
            List of folder dictionaries with song counts
        """
        query = db.session.query(
            Folder,
            func.count(Song.id).label('songs_count')
        ).outerjoin(Song, Folder.id == Song.folder_id)

        if user_id is not None:
            query = query.filter(Folder.user_id == user_id)
        else:
            query = query.filter(Folder.user_id.is_(None))

        query = query.group_by(Folder.id).order_by(Folder.created_at.desc())

        results = []
        for folder, count in query.all():
            folder_dict = {
                'id': folder.id,
                'name': folder.name,
                'created_at': folder.created_at,
                'songs_count': count
            }
            results.append(folder_dict)

        return results

    @staticmethod
    def update_folder(folder_id: int, name: str, user_id: Optional[int] = None) -> Optional[Folder]:
        """
        Update a folder's name.

        Args:
            folder_id: Folder ID
            name: New folder name
            user_id: Optional user ID for authorization

        Returns:
            Updated folder object or None
        """
        folder = FoldersService.get_folder(folder_id, user_id)

        if folder:
            folder.name = name
            db.session.commit()

        return folder

    @staticmethod
    def delete_folder(folder_id: int, user_id: Optional[int] = None) -> bool:
        """
        Delete a folder and all its songs.

        Args:
            folder_id: Folder ID
            user_id: Optional user ID for authorization

        Returns:
            True if deleted, False otherwise
        """
        folder = FoldersService.get_folder(folder_id, user_id)

        if folder:
            # Songs will be deleted automatically due to cascade
            db.session.delete(folder)
            db.session.commit()
            return True

        return False

    @staticmethod
    def get_folder_songs(folder_id: int, user_id: Optional[int] = None) -> List[Song]:
        """
        Get all songs in a folder.

        Args:
            folder_id: Folder ID
            user_id: Optional user ID for filtering

        Returns:
            List of song objects
        """
        query = db.session.query(Song).filter(Song.folder_id == folder_id)

        if user_id is not None:
            query = query.filter(Song.user_id == user_id)

        return query.order_by(Song.updated_at.desc()).all()