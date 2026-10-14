import { useRef, useEffect } from 'react'

// Render "Mr. Mak" as animated particle dots.
// Technique: draw text to an offscreen canvas, sample pixels, animate as particles.
// Re-samples once webfonts finish loading so the glyphs stay crisp.

export default function MakText({ height = 28, animated = true }: { height?: number; animated?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const reduced = !animated || (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
    const textH = height

    let animId = 0
    let cancelled = false
    let points: { x: number; y: number }[] = []
    let textW = 120

    const sample = () => {
      const offscreen = document.createElement('canvas')
      const offCtx = offscreen.getContext('2d')
      if (!offCtx) return
      const fontSize = height * 0.85
      const font = `700 ${fontSize}px "Inter", "Segoe UI", system-ui, sans-serif`
      offCtx.font = font
      textW = Math.ceil(offCtx.measureText('Mr. Mak').width) + 4

      offscreen.width = textW
      offscreen.height = textH
      offCtx.font = font
      offCtx.fillStyle = '#fff'
      offCtx.textBaseline = 'middle'
      offCtx.fillText('Mr. Mak', 1, textH / 2)

      const data = offCtx.getImageData(0, 0, textW, textH).data
      const pts: { x: number; y: number }[] = []
      const step = 1.8  // density of dots
      for (let y = 0; y < textH; y += step) {
        for (let x = 0; x < textW; x += step) {
          const alpha = data[(Math.floor(y) * textW + Math.floor(x)) * 4 + 3]
          if (alpha > 100) pts.push({ x, y })
        }
      }
      points = pts

      canvas.width = textW * dpr
      canvas.height = textH * dpr
      canvas.style.width = `${textW}px`
      canvas.style.height = `${textH}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = (time: number) => {
      ctx.clearRect(0, 0, textW, textH)
      const pulse = Math.sin(time * 0.001) * 0.04 + 1

      for (const pt of points) {
        const jx = Math.sin(time * 0.0015 + pt.x * 0.25 + pt.y * 0.3) * 0.3
        const jy = Math.cos(time * 0.0012 + pt.x * 0.2 + pt.y * 0.4) * 0.2
        const r = (0.75 + Math.sin(time * 0.002 + pt.x * 0.1 + pt.y * 0.15) * 0.12) * pulse
        const alpha = 0.5 + Math.sin(time * 0.0018 + pt.x * 0.3 + pt.y * 0.2) * 0.2

        ctx.beginPath()
        ctx.arc(pt.x + jx, pt.y + jy, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(235, 235, 240, ${alpha})`
        ctx.fill()
      }

      if (!reduced) animId = requestAnimationFrame(draw)
    }

    sample()
    if (reduced) draw(0)
    else animId = requestAnimationFrame(draw)

    // Inter may swap in after first paint — re-sample for crisp glyphs.
    document.fonts?.ready.then(() => {
      if (cancelled) return
      sample()
      if (reduced) draw(0)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(animId)
    }
  }, [height, animated])

  return <canvas ref={canvasRef} style={{ height, display: 'block' }} />
}
