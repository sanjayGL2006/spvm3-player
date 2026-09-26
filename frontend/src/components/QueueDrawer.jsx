import React from 'react'

export default function QueueDrawer({
  isOpen,
  onClose,
  queue = [],
  currentTrack,
  isPlaying,
  onSelectTrack,
  onRemoveFromQueue,
  onClearQueue
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {queue.length > 0 && onClearQueue && (
            <button className="clear-queue-btn" onClick={onClearQueue} title="Clear Queue">
              Clear All
            </button>
          )}
          <button className="close-queue-btn" onClick={onClose} title="Close Queue">
            ✕
          </button>
        </div>
      </div>

      <div className="queue-list">
        {queue.length === 0 ? (
          <div className="empty-queue-state">
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📑</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              Queue is empty
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Click ➕ on any track to add it to your playback queue.
            </p>
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
                <div className="queue-idx-badge">{idx + 1}</div>
                <img
                  src={track.cover}
                  alt={track.title}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" fill="%238b5cf6" viewBox="0 0 16 16"><path d="M9 13c0 1.105-1.12 2-2.5 2S4 14.105 4 13s1.12-2 2.5-2 2.5.895 2.5 2z"/><path fill-rule="evenodd" d="M9 3v10H8V3h1z"/><path d="M8 2.82a1 1 0 0 1 .804-.98l3-.6A1 1 0 0 1 13 2.22V4L8 5V2.82z"/></svg>'
                  }}
                />
                <div className="queue-meta">
                  <div className="queue-song-title">{track.title}</div>
                  <div className="queue-song-artist">{track.artist}</div>
                </div>

                {onRemoveFromQueue && (
                  <button
                    className="queue-remove-btn"
                    title="Remove from queue"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveFromQueue(idx)
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
