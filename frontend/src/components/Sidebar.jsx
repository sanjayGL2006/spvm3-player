import React from 'react'

export default function Sidebar({
  activeView,
  setActiveView,
  activePlaylistId,
  setActivePlaylistId,
  playlists = [],
  favoritesCount = 0,
  tracksCount = 0,
  onOpenCreatePlaylist,
  onDeletePlaylist
}) {
  return (
    <aside className="sidebar">
      <div
        className="brand"
        onClick={() => {
          setActiveView('library')
          setActivePlaylistId(null)
        }}
        title="SPVM3 Player Home"
      >
        <div className="brand-icon">🎧</div>
        <div>
          <div className="brand-title">SPVM3 Player</div>
          <div className="brand-tag">Hi-Fi Studio</div>
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
          {playlists.length === 0 ? (
            <div style={{ padding: '8px 12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              No custom playlists
            </div>
          ) : (
            playlists.map((pl) => (
              <div
                key={pl.id}
                className={`playlist-item-wrapper ${activePlaylistId === pl.id ? 'active' : ''}`}
              >
                <button
                  className={`playlist-item ${activePlaylistId === pl.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveView('playlist')
                    setActivePlaylistId(pl.id)
                  }}
                  title={pl.description || pl.name}
                >
                  <span className="icon">💿</span>
                  <span className="pl-name">
                    {pl.name}
                  </span>
                  <span className="pl-count">
                    {pl.track_count ?? pl.track_ids?.length ?? 0}
                  </span>
                </button>
                {onDeletePlaylist && (
                  <button
                    className="delete-playlist-btn"
                    title={`Delete playlist "${pl.name}"`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeletePlaylist(pl.id)
                    }}
                  >
                    🗑
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="sidebar-footer-card">
        <div className="footer-card-title">
          ⚡ REAL AUDIO STREAMING
        </div>
        <div className="footer-card-body">
          Direct stream from <code>/songs</code> with HTTP 206 range seeking support.
        </div>
      </div>
    </aside>
  )
}
