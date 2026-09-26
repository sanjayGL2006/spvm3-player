const API_BASE = '/api'

export async function fetchTracks({ genre, search, playlistId } = {}) {
  const params = new URLSearchParams()
  if (genre && genre !== 'All') params.set('genre', genre)
  if (search) params.set('search', search)
  if (playlistId) params.set('playlist_id', playlistId)
  const res = await fetch(`${API_BASE}/tracks?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch tracks')
  return res.json()
}

export async function fetchGenres() {
  const res = await fetch(`${API_BASE}/genres`)
  if (!res.ok) throw new Error('Failed to fetch genres')
  return res.json()
}

export async function fetchPlaylists() {
  const res = await fetch(`${API_BASE}/playlists`)
  if (!res.ok) throw new Error('Failed to fetch playlists')
  return res.json()
}

export async function createPlaylist({ name, description = '' }) {
  const res = await fetch(`${API_BASE}/playlists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description })
  })
  if (!res.ok) throw new Error('Failed to create playlist')
  return res.json()
}

export async function updatePlaylist(playlistId, data) {
  const res = await fetch(`${API_BASE}/playlists/${playlistId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to update playlist')
  return res.json()
}

export async function deletePlaylist(playlistId) {
  const res = await fetch(`${API_BASE}/playlists/${playlistId}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete playlist')
  return res.json()
}

export async function addTrackToPlaylist(playlistId, trackId) {
  const res = await fetch(`${API_BASE}/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ track_id: trackId })
  })
  if (!res.ok) throw new Error('Failed to add track to playlist')
  return res.json()
}

export async function removeTrackFromPlaylist(playlistId, trackId) {
  const res = await fetch(`${API_BASE}/playlists/${playlistId}/tracks/${trackId}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to remove track from playlist')
  return res.json()
}

export async function fetchFavorites() {
  const res = await fetch(`${API_BASE}/favorites`)
  if (!res.ok) throw new Error('Failed to fetch favorites')
  return res.json()
}

export async function toggleFavorite(trackId) {
  const res = await fetch(`${API_BASE}/favorites/${trackId}`, {
    method: 'POST'
  })
  if (!res.ok) throw new Error('Failed to toggle favorite')
  return res.json()
}
