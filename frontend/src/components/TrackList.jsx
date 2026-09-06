import React from 'react'

export default function TrackList({
  tracks = [],
  currentTrack,
  isPlaying,
  onSelect,
  onToggleFavorite,
  onAddToQueue
}) {
  function formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (tracks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🎵</div>
        <div className="empty-title">No tracks found</div>
        <p>Try searching for another song, artist, or clearing your genre filter.</p>
      </div>
    )
  }

  return (
    <table className="track-table">
      <thead>
        <tr>
          <th style={{ width: '50px', textAlign: 'center' }}>#</th>
          <th>Title</th>
          <th>Album</th>
          <th>Genre</th>
          <th style={{ textAlign: 'right', paddingRight: '24px' }}>Duration</th>
        </tr>
      </thead>
      <tbody>
        {tracks.map((track, i) => {
          const isActive = currentTrack?.id === track.id
          const isCurrentlyPlaying = isActive && isPlaying

          return (
            <tr
              key={track.id}
              className={`track-row ${isActive ? 'active' : ''}`}
              onClick={() => onSelect(track)}
            >
              <td>
                <div className="track-index-col">
                  {isCurrentlyPlaying ? (
                    <div className="eq-bars">
                      <div className="eq-bar"></div>
                      <div className="eq-bar"></div>
                      <div className="eq-bar"></div>
                      <div className="eq-bar"></div>
                    </div>
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
              </td>

              <td>
                <div className="track-title-col">
                  <div className="track-cover-wrap">
                    <img
                      src={track.cover}
                      alt={track.title}
                      className="track-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="%236366f1" viewBox="0 0 16 16"><path d="M9 13c0 1.105-1.12 2-2.5 2S4 14.105 4 13s1.12-2 2.5-2 2.5.895 2.5 2z"/><path fill-rule="evenodd" d="M9 3v10H8V3h1z"/><path d="M8 2.82a1 1 0 0 1 .804-.98l3-.6A1 1 0 0 1 13 2.22V4L8 5V2.82z"/></svg>'
                      }}
                    />
                  </div>
                  <div className="track-info">
                    <span className="track-name">{track.title}</span>
                    <span className="track-artist">{track.artist}</span>
                  </div>
                </div>
              </td>

              <td>
                <span className="track-album">{track.album || 'Single'}</span>
              </td>

              <td>
                <span className="track-genre-badge">{track.genre || 'Soundtrack'}</span>
              </td>

              <td>
                <div className="track-actions">
                  <button
                    className={`action-btn ${track.is_favorite ? 'favorite-active' : ''}`}
                    title={track.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleFavorite(track.id)
                    }}
                  >
                    {track.is_favorite ? '❤️' : '🤍'}
                  </button>

                  <button
                    className="action-btn"
                    title="Add to queue"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddToQueue(track)
                    }}
                  >
                    ➕
                  </button>

                  <span className="track-duration">{formatTime(track.duration)}</span>
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
