import React, { useEffect, useRef } from 'react'

export default function Visualizer({ isPlaying }) {
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let phase = 0
    const barCount = 64

    const render = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      
      ctx.clearRect(0, 0, rect.width, rect.height)

      const w = rect.width
      const h = rect.height
      const barWidth = (w / barCount) * 0.65
      const gap = (w / barCount) * 0.35

      const gradient = ctx.createLinearGradient(0, h, 0, 0)
      gradient.addColorStop(0, '#8b5cf6')
      gradient.addColorStop(0.5, '#06b6d4')
      gradient.addColorStop(1, '#ec4899')

      ctx.fillStyle = gradient

      for (let i = 0; i < barCount; i++) {
        let barHeight
        if (isPlaying) {
          const wave1 = Math.sin(phase * 0.07 + i * 0.2)
          const wave2 = Math.cos(phase * 0.04 + i * 0.12)
          const wave3 = Math.sin(phase * 0.09 + i * 0.3)
          const factor = Math.abs(wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2)
          barHeight = Math.max(6, factor * (h * 0.8))
        } else {
          barHeight = 4
        }

        const x = i * (barWidth + gap) + gap / 2
        const y = h - barHeight

        ctx.beginPath()
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0])
        } else {
          ctx.rect(x, y, barWidth, barHeight)
        }
        ctx.fill()
      }

      if (isPlaying) {
        phase += 1
      }
      animFrameRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isPlaying])

  return (
    <div className="visualizer-card">
      <div className="visualizer-header">
        <span className="visualizer-label">⚡ Audio Frequency Spectrum</span>
        <span className={`visualizer-badge ${isPlaying ? 'active' : ''}`}>
          {isPlaying ? 'LIVE AUDIO PULSE' : 'PAUSED'}
        </span>
      </div>
      <canvas ref={canvasRef} className="visualizer-canvas" />
    </div>
  )
}
