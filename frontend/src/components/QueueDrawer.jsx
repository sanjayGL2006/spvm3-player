import React from 'react'

export default function QueueDrawer({
  isOpen,
  onClose,
  queue = [],
  currentTrack,
  isPlaying,
  onSelectTrack
}) {
  return (
    <aside className={`queue-drawer ${isOpen ? 'open' : ''}`}>
      <div className="queue-header">
        <div>
          <div className="queue-title">Playing Queue</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {queue.length} {queue.length === 1 ? 'track' : 'tracks'} up next
          </div>
        </div>
        <button className="close-queue-btn" onClick={onClose} title="Close Queue">
          ✕
        </button>
      </div>

      <div className="queue-list">
        {queue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            Queue is currently empty
          </div>
        ) : (
          queue.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id
            return (
              <div
                key={`${track.id}-${idx}`}
                className={`queue-item ${isCurrent ? 'active' : ''}`}
                onClick={() => onSelectTrack(track)}
              >
                <img
                  src={track.cover}
                  alt={track.title}
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
                <div className="queue-meta">
                  <div className="queue-song-title">{track.title}</div>
                  <div className="queue-song-artist">{track.artist}</div>
                </div>
                {isCurrent && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: '600' }}>
                    {isPlaying ? 'Playing' : 'Paused'}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
