import { useEffect, useRef } from 'react'

/**
 * Motor 3D Multi-Espectral NASA Satellites × Alcaldía de Cochabamba (GAMC)
 * Renderiza en tiempo real:
 * - Constelación orbital superior (NASA Landsat-9 TIRS, ISS ECOSTRESS, Sentinel-2 MSI)
 *   con paneles solares vectoriales, trayectorias orbitales y haces cónicos de escaneo.
 * - Relieve 3D del Valle de Cochabamba (Cordillera del Tunari, Cuenca Central, Sur).
 * - Nodos terrestres sincronizados con APIs de la Alcaldía (GAMC) enviando pulsos de
 *   telemetría hacia la órbita baja terrestre (LEO).
 */
export function InteractiveOrbitalValleyCanvas({
  mode = 'hero', // 'hero' | 'login'
  activeLayer = 'dual', // 'dual' | 'thermal' | 'ndvi'
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const mouse = { x: 0.52, y: 0.48, targetX: 0.52, targetY: 0.48 }

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX / Math.max(1, width)
      mouse.targetY = e.clientY / Math.max(1, height)
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('resize', handleResize)

    const paletteParticles = ['#43A875', '#FFCB73', '#F28B50', '#8875D8', '#65C8F2', '#F5F7FC']
    const stars = Array.from({ length: 105 }, (_, i) => ({
      x: ((i * 73) % 100) / 100,
      y: ((i * 41) % 100) / 100,
      r: (i % 3) * 0.65 + 0.55,
      alpha: 0.24 + ((i * 19) % 65) / 100,
      speed: ((i % 4) + 1) * 0.00009,
      hue: paletteParticles[i % paletteParticles.length],
    }))

    // Nodos terrestres: Fusión Satélites NASA + APIs Alcaldía de Cochabamba (GAMC)
    const hotspots = [
      { r: 6, c: 9, code: 'NASA S2 · TUNARI NDVI', sub: 'GAMC Subalcaldía Tunari', kind: 'veg', barH: 58 },
      { r: 11, c: 15, code: 'API GAMC · RÍO ROCHA', sub: 'Corredor Biológico Urbano', kind: 'veg', barH: 48 },
      { r: 15, c: 22, code: 'LANDSAT 9 · ISLA CALOR', sub: 'GAMC Centro Histórico', kind: 'lst', barH: 68 },
      { r: 10, c: 28, code: 'ECOSTRESS · FLUJO LST', sub: 'GAMC Adela Zamudio', kind: 'ai', barH: 52 },
      { r: 18, c: 13, code: 'MODIS/TIRS · SUR LST', sub: 'GAMC Itocta / Alalay', kind: 'lst', barH: 60 },
      { r: 13, c: 32, code: 'NASADEM · 2558m', sub: 'API Catastro GAMC', kind: 'cyan', barH: 46 },
    ]

    const computeElevation = (nx, nz, t) => {
      const cordillera =
        Math.exp(-Math.pow((nz - 0.17) * 3.5, 2)) *
        (58 + Math.sin(nx * 5.0 + t * 0.45) * 23)
      const valley = Math.pow(nx * 1.12, 2) * 36
      const waves =
        Math.sin(nx * 4.2 + t * 0.6) * Math.cos(nz * 3.8 - t * 0.4) * 15 +
        Math.cos((nx + nz) * 7.0 + t * 0.45) * 6
      return cordillera + valley + waves
    }

    // Dibuja un satélite vectorial con paneles solares y anillo de telemetría
    const drawSatelliteCraft = (sx, sy, colorHex, label, subLabel, scale = 1) => {
      ctx.save()
      ctx.translate(sx, sy)
      ctx.scale(scale, scale)

      // Halo orbital
      ctx.beginPath()
      ctx.arc(0, 0, 18, 0, Math.PI * 2)
      ctx.strokeStyle = `${colorHex}44`
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.stroke()
      ctx.setLineDash([])

      // Paneles solares izquierdos y derechos
      ctx.fillStyle = 'rgba(17, 27, 50, 0.9)'
      ctx.strokeStyle = colorHex
      ctx.lineWidth = 1.3
      ctx.fillRect(-22, -4, 14, 8)
      ctx.strokeRect(-22, -4, 14, 8)
      ctx.fillRect(8, -4, 14, 8)
      ctx.strokeRect(8, -4, 14, 8)

      // Cuerpo central del satélite NASA
      ctx.fillStyle = colorHex
      ctx.fillRect(-5, -6, 10, 12)

      // Lente / Sensor nadir
      ctx.beginPath()
      ctx.arc(0, 0, 3, 0, Math.PI * 2)
      ctx.fillStyle = '#F5F7FC'
      ctx.fill()

      // Etiqueta del satélite
      ctx.font = '700 10px "JetBrains Mono", monospace'
      ctx.fillStyle = '#F5F7FC'
      ctx.fillText(label, 26, -2)
      ctx.font = '500 8.5px "JetBrains Mono", monospace'
      ctx.fillStyle = colorHex
      ctx.fillText(subLabel, 26, 9)

      ctx.restore()
    }

    const start = performance.now()

    const draw = (now) => {
      const t = (now - start) * 0.001

      mouse.x += (mouse.targetX - mouse.x) * 0.06
      mouse.y += (mouse.targetY - mouse.y) * 0.06

      const camTiltX = (mouse.x - 0.5) * 0.25
      const camTiltY = (mouse.y - 0.5) * 0.15

      // 1. Fondo Espacio Profundo (#06080F)
      ctx.fillStyle = '#06080F'
      ctx.fillRect(0, 0, width, height)

      // Auroras Espectrales (Verde NDVI, Coral/Ámbar LST, Violeta Geo-AI)
      const glowVeg = ctx.createRadialGradient(
        width * 0.24 + camTiltX * 140,
        height * 0.36 + camTiltY * 90,
        20,
        width * 0.24,
        height * 0.36,
        Math.max(width, height) * 0.48
      )
      glowVeg.addColorStop(0, 'rgba(67, 168, 117, 0.24)')
      glowVeg.addColorStop(0.5, 'rgba(35, 123, 91, 0.09)')
      glowVeg.addColorStop(1, 'rgba(6, 8, 15, 0)')
      ctx.fillStyle = glowVeg
      ctx.fillRect(0, 0, width, height)

      const glowThermal = ctx.createRadialGradient(
        width * 0.64 - camTiltX * 130,
        height * 0.58 - camTiltY * 90,
        20,
        width * 0.64,
        height * 0.58,
        Math.max(width, height) * 0.46
      )
      glowThermal.addColorStop(0, 'rgba(242, 139, 80, 0.22)')
      glowThermal.addColorStop(0.45, 'rgba(217, 87, 87, 0.10)')
      glowThermal.addColorStop(1, 'rgba(6, 8, 15, 0)')
      ctx.fillStyle = glowThermal
      ctx.fillRect(0, 0, width, height)

      const glowAI = ctx.createRadialGradient(
        width * 0.76,
        height * 0.2,
        10,
        width * 0.76,
        height * 0.2,
        Math.max(width, height) * 0.42
      )
      glowAI.addColorStop(0, 'rgba(136, 117, 216, 0.22)')
      glowAI.addColorStop(0.55, 'rgba(101, 200, 242, 0.08)')
      glowAI.addColorStop(1, 'rgba(6, 8, 15, 0)')
      ctx.fillStyle = glowAI
      ctx.fillRect(0, 0, width, height)

      // 2. Estrellas y partículas de telemetría
      stars.forEach((s, idx) => {
        s.y -= s.speed
        if (s.y < 0) s.y = 1
        const sx = ((s.x + camTiltX * 0.09 + 1) % 1) * width
        const sy = s.y * height
        const twinkle = s.alpha * (0.6 + 0.4 * Math.sin(t * 2.2 + idx))

        ctx.beginPath()
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2)
        ctx.fillStyle = s.hue
        ctx.globalAlpha = twinkle
        ctx.fill()
      })
      ctx.globalAlpha = 1

      // 3. Malla 3D Multiespectral del Valle de Cochabamba
      const rows = 26
      const cols = 42
      const mesh = []

      const centerScreenX = width * 0.5 + camTiltX * 95
      const horizonY = height * (0.28 + camTiltY * 0.11)

      for (let r = 0; r < rows; r++) {
        const rowPts = []
        const nz = r / (rows - 1)
        const depth = 0.28 + nz * 0.92

        for (let c = 0; c < cols; c++) {
          const nx = (c / (cols - 1)) * 2 - 1
          const elev = computeElevation(nx, nz, t)
          const rotX =
            nx * Math.cos(camTiltX * 0.48) - (nz - 0.5) * Math.sin(camTiltX * 0.48)
          const px = centerScreenX + rotX * width * 0.96 * depth
          const py = horizonY + nz * (height * 0.72) - elev * depth * 1.32

          rowPts.push({ x: px, y: py, depth, elev, nx, nz })
        }
        mesh.push(rowPts)
      }

      const satScanCol = ((t * 3.8) % (cols + 8)) - 4

      // Líneas longitudinales
      for (let c = 0; c < cols; c += 2) {
        ctx.beginPath()
        for (let r = 0; r < rows; r++) {
          const p = mesh[r][c]
          if (r === 0) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        }
        const distScan = Math.abs(c - satScanCol)
        if (distScan < 3.0) {
          ctx.strokeStyle = `rgba(255, 203, 115, ${(0.42 * (1 - distScan / 3.0)).toFixed(3)})`
          ctx.lineWidth = 1.4
        } else {
          ctx.strokeStyle = 'rgba(245, 247, 252, 0.055)'
          ctx.lineWidth = 0.75
        }
        ctx.stroke()
      }

      // Curvas topográficas con gradiente multiespectral
      for (let r = 0; r < rows; r++) {
        const pStart = mesh[r][0]
        const pEnd = mesh[r][cols - 1]

        const rowGrad = ctx.createLinearGradient(pStart.x, pStart.y, pEnd.x, pEnd.y)
        const alphaBase = (0.18 + (r / rows) * 0.36).toFixed(3)

        if (activeLayer === 'thermal') {
          rowGrad.addColorStop(0, `rgba(255, 240, 179, ${alphaBase})`)
          rowGrad.addColorStop(0.5, `rgba(242, 139, 80, ${alphaBase})`)
          rowGrad.addColorStop(1, `rgba(217, 87, 87, ${alphaBase})`)
        } else if (activeLayer === 'ndvi') {
          rowGrad.addColorStop(0, `rgba(217, 240, 220, ${alphaBase})`)
          rowGrad.addColorStop(0.5, `rgba(67, 168, 117, ${alphaBase})`)
          rowGrad.addColorStop(1, `rgba(101, 200, 242, ${alphaBase})`)
        } else {
          rowGrad.addColorStop(0, `rgba(67, 168, 117, ${alphaBase})`)
          rowGrad.addColorStop(0.36, `rgba(101, 200, 242, ${alphaBase})`)
          rowGrad.addColorStop(0.68, `rgba(136, 117, 216, ${alphaBase})`)
          rowGrad.addColorStop(1, `rgba(242, 139, 80, ${alphaBase})`)
        }

        ctx.beginPath()
        for (let c = 0; c < cols; c++) {
          const p = mesh[r][c]
          if (c === 0) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        }
        ctx.strokeStyle = rowGrad
        ctx.lineWidth = r % 3 === 0 ? 1.5 : 0.85
        ctx.stroke()
      }

      // 4. ARCO ORBITAL SUPERIOR Y CONSTELACIÓN DE SATÉLITES NASA / EO
      const orbitYBase = Math.max(92, horizonY - 105)
      ctx.beginPath()
      ctx.moveTo(width * 0.05, orbitYBase + 45)
      ctx.quadraticCurveTo(width * 0.5, orbitYBase - 55, width * 0.95, orbitYBase + 35)
      ctx.strokeStyle = 'rgba(101, 200, 242, 0.22)'
      ctx.lineWidth = 1.2
      ctx.setLineDash([6, 6])
      ctx.stroke()
      ctx.setLineDash([])

      // Satélite 1: NASA LANDSAT-9 OLI/TIRS (Escáner principal en movimiento)
      const clampedCol = Math.max(3, Math.min(cols - 4, Math.floor(satScanCol)))
      if (satScanCol >= 2 && satScanCol <= cols - 3) {
        const satX = mesh[4][clampedCol].x
        const satY = orbitYBase - Math.sin((clampedCol / cols) * Math.PI) * 28
        const groundLeft = mesh[16][Math.max(0, clampedCol - 4)]
        const groundRight = mesh[16][Math.min(cols - 1, clampedCol + 4)]

        const beamGrad = ctx.createLinearGradient(satX, satY, satX, groundLeft.y)
        beamGrad.addColorStop(0, 'rgba(255, 203, 115, 0.38)')
        beamGrad.addColorStop(0.55, 'rgba(242, 139, 80, 0.16)')
        beamGrad.addColorStop(1, 'rgba(242, 139, 80, 0)')

        ctx.beginPath()
        ctx.moveTo(satX, satY)
        ctx.lineTo(groundLeft.x, groundLeft.y)
        ctx.lineTo(groundRight.x, groundRight.y)
        ctx.closePath()
        ctx.fillStyle = beamGrad
        ctx.fill()

        drawSatelliteCraft(
          satX,
          satY,
          '#FFCB73',
          'NASA LANDSAT-9 TIRS',
          'B10 LST · 705km LEO',
          0.95
        )
      }

      // Satélite 2: SENTINEL-2 / MODIS (Flanco Izquierdo - Huella Verde)
      const sat2X = width * (0.18 + 0.05 * Math.sin(t * 0.35))
      const sat2Y = orbitYBase + 10 + Math.cos(t * 0.4) * 8
      const targetVegNode = mesh[8]?.[10] || { x: width * 0.25, y: height * 0.55 }
      const vegBeam = ctx.createLinearGradient(sat2X, sat2Y, targetVegNode.x, targetVegNode.y)
      vegBeam.addColorStop(0, 'rgba(67, 168, 117, 0.30)')
      vegBeam.addColorStop(1, 'rgba(67, 168, 117, 0)')
      ctx.beginPath()
      ctx.moveTo(sat2X, sat2Y)
      ctx.lineTo(targetVegNode.x - 45, targetVegNode.y)
      ctx.lineTo(targetVegNode.x + 45, targetVegNode.y)
      ctx.closePath()
      ctx.fillStyle = vegBeam
      ctx.fill()

      drawSatelliteCraft(
        sat2X,
        sat2Y,
        '#43A875',
        'SENTINEL-2 / MODIS',
        'NDVI 10m · BIO-SCAN',
        0.85
      )

      //5. Torres holográficas 3D (Nodos GAMC + NASA) y pulsos ascendentes
      const projectedNodes = hotspots.map((h, i) => {
        const pt = mesh[h.r]?.[h.c] || { x: width * 0.5, y: height * 0.5, depth: 1 }
        const pulseBar = h.barH * (0.78 + 0.22 * Math.sin(t * 2.4 + i)) * pt.depth
        return {
          ...h,
          i,
          gx: pt.x,
          gy: pt.y,
          nx: pt.x,
          ny: pt.y - pulseBar,
          depth: pt.depth,
        }
      })

      // Arcos de sincronización entre nodos municipales GAMC
      for (let i = 0; i < projectedNodes.length - 1; i++) {
        const a = projectedNodes[i]
        const b = projectedNodes[i + 1]
        const midX = (a.nx + b.nx) / 2
        const midY = Math.min(a.ny, b.ny) - 38 * a.depth

        ctx.beginPath()
        ctx.moveTo(a.nx, a.ny)
        ctx.quadraticCurveTo(midX, midY, b.nx, b.ny)
        ctx.strokeStyle =
          i % 2 === 0 ? 'rgba(67, 168, 117, 0.38)' : 'rgba(242, 139, 80, 0.38)'
        ctx.setLineDash([4, 4])
        ctx.lineWidth = 1.25
        ctx.stroke()
        ctx.setLineDash([])
      }

      projectedNodes.forEach((node) => {
        const colorRGB =
          node.kind === 'lst'
            ? [242, 139, 80]
            : node.kind === 'veg'
            ? [67, 168, 117]
            : node.kind === 'ai'
            ? [136, 117, 216]
            : [101, 200, 242]

        const hex =
          node.kind === 'lst'
            ? '#F28B50'
            : node.kind === 'veg'
            ? '#43A875'
            : node.kind === 'ai'
            ? '#8875D8'
            : '#65C8F2'

        // Onda expansiva en la superficie del distrito
        const waveProg = (t * 0.48 + node.i * 0.23) % 1
        const rx = (16 + waveProg * 95) * node.depth
        const ry = rx * 0.42
        ctx.beginPath()
        ctx.ellipse(node.gx, node.gy, rx, ry, 0, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(${colorRGB[0]}, ${colorRGB[1]}, ${colorRGB[2]}, ${(
          (1 - waveProg) *
          0.6
        ).toFixed(3)})`
        ctx.lineWidth = 1.6
        ctx.stroke()

        // Columna de luz vertical 3D
        const pillarGrad = ctx.createLinearGradient(node.gx, node.gy, node.nx, node.ny)
        pillarGrad.addColorStop(0, `rgba(${colorRGB[0]}, ${colorRGB[1]}, ${colorRGB[2]}, 0.15)`)
        pillarGrad.addColorStop(1, hex)

        ctx.beginPath()
        ctx.moveTo(node.gx, node.gy)
        ctx.lineTo(node.nx, node.ny)
        ctx.strokeStyle = pillarGrad
        ctx.lineWidth = 3.2 * node.depth
        ctx.stroke()

        // Cabezal brillante de la torre
        ctx.beginPath()
        ctx.arc(node.nx, node.ny, 4.2, 0, Math.PI * 2)
        ctx.fillStyle = '#F5F7FC'
        ctx.fill()

        ctx.beginPath()
        ctx.arc(node.nx, node.ny, 8.5, 0, Math.PI * 2)
        ctx.strokeStyle = hex
        ctx.lineWidth = 1.2
        ctx.stroke()

        // Etiqueta doble: Sensor Satelital + API Alcaldía GAMC
        ctx.font = '700 9.5px "JetBrains Mono", monospace'
        ctx.fillStyle = hex
        ctx.fillText(node.code, node.nx + 11, node.ny - 1)
        ctx.font = '500 8px "JetBrains Mono", monospace'
        ctx.fillStyle = 'rgba(245, 247, 252, 0.72)'
        ctx.fillText(node.sub, node.nx + 11, node.ny + 10)
      })

      // 6. Retícula Orbital Interactiva en el Cursor
      const mx = mouse.x * width
      const my = mouse.y * height
      ctx.save()
      ctx.beginPath()
      ctx.arc(mx, my, 24, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255, 203, 115, 0.35)'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(mx - 32, my)
      ctx.lineTo(mx - 16, my)
      ctx.moveTo(mx + 16, my)
      ctx.lineTo(mx + 32, my)
      ctx.moveTo(mx, my - 32)
      ctx.lineTo(mx, my - 16)
      ctx.moveTo(mx, my + 16)
      ctx.lineTo(mx, my + 32)
      ctx.strokeStyle = 'rgba(101, 200, 242, 0.45)'
      ctx.stroke()
      ctx.restore()

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
    }
  }, [mode, activeLayer])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  )
}
