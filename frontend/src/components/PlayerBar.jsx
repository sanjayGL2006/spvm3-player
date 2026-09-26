import React, { useState } from 'react'

export default function PlayerBar({
  track,
  isPlaying,
  progress,
  duration,
  volume,
  isMuted,
  shuffle,
  repeatMode, // 'off' | 'all' | 'one'
  showVisualizer,
  showQueue,
  queueLength = 0,
  onPlayPause,
  onSeek,
  onNext,
  onPrev,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  onToggleVisualizer,
  onToggleQueue,
  onToggleFavorite
}) {
  const [isSeeking, setIsSeeking] = useState(false)
  const [seekValue, setSeekValue] = useState(0)
  const [showRemainingTime, setShowRemainingTime] = useState(false)

  if (!track) return null

  function formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const totalDuration = duration || track.duration || 100
  const effectiveProgress = isSeeking ? seekValue : progress
  const remainingSec = Math.max(0, totalDuration - effectiveProgress)
  const displayVolume = isMuted ? 0 : volume

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return '🔇'
    if (volume < 0.3) return '🔈'
    if (volume < 0.7) return '🔉'
    return '🔊'
  }

  const getRepeatIcon = () => {
    if (repeatMode === 'one') return '🔂'
    return '🔁'
  }

  const handleVolumeWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.05 : -0.05
    const newVol = Math.min(1, Math.max(0, volume + delta))
    onVolumeChange(Math.round(newVol * 100) / 100)
  }

  return (
    <footer className="player-bar">
      {/* Left: Track Information */}
      <div className="now-playing">
        <div className={`np-art-wrap ${isPlaying ? 'playing' : ''}`}>
          <img
            src={track.cover}
            alt={track.title}
            className="np-art"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" fill="%238b5cf6" viewBox="0 0 16 16"><path d="M9 13c0 1.105-1.12 2-2.5 2S4 14.105 4 13s1.12-2 2.5-2 2.5.895 2.5 2z"/><path fill-rule="evenodd" d="M9 3v10H8V3h1z"/><path d="M8 2.82a1 1 0 0 1 .804-.98l3-.6A1 1 0 0 1 13 2.22V4L8 5V2.82z"/></svg>'
            }}
          />
        </div>

        <div className="np-details">
          <div className="np-title" title={track.title}>{track.title}</div>
          <div className="np-artist" title={track.artist}>{track.artist}</div>
        </div>

        <button
          className={`action-btn ${track.is_favorite ? 'favorite-active' : ''}`}
          style={{ marginLeft: '6px' }}
          title={track.is_favorite ? 'Favorited' : 'Add to favorites'}
          onClick={() => onToggleFavorite(track.id)}
        >
          {track.is_favorite ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Center: Playback Controls & Timeline */}
      <div className="player-controls-center">
        <div className="control-buttons-row">
          <button
            className={`ctrl-btn ${shuffle ? 'active-mode' : ''}`}
            title={`Shuffle: ${shuffle ? 'On' : 'Off'}`}
            onClick={onToggleShuffle}
          >
            🔀
          </button>

          <button className="ctrl-btn" title="Previous (P)" onClick={onPrev}>
            ⏮
          </button>

          <button
            className="ctrl-btn-play"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            onClick={onPlayPause}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          <button className="ctrl-btn" title="Next (N)" onClick={onNext}>
            ⏭
          </button>

          <button
            className={`ctrl-btn ${repeatMode !== 'off' ? 'active-mode' : ''}`}
            title={`Repeat: ${repeatMode.toUpperCase()}`}
            onClick={onToggleRepeat}
          >
            {getRepeatIcon()}
          </button>
        </div>

        <div className="playback-progress-row">
          <span className="time-label">{formatTime(effectiveProgress)}</span>
          <input
            type="range"
            className="seek-slider"
            min="0"
            max={totalDuration}
            step="0.1"
            value={effectiveProgress || 0}
            onMouseDown={() => setIsSeeking(true)}
            onTouchStart={() => setIsSeeking(true)}
            onChange={(e) => setSeekValue(Number(e.target.value))}
            onMouseUp={(e) => {
              setIsSeeking(false)
              onSeek(Number(e.target.value))
            }}
            onTouchEnd={(e) => {
              setIsSeeking(false)
              onSeek(Number(e.target.value))
            }}
            style={{
              background: `linear-gradient(to right, var(--accent-primary) ${(effectiveProgress / totalDuration) * 100}%, rgba(255, 255, 255, 0.15) ${(effectiveProgress / totalDuration) * 100}%)`
            }}
          />
          <span
            className="time-label clickable"
            title="Click to toggle remaining time"
            onClick={() => setShowRemainingTime(!showRemainingTime)}
          >
            {showRemainingTime ? `-${formatTime(remainingSec)}` : formatTime(totalDuration)}
          </span>
        </div>
      </div>

      {/* Right: Extra Utilities & Volume */}
      <div className="player-controls-right">
        <button
          className={`ctrl-btn ${showVisualizer ? 'active-mode' : ''}`}
          title="Toggle Frequency Visualizer"
          onClick={onToggleVisualizer}
        >
          📊
        </button>

        <button
          className={`ctrl-btn ${showQueue ? 'active-mode' : ''}`}
          title="Toggle Up Next Queue"
          onClick={onToggleQueue}
          style={{ position: 'relative' }}
        >
          📑
          {queueLength > 0 && (
            <span className="queue-badge-dot">{queueLength}</span>
          )}
        </button>

        <div className="volume-wrap" onWheel={handleVolumeWheel}>
          <button
            className="ctrl-btn"
            title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            onClick={onToggleMute}
          >
            {getVolumeIcon()}
          </button>
          <input
            type="range"
            className="vol-slider"
            min="0"
            max="1"
            step="0.02"
            value={displayVolume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            style={{
              background: `linear-gradient(to right, var(--accent-secondary) ${displayVolume * 100}%, rgba(255, 255, 255, 0.15) ${displayVolume * 100}%)`
            }}
          />
        </div>
      </div>
    </footer>
  )
}
