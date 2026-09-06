import { useEffect, useRef, useState } from 'react'
import {
  fetchTracks,
  fetchGenres,
  fetchPlaylists,
  createPlaylist,
  toggleFavorite
} from './api'
import Sidebar from './components/Sidebar'
import TrackList from './components/TrackList'
import PlayerBar from './components/PlayerBar'
import Visualizer from './components/Visualizer'
import QueueDrawer from './components/QueueDrawer'

export default function App() {
  // Data State
  const [tracks, setTracks] = useState([])
  const [genres, setGenres] = useState([])
  const [playlists, setPlaylists] = useState([])

  // Navigation & Filter State
  const [activeView, setActiveView] = useState('library') // 'library' | 'favorites' | 'playlist'
  const [activePlaylistId, setActivePlaylistId] = useState(null)
  const [activeGenre, setActiveGenre] = useState('All')
  const [search, setSearch] = useState('')

  // Playback State
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeatMode, setRepeatMode] = useState('off') // 'off' | 'all' | 'one'

  // Queue & Extras
  const [queue, setQueue] = useState([])
  const [showVisualizer, setShowVisualizer] = useState(false)
  const [showQueue, setShowQueue] = useState(false)

  // Playlist Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [playlistName, setPlaylistName] = useState('')
  const [playlistDesc, setPlaylistDesc] = useState('')

  const audioRef = useRef(null)

  // Initial Data Load
  useEffect(() => {
    fetchGenres().then(setGenres).catch(console.error)
    fetchPlaylists().then(setPlaylists).catch(console.error)
  }, [])

  // Fetch Tracks based on filters
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTracks({
        genre: activeGenre,
        search,
        playlistId: activeView === 'playlist' ? activePlaylistId : undefined
      })
        .then((data) => {
          let list = data
          if (activeView === 'favorites') {
            list = data.filter((t) => t.is_favorite)
          }
          setTracks(list)
          if (!currentTrack && list.length > 0) {
            setCurrentTrack(list[0])
          }
        })
        .catch(console.error)
    }, 150)

    return () => clearTimeout(timer)
  }, [activeGenre, search, activeView, activePlaylistId])

  // Track switching audio source
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return
    const audio = audioRef.current
    const sourceUrl = currentTrack.audio_url || currentTrack.direct_url
    if (audio.src !== window.location.origin + sourceUrl && !audio.src.endsWith(sourceUrl)) {
      audio.src = sourceUrl
      audio.load()
    }
    if (isPlaying) {
      audio.play().catch((err) => {
        console.warn('Playback autoplay policy prevented play:', err)
        setIsPlaying(false)
      })
    }
  }, [currentTrack])

  // Volume & Mute sync
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['input', 'textarea'].includes(e.target.tagName.toLowerCase())) return

      if (e.code === 'Space') {
        e.preventDefault()
        handlePlayPause()
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        handleSeek(Math.min((duration || 0), (audioRef.current?.currentTime || 0) + 5))
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        handleSeek(Math.max(0, (audioRef.current?.currentTime || 0) - 5))
      } else if (e.code === 'ArrowUp') {
        e.preventDefault()
        setVolume((v) => Math.min(1, Math.round((v + 0.05) * 100) / 100))
        setIsMuted(false)
      } else if (e.code === 'ArrowDown') {
        e.preventDefault()
        setVolume((v) => Math.max(0, Math.round((v - 0.05) * 100) / 100))
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        setIsMuted((m) => !m)
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        handlePrev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, duration, currentTrack, tracks, queue, shuffle, repeatMode])

  function handlePlayPause() {
    if (!audioRef.current || !currentTrack) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((err) => {
        console.error('Play failed:', err)
      })
    }
  }

  function handleSelect(track) {
    setCurrentTrack(track)
    setIsPlaying(true)
    setProgress(0)
  }

  function handleNext() {
    if (repeatMode === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
      return
    }

    // Check custom queue first
    if (queue.length > 0) {
      const [nextQueued, ...restQueue] = queue
      setQueue(restQueue)
      handleSelect(nextQueued)
      return
    }

    if (!tracks.length || !currentTrack) return

    if (shuffle) {
      const remainingTracks = tracks.filter((t) => t.id !== currentTrack.id)
      if (remainingTracks.length > 0) {
        const randomTrack = remainingTracks[Math.floor(Math.random() * remainingTracks.length)]
        handleSelect(randomTrack)
        return
      }
    }

    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id)
    if (currentIndex === -1) {
      handleSelect(tracks[0])
      return
    }

    const nextIndex = currentIndex + 1
    if (nextIndex < tracks.length) {
      handleSelect(tracks[nextIndex])
    } else if (repeatMode === 'all') {
      handleSelect(tracks[0])
    } else {
      setIsPlaying(false)
    }
  }

  function handlePrev() {
    if (!tracks.length || !currentTrack) return
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0
      setProgress(0)
      return
    }
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id)
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length
    handleSelect(tracks[prevIndex])
  }

  function handleSeek(value) {
    if (audioRef.current) {
      audioRef.current.currentTime = value
    }
    setProgress(value)
  }

  function handleToggleRepeat() {
    if (repeatMode === 'off') setRepeatMode('all')
    else if (repeatMode === 'all') setRepeatMode('one')
    else setRepeatMode('off')
  }

  function handleToggleFavorite(trackId) {
    toggleFavorite(trackId)
      .then((res) => {
        setTracks((prev) =>
          prev.map((t) => (t.id === trackId ? { ...t, is_favorite: res.is_favorite } : t))
        )
        if (currentTrack?.id === trackId) {
          setCurrentTrack((prev) => ({ ...prev, is_favorite: res.is_favorite }))
        }
      })
      .catch(console.error)
  }

  function handleAddToQueue(track) {
    setQueue((prev) => [...prev, track])
  }

  function handleCreatePlaylistSubmit(e) {
    e.preventDefault()
    if (!playlistName.trim()) return
    createPlaylist({ name: playlistName, description: playlistDesc })
      .then((created) => {
        setPlaylists((prev) => [...prev, created])
        setIsCreateModalOpen(false)
        setPlaylistName('')
        setPlaylistDesc('')
        setActiveView('playlist')
        setActivePlaylistId(created.id)
      })
      .catch(console.error)
  }

  const favoritesCount = tracks.filter((t) => t.is_favorite).length
  const activePlaylist = playlists.find((p) => p.id === activePlaylistId)

  return (
    <div className="app-container">
      {/* Hidden Audio Streamer with Range Seeking Support */}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={(e) => setProgress(e.target.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onEnded={handleNext}
        onError={(e) => console.error('Audio stream error:', e)}
      />

      {/* Left Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        activePlaylistId={activePlaylistId}
        setActivePlaylistId={setActivePlaylistId}
        playlists={playlists}
        favoritesCount={favoritesCount}
        tracksCount={tracks.length}
        onOpenCreatePlaylist={() => setIsCreateModalOpen(true)}
      />

      {/* Center Main Stage */}
      <main className="main-wrapper">
        <header className="top-bar">
          <div className="search-and-stats">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search tracks, artists, albums..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="clear-search" onClick={() => setSearch('')}>
                  ✕
                </button>
              )}
            </div>

            <div className="library-meta">
              <span className="status-pill">
                <span className="status-dot"></span>
                Connected to Library
              </span>
              <span>{tracks.length} songs</span>
            </div>
          </div>

          <div className="genre-row">
            {['All', ...genres].map((g) => (
              <button
                key={g}
                className={`genre-chip ${activeGenre === g ? 'active' : ''}`}
                onClick={() => setActiveGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </header>

        {/* Dynamic Waveform Visualizer */}
        {showVisualizer && <Visualizer isPlaying={isPlaying} />}

        {/* View Header Info */}
        <div className="view-header">
          <div>
            <h1 className="view-title">
              {activeView === 'library'
                ? 'All Tracks'
                : activeView === 'favorites'
                ? 'Favorite Songs'
                : activePlaylist?.name || 'Playlist'}
            </h1>
            <p className="view-subtitle">
              {activeView === 'library'
                ? 'Your local high-fidelity audio collection'
                : activeView === 'favorites'
                ? 'Songs you have loved and marked as favorite'
                : activePlaylist?.description || 'Custom playlist'}
            </p>
          </div>
        </div>

        {/* Tracks Table */}
        <section className="content-area">
          <TrackList
            tracks={tracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onSelect={handleSelect}
            onToggleFavorite={handleToggleFavorite}
            onAddToQueue={handleAddToQueue}
          />
        </section>
      </main>

      {/* Slide-out Up Next Queue Drawer */}
      <QueueDrawer
        isOpen={showQueue}
        onClose={() => setShowQueue(false)}
        queue={queue}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onSelectTrack={(track) => {
          handleSelect(track)
          setQueue((prev) => prev.filter((t) => t.id !== track.id))
        }}
      />

      {/* Glassmorphic Sticky Player Bar */}
      <PlayerBar
        track={currentTrack}
        isPlaying={isPlaying}
        progress={progress}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        shuffle={shuffle}
        repeatMode={repeatMode}
        showVisualizer={showVisualizer}
        showQueue={showQueue}
        queueLength={queue.length}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onNext={handleNext}
        onPrev={handlePrev}
        onVolumeChange={(val) => {
          setVolume(val)
          setIsMuted(false)
        }}
        onToggleMute={() => setIsMuted((m) => !m)}
        onToggleShuffle={() => setShuffle((s) => !s)}
        onToggleRepeat={handleToggleRepeat}
        onToggleVisualizer={() => setShowVisualizer((v) => !v)}
        onToggleQueue={() => setShowQueue((q) => !q)}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Create Playlist Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Create New Playlist</div>
            <form onSubmit={handleCreatePlaylistSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="text"
                className="modal-input"
                placeholder="Playlist name..."
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                autoFocus
                required
              />
              <textarea
                className="modal-textarea"
                rows="3"
                placeholder="Description (optional)..."
                value={playlistDesc}
                onChange={(e) => setPlaylistDesc(e.target.value)}
              />
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
