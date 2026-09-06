import React from 'react'

export default function Sidebar({
  activeView,
  setActiveView,
  activePlaylistId,
  setActivePlaylistId,
  playlists = [],
  favoritesCount = 0,
  tracksCount = 0,
  onOpenCreatePlaylist
}) {
  return (
    <aside className="sidebar">
      <div
        className="brand"
        onClick={() => {
          setActiveView('library')
          setActivePlaylistId(null)
        }}
      >
        <div className="brand-icon">🎧</div>
        <div>
          <div className="brand-title">SPVM3 Player</div>
          <div className="brand-tag">Hi-Fi Audio</div>
        </div>
      </div>

      <nav className="nav-section">
        <div className="nav-label">Discover</div>
        <button
          className={`nav-item ${activeView === 'library' && !activePlaylistId ? 'active' : ''}`}
          onClick={() => {
            setActiveView('library')
            setActivePlaylistId(null)
          }}
        >
          <span className="icon">🎵</span>
          <span>Library</span>
          <span className="nav-badge">{tracksCount}</span>
        </button>

        <button
          className={`nav-item ${activeView === 'favorites' ? 'active' : ''}`}
          onClick={() => {
            setActiveView('favorites')
            setActivePlaylistId(null)
          }}
        >
          <span className="icon" style={{ color: 'var(--heart-active)' }}>❤️</span>
          <span>Favorites</span>
          <span className="nav-badge">{favoritesCount}</span>
        </button>
      </nav>

      <div className="nav-section" style={{ flex: 1 }}>
        <div className="playlist-header-row">
          <span className="nav-label" style={{ padding: 0 }}>Playlists</span>
          <button
            className="add-playlist-btn"
            title="Create New Playlist"
            onClick={onOpenCreatePlaylist}
          >
            ＋
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
          {playlists.map((pl) => (
            <button
              key={pl.id}
              className={`playlist-item ${activePlaylistId === pl.id ? 'active' : ''}`}
              onClick={() => {
                setActiveView('playlist')
                setActivePlaylistId(pl.id)
              }}
              title={pl.description || pl.name}
            >
              <span className="icon">💿</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pl.name}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {pl.track_count ?? pl.track_ids?.length ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--accent-secondary)', marginBottom: '4px' }}>
          ⚡ REAL AUDIO LINKED
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          Direct stream from <code>/songs</code> with HTTP 206 range seeking support.
        </div>
      </div>
    </aside>
  )
}
