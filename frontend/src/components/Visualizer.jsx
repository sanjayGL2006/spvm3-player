import React, { useEffect, useRef } from 'react'

export default function Visualizer({ isPlaying }) {
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let phase = 0
    const barCount = 48

    const render = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio || 600
      canvas.height = canvas.offsetHeight * window.devicePixelRatio || 80
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const w = canvas.width
      const h = canvas.height
      const barWidth = (w / barCount) * 0.7
      const gap = (w / barCount) * 0.3

      const gradient = ctx.createLinearGradient(0, h, 0, 0)
      gradient.addColorStop(0, '#8b5cf6')
      gradient.addColorStop(0.5, '#06b6d4')
      gradient.addColorStop(1, '#a855f7')

      ctx.fillStyle = gradient

      for (let i = 0; i < barCount; i++) {
        let barHeight
        if (isPlaying) {
          const wave1 = Math.sin(phase * 0.08 + i * 0.25)
          const wave2 = Math.cos(phase * 0.05 + i * 0.15)
          const factor = Math.abs(wave1 * 0.6 + wave2 * 0.4)
          barHeight = Math.max(6, factor * (h * 0.75))
        } else {
          barHeight = 4
        }

        const x = i * (barWidth + gap) + gap / 2
        const y = h - barHeight

        ctx.beginPath()
        ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0])
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
      <div className="visualizer-label">Audio Frequency Waveform</div>
      <canvas ref={canvasRef} className="visualizer-canvas" />
    </div>
  )
}
