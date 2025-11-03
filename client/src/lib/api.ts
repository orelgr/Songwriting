/**
 * API client for communication with the Flask backend
 */

const API_BASE = '/api';

export interface ApiError {
  error: string;
  messages?: Record<string, string[]>;
}

export interface Folder {
  id: number;
  name: string;
  created_at: string;
  songs_count?: number;
}

export interface Song {
  id: number;
  folder_id?: number;
  title: string;
  author?: string;
  capo: number;
  transpose_semitones: number;
  content_chordpro: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
}

class ApiClient {
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${path}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for JWT auth
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`
      }));
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async register(credentials: RegisterCredentials): Promise<{ message: string; user: User }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async login(credentials: LoginCredentials): Promise<{ message: string; user: User }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<{ message: string }> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Folder endpoints
  async getFolders(): Promise<Folder[]> {
    return this.request('/folders');
  }

  async createFolder(name: string): Promise<Folder> {
    return this.request('/folders', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async updateFolder(id: number, name: string): Promise<Folder> {
    return this.request(`/folders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  }

  async deleteFolder(id: number): Promise<{ message: string }> {
    return this.request(`/folders/${id}`, {
      method: 'DELETE',
    });
  }

  async getFolderSongs(folderId: number): Promise<Song[]> {
    return this.request(`/folders/${folderId}/songs`);
  }

  // Song endpoints
  async createSong(song: Partial<Song>): Promise<Song> {
    return this.request('/songs', {
      method: 'POST',
      body: JSON.stringify(song),
    });
  }

  async getSong(id: number): Promise<Song> {
    return this.request(`/songs/${id}`);
  }

  async updateSong(id: number, updates: Partial<Song>): Promise<Song> {
    return this.request(`/songs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteSong(id: number): Promise<{ message: string }> {
    return this.request(`/songs/${id}`, {
      method: 'DELETE',
    });
  }

  async searchSongs(query: string): Promise<Song[]> {
    const params = new URLSearchParams({ q: query });
    return this.request(`/search?${params}`);
  }

  async getSongVersions(songId: number): Promise<Array<{
    id: number;
    created_at: string;
    capo: number;
    transpose_semitones: number;
  }>> {
    return this.request(`/songs/${songId}/versions`);
  }

  async exportSongPdf(songId: number): Promise<{
    song: Song;
    message: string;
  }> {
    return this.request(`/songs/${songId}/export/pdf`, {
      method: 'POST',
    });
  }

  // Health check
  async health(): Promise<{
    status: string;
    auth_enabled: boolean;
    debug: boolean;
  }> {
    return this.request('/health');
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export hooks for React components
import { useState, useEffect } from 'react';

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getFolders();
      setFolders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  return { folders, loading, error, refresh: loadFolders };
}

export function useSongs(folderId?: number) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (folderId) {
      loadSongs();
    }
  }, [folderId]);

  const loadSongs = async () => {
    if (!folderId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await api.getFolderSongs(folderId);
      setSongs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load songs');
    } finally {
      setLoading(false);
    }
  };

  return { songs, loading, error, refresh: loadSongs };
}

export function useSong(songId?: number) {
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (songId) {
      loadSong();
    }
  }, [songId]);

  const loadSong = async () => {
    if (!songId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await api.getSong(songId);
      setSong(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load song');
    } finally {
      setLoading(false);
    }
  };

  const saveSong = async (updates: Partial<Song>) => {
    if (!songId) return;

    try {
      setError(null);
      const updated = await api.updateSong(songId, updates);
      setSong(updated);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save song');
      throw err;
    }
  };

  return { song, loading, error, refresh: loadSong, save: saveSong };
}