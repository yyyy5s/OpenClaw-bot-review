/**
 * Star-Office-UI-master visual overlay renderer.
 *
 * In non-edit mode this replaces the tile-based rendering with the
 * pre-rendered 1280×720 office background plus animated spritesheet
 * furniture and Star-style agent markers – faithfully reproducing the
 * aesthetic and art direction of the original Star-Office-UI-master.
 */

import { withBasePath } from '../../base-path'
import { CharacterState, Direction } from '../types'
import type { Character } from '../types'

// ── Constants ────────────────────────────────────────────────

/** Star-Office reference canvas dimensions */
export const STAR_W = 1280
export const STAR_H = 720

// ── Area positions (from Star-Office layout.js) ─────────────

const AREA_POSITIONS: Record<string, Array<{ x: number; y: number }>> = {
  breakroom: [
    { x: 620, y: 180 }, { x: 560, y: 220 }, { x: 680, y: 210 },
    { x: 540, y: 170 }, { x: 700, y: 240 }, { x: 600, y: 250 },
    { x: 650, y: 160 }, { x: 580, y: 200 },
  ],
  writing: [
    { x: 340, y: 420 }, { x: 400, y: 390 }, { x: 280, y: 450 },
    { x: 360, y: 370 }, { x: 420, y: 440 }, { x: 310, y: 400 },
    { x: 380, y: 460 }, { x: 340, y: 360 },
  ],
  error: [
    { x: 180, y: 260 }, { x: 120, y: 220 }, { x: 240, y: 230 },
    { x: 160, y: 200 }, { x: 220, y: 270 }, { x: 140, y: 250 },
    { x: 200, y: 210 }, { x: 260, y: 260 },
  ],
}

// SRE monitoring position (near server room)
const SRE_POSITION = { x: 1080, y: 250 }

// Furniture layout positions (from Star-Office layout.js)
const FURNITURE_LAYOUT = {
  sofa:           { x: 670, y: 144, originX: 0, originY: 0, depth: 10 },
  desk:           { x: 218, y: 417, originX: 0.5, originY: 0.5, depth: 1000 },
  flower:         { x: 310, y: 390, originX: 0.5, originY: 0.5, depth: 1100, scale: 0.8 },
  starWorking:    { x: 217, y: 333, originX: 0.5, originY: 0.5, depth: 900, scale: 1.32 },
  plants:         [
    { x: 565, y: 178, depth: 5 },
    { x: 230, y: 185, depth: 5 },
    { x: 977, y: 496, depth: 5 },
  ],
  poster:         { x: 252, y: 66, depth: 4 },
  coffeeMachine:  { x: 659, y: 397, originX: 0.5, originY: 0.5, depth: 99 },
  serverroom:     { x: 1021, y: 142, originX: 0.5, originY: 0.5, depth: 2 },
  errorBug:       { x: 1007, y: 221, originX: 0.5, originY: 0.5, depth: 50, scale: 0.9 },
  syncAnim:       { x: 1157, y: 592, originX: 0.5, originY: 0.5, depth: 40 },
  cat:            { x: 94, y: 557, originX: 0.5, originY: 0.5, depth: 2000 },
}

// Agent body colors from Star-Office/game.js
const AGENT_BODY_COLORS: Record<string, string> = {
  star: '#ffd700',
  npc1: '#00aaff',
  agent_nika: '#ff69b4',
  default: '#94a3b8',
}

// Agent name tag colors by auth status
const NAME_TAG_COLORS: Record<string, string> = {
  approved: '#22c55e',
  pending: '#f59e0b',
  rejected: '#ef4444',
  offline: '#64748b',
  default: '#94a3b8',
}

// ── Spritesheet Configuration ───────────────────────────────

interface SpritesheetCfg {
  src: string
  frameW: number
  frameH: number
  frames: number
  fps: number
}

const SHEET_DEFS: Record<string, SpritesheetCfg> = {
  coffee_machine: {
    src: '/assets/pixel-office/star/coffee-machine-v3-grid.webp',
    frameW: 230, frameH: 230, frames: 96, fps: 12.5,
  },
  serverroom: {
    src: '/assets/pixel-office/star/serverroom-spritesheet.webp',
    frameW: 180, frameH: 251, frames: 40, fps: 6,
  },
  error_bug: {
    src: '/assets/pixel-office/star/error-bug-spritesheet-grid.webp',
    frameW: 180, frameH: 180, frames: 96, fps: 12,
  },
  star_working: {
    src: '/assets/pixel-office/star/star-working-spritesheet-grid.webp',
    frameW: 230, frameH: 144, frames: 192, fps: 12,
  },
  sync_anim: {
    src: '/assets/pixel-office/star/sync-animation-v3-grid.webp',
    frameW: 256, frameH: 256, frames: 52, fps: 12,
  },
  cats: {
    src: '/assets/pixel-office/star/cats-spritesheet.webp',
    frameW: 160, frameH: 160, frames: 16, fps: 0,  // static, random frame
  },
  plants: {
    src: '/assets/pixel-office/star/plants-spritesheet.webp',
    frameW: 160, frameH: 160, frames: 16, fps: 0,
  },
  posters: {
    src: '/assets/pixel-office/star/posters-spritesheet.webp',
    frameW: 160, frameH: 160, frames: 32, fps: 0,
  },
  flowers: {
    src: '/assets/pixel-office/star/flowers-bloom-v2.webp',
    frameW: 65, frameH: 65, frames: 16, fps: 0,
  },
  star_idle: {
    src: '/assets/pixel-office/star/star-idle-v5.png',
    frameW: 256, frameH: 256, frames: 48, fps: 12,
  },
}

// ── Public types ─────────────────────────────────────────────

export interface StarModeState {
  ready: boolean
  bg: HTMLImageElement | null
  desk: HTMLImageElement | null
  sofaIdle: HTMLImageElement | null
  guestRoles: HTMLImageElement[]  // guest_role_1..6 static sprites
  guestAnims: HTMLImageElement[]  // guest_anim_1..6 animated spritesheets (32×32, 8 frames)
  sheets: Map<string, { img: HTMLImageElement; cfg: SpritesheetCfg; staticFrame: number }>
  elapsed: number
  /** Cached per-agent area assignment to smooth transitions */
  agentSlots: Map<number, { area: string; slot: number }>
  /** Error bug ping-pong position */
  bugX: number
  bugDir: number
}

// ── Asset Loading ────────────────────────────────────────────

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load ${src}`))
    img.src = withBasePath(src)
  })
}

export async function loadStarAssets(): Promise<StarModeState> {
  const p = '/assets/pixel-office/star/'

  const [bg, desk, sofaIdle] = await Promise.all([
    loadImg(p + 'office_bg_small.webp').catch(() => null),
    loadImg(p + 'desk-v3.webp').catch(() => null),
    loadImg(p + 'sofa-idle-v3.png').catch(() => null),
  ])

  // Load guest role sprites (6 variants, 128×64 each = 2 frames of 64×64)
  const guestRoles: HTMLImageElement[] = []
  const rolePromises = [1, 2, 3, 4, 5, 6].map(i =>
    loadImg(p + `guest_role_${i}.png`).catch(() => null),
  )
  const roleResults = await Promise.all(rolePromises)
  for (const r of roleResults) if (r) guestRoles.push(r)

  // Load guest anim spritesheets (6 variants, 32×32 frames, 8 frames each)
  const guestAnims: HTMLImageElement[] = []
  const animPromises = [1, 2, 3, 4, 5, 6].map(i =>
    loadImg(p + `guest_anim_${i}.webp`).catch(() => null),
  )
  const animResults = await Promise.all(animPromises)
  for (const r of animResults) if (r) guestAnims.push(r)

  const sheetEntries = await Promise.all(
    Object.entries(SHEET_DEFS).map(async ([key, cfg]) => {
      try {
        const img = await loadImg(cfg.src)
        const staticFrame = cfg.fps === 0 ? Math.floor(Math.random() * cfg.frames) : 0
        return [key, { img, cfg, staticFrame }] as const
      } catch {
        return null
      }
    }),
  )

  const sheets = new Map<string, { img: HTMLImageElement; cfg: SpritesheetCfg; staticFrame: number }>()
  for (const e of sheetEntries) if (e) sheets.set(e[0], e[1])

  return {
    ready: !!bg,
    bg, desk, sofaIdle,
    guestRoles,
    guestAnims,
    sheets,
    elapsed: 0,
    agentSlots: new Map(),
    bugX: FURNITURE_LAYOUT.errorBug.x,
    bugDir: 1,
  }
}

// ── Helpers ──────────────────────────────────────────────────

function sheetCols(img: HTMLImageElement, cfg: SpritesheetCfg): number {
  return Math.max(1, Math.floor(img.width / cfg.frameW))
}

function drawSheetFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cfg: SpritesheetCfg,
  frame: number,
  dx: number,
  dy: number,
  originX: number,
  originY: number,
  scale = 1,
): void {
  const cols = sheetCols(img, cfg)
  const col = frame % cols
  const row = Math.floor(frame / cols)
  const dw = cfg.frameW * scale
  const dh = cfg.frameH * scale
  ctx.drawImage(
    img,
    col * cfg.frameW, row * cfg.frameH, cfg.frameW, cfg.frameH,
    dx - dw * originX, dy - dh * originY, dw, dh,
  )
}

/** Map a character's state to Star-Office area name.
 *  In Star mode we only care about isActive, not tile-engine walk state. */
function agentArea(ch: Character): string {
  if (ch.isActive) {
    return 'writing'
  }
  return 'breakroom'
}

// ── Update ───────────────────────────────────────────────────

export function updateStarMode(state: StarModeState, dt: number, characters: Character[]): void {
  state.elapsed += dt

  // Error-bug ping-pong
  const bugSpeed = 60 // px/s
  state.bugX += state.bugDir * bugSpeed * dt
  if (state.bugX > 1111) { state.bugX = 1111; state.bugDir = -1 }
  if (state.bugX < 1007) { state.bugX = 1007; state.bugDir = 1 }

  // Assign agents to area slots
  const areaCounts: Record<string, number> = {}
  for (const ch of characters) {
    if (ch.isCat || ch.isLobster || ch.isSystemRole) continue
    const area = agentArea(ch)
    const slot = areaCounts[area] ?? 0
    areaCounts[area] = slot + 1
    state.agentSlots.set(ch.id, { area, slot })
  }
}

// ── Render ───────────────────────────────────────────────────

export function renderStarFrame(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  star: StarModeState,
  characters: Character[],
  hasError: boolean,
  hasSync: boolean,
): { offsetX: number; offsetY: number } {
  // Calculate scale to letterbox 1280×720 in the available canvas
  const scaleX = canvasW / STAR_W
  const scaleY = canvasH / STAR_H
  const scale = Math.min(scaleX, scaleY)
  const ox = Math.floor((canvasW - STAR_W * scale) / 2)
  const oy = Math.floor((canvasH - STAR_H * scale) / 2)

  // Fill letterbox area with dark background
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, canvasW, canvasH)

  ctx.save()
  ctx.translate(ox, oy)
  ctx.scale(scale, scale)

  // ── 1. Background ──────────────────────────────────────────
  // Fill floor areas first (background webp has transparency in floor regions)
  ctx.fillStyle = '#6b7b8d'
  ctx.fillRect(0, 0, STAR_W, STAR_H)
  if (star.bg) {
    ctx.drawImage(star.bg, 0, 0, STAR_W, STAR_H)
  } else {
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, STAR_W, STAR_H)
  }

  const time = star.elapsed

  // ── 2. Server room (depth 2) ───────────────────────────────
  drawFurnitureSheet(ctx, star, 'serverroom',
    FURNITURE_LAYOUT.serverroom.x, FURNITURE_LAYOUT.serverroom.y,
    FURNITURE_LAYOUT.serverroom.originX, FURNITURE_LAYOUT.serverroom.originY, time)

  // ── 3. Poster (depth 4) ────────────────────────────────────
  drawStaticSheet(ctx, star, 'posters',
    FURNITURE_LAYOUT.poster.x, FURNITURE_LAYOUT.poster.y, 0.5, 0.5)

  // ── 4. Plants (depth 5) ────────────────────────────────────
  for (const p of FURNITURE_LAYOUT.plants) {
    drawStaticSheet(ctx, star, 'plants', p.x, p.y, 0.5, 0.5)
  }

  // ── 5. Sofa (depth 10) ────────────────────────────────────
  if (star.sofaIdle) {
    ctx.drawImage(star.sofaIdle,
      FURNITURE_LAYOUT.sofa.x, FURNITURE_LAYOUT.sofa.y)
  }

  // ── 6. Sync animation (depth 40) ───────────────────────────
  if (hasSync) {
    drawFurnitureSheet(ctx, star, 'sync_anim',
      FURNITURE_LAYOUT.syncAnim.x, FURNITURE_LAYOUT.syncAnim.y,
      FURNITURE_LAYOUT.syncAnim.originX, FURNITURE_LAYOUT.syncAnim.originY, time)
  }

  // ── 7. Error-bug (depth 50) ──────────────────────────────
  if (hasError) {
    drawFurnitureSheet(ctx, star, 'error_bug',
      star.bugX, FURNITURE_LAYOUT.errorBug.y,
      FURNITURE_LAYOUT.errorBug.originX, FURNITURE_LAYOUT.errorBug.originY, time,
      FURNITURE_LAYOUT.errorBug.scale)
  }

  // ── 8. Coffee machine (depth 99) ──────────────────────────
  drawFurnitureSheet(ctx, star, 'coffee_machine',
    FURNITURE_LAYOUT.coffeeMachine.x, FURNITURE_LAYOUT.coffeeMachine.y,
    FURNITURE_LAYOUT.coffeeMachine.originX, FURNITURE_LAYOUT.coffeeMachine.originY, time)

  // ── 9. Star working at desk (depth 900) ───────────────────
  // Render the first active agent as the "Star" character sprite at the desk
  const mainAgent = findMainAgent(characters)
  const hasAnyNormalAgent = characters.some(c => !c.isCat && !c.isLobster && !c.isSystemRole && !c.isSubagent)
  if (mainAgent) {
    drawFurnitureSheet(ctx, star, 'star_working',
      FURNITURE_LAYOUT.starWorking.x, FURNITURE_LAYOUT.starWorking.y,
      FURNITURE_LAYOUT.starWorking.originX, FURNITURE_LAYOUT.starWorking.originY, time,
      FURNITURE_LAYOUT.starWorking.scale)
  } else if (!hasAnyNormalAgent) {
    // Only show star_idle when no agents at all (empty office)
    drawFurnitureSheet(ctx, star, 'star_idle',
      620, 200, 0.5, 0.5, time)
  }

  // ── 10. Desk (depth 1000) ──────────────────────────────────
  if (star.desk) {
    const d = FURNITURE_LAYOUT.desk
    ctx.drawImage(star.desk,
      d.x - star.desk.width * d.originX,
      d.y - star.desk.height * d.originY)
  }

  // ── 11. Flower (depth 1100) ────────────────────────────────
  drawStaticSheet(ctx, star, 'flowers',
    FURNITURE_LAYOUT.flower.x, FURNITURE_LAYOUT.flower.y,
    FURNITURE_LAYOUT.flower.originX, FURNITURE_LAYOUT.flower.originY,
    FURNITURE_LAYOUT.flower.scale)

  // ── 12. Agents as guest role sprites (depth 1200+) ──────────
  // Skip the main agent already rendered as Star sprite
  const mainId = mainAgent?.id
  for (const ch of characters) {
    if (ch.isCat || ch.isLobster || ch.isSystemRole) continue
    if (ch.id === mainId) continue  // already rendered as star_working
    const slotInfo = star.agentSlots.get(ch.id)
    if (!slotInfo) continue
    const slots = AREA_POSITIONS[slotInfo.area]
    if (!slots) continue
    const pos = slots[slotInfo.slot % slots.length]
    renderStarAgent(ctx, ch, pos.x, pos.y, time, star.guestRoles, star.guestAnims)
  }

  // ── 12b. Gateway SRE entity (near server room) ─────────────
  for (const ch of characters) {
    if (!ch.isSystemRole || ch.systemRoleType !== 'gateway_sre') continue
    renderStarSRE(ctx, ch, time, star.guestRoles)
  }

  // ── 12c. Speech bubbles (pixel style) ──────────────────────
  renderStarBubbles(ctx, characters, star, time)

  // ── 12d. Danmaku / floating text ───────────────────────────
  renderStarDanmaku(ctx, characters, star, time)

  // ── 13. Cat (depth 2000) ───────────────────────────────────
  drawStaticSheet(ctx, star, 'cats',
    FURNITURE_LAYOUT.cat.x, FURNITURE_LAYOUT.cat.y,
    FURNITURE_LAYOUT.cat.originX, FURNITURE_LAYOUT.cat.originY)

  // ── 14. Plaque ────────────────────────────────────────────
  renderPlaque(ctx)

  // ── 15. CRT scanlines ─────────────────────────────────────
  renderCRT(ctx)

  // ── 16. Inner border ──────────────────────────────────────
  ctx.strokeStyle = '#64477d'
  ctx.lineWidth = 8
  ctx.strokeRect(4, 4, STAR_W - 8, STAR_H - 8)

  ctx.restore()

  return { offsetX: ox, offsetY: oy }
}

// ── Internal renderers ──────────────────────────────────────

function drawFurnitureSheet(
  ctx: CanvasRenderingContext2D,
  star: StarModeState,
  key: string,
  x: number, y: number,
  originX: number, originY: number,
  time: number,
  scale = 1,
): void {
  const sheet = star.sheets.get(key)
  if (!sheet) return
  const { img, cfg } = sheet
  const frame = cfg.fps > 0
    ? Math.floor(time * cfg.fps) % cfg.frames
    : sheet.staticFrame
  drawSheetFrame(ctx, img, cfg, frame, x, y, originX, originY, scale)
}

function drawStaticSheet(
  ctx: CanvasRenderingContext2D,
  star: StarModeState,
  key: string,
  x: number, y: number,
  originX: number, originY: number,
  scale = 1,
): void {
  const sheet = star.sheets.get(key)
  if (!sheet) return
  drawSheetFrame(ctx, sheet.img, sheet.cfg, sheet.staticFrame, x, y, originX, originY, scale)
}

function findMainAgent(characters: Character[]): Character | null {
  // Only pick an actively working agent as the "Star" at the desk.
  // If nobody is working, nobody sits at the desk — no fallback.
  for (const ch of characters) {
    if (ch.isCat || ch.isLobster || ch.isSystemRole || ch.isSubagent) continue
    if (ch.isActive) return ch
  }
  return null
}

function renderStarAgent(
  ctx: CanvasRenderingContext2D,
  ch: Character,
  x: number, y: number,
  time: number,
  guestRoles: HTMLImageElement[],
  guestAnims: HTMLImageElement[],
): void {
  ctx.save()

  // Transparency for inactive agents
  const isActive = ch.isActive && ch.state === CharacterState.TYPE
  if (!ch.isActive) ctx.globalAlpha = 0.6
  // Subagents render smaller
  const isSub = ch.isSubagent
  const sizeMul = isSub ? 0.75 : 1.0

  const roleIdx = (ch.id - 1) % Math.max(1, guestRoles.length)

  // Use animated spritesheet for active agents if available
  const animImg = guestAnims.length > 0 ? guestAnims[roleIdx % guestAnims.length] : null
  const SPRITE_SCALE = 2.0 * sizeMul  // 32px × 2.0 = 64px display (fits nicely in 1280×720)
  if (isActive && animImg) {
    // guest_anim_N.webp: 32×32 frames, 8 frames, horizontal strip
    const animFrameW = 32
    const animFrameH = 32
    const totalFrames = 8
    const fps = 4  // gentle pace, not frenetic
    const frame = Math.floor(time * fps) % totalFrames
    const dw = animFrameW * SPRITE_SCALE
    const dh = animFrameH * SPRITE_SCALE
    ctx.drawImage(
      animImg,
      frame * animFrameW, 0, animFrameW, animFrameH,
      x - dw / 2, y - dh / 2, dw, dh,
    )
  } else {
    // Draw guest role sprite (128×64 sheet = 4×2 frames of 32×32)
    const roleImg = guestRoles[roleIdx]
    if (roleImg) {
      const frameW = 32
      const frameH = 32
      const frame = isActive ? 1 : 0
      const dw = frameW * SPRITE_SCALE
      const dh = frameH * SPRITE_SCALE
      ctx.drawImage(
        roleImg,
        frame * frameW, 0, frameW, frameH,
        x - dw / 2, y - dh / 2, dw, dh,
      )
    } else {
      ctx.font = '20px serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('⭐', x, y)
    }
  }

  ctx.globalAlpha = 1

  // Floating bounce animation
  const bounce = Math.sin(time * 2 + ch.id * 1.3) * 3

  // Subagent laptop indicator (pixel art, no emoji)
  if (isSub) {
    const lx = x - 22, ly = y - 22 + bounce
    ctx.fillStyle = '#555'
    ctx.fillRect(lx, ly, 10, 7)     // screen
    ctx.fillStyle = '#4ade80'
    ctx.fillRect(lx + 1, ly + 1, 8, 5)  // screen face
    ctx.fillStyle = '#777'
    ctx.fillRect(lx - 1, ly + 7, 12, 2)  // keyboard
  }

  // Status dot (subagents use red, normal agents green/gray)
  const dotColor = isSub
    ? (isActive ? '#dc2626' : '#991b1b')
    : (isActive ? '#22c55e' : '#94a3b8')
  ctx.fillStyle = dotColor
  ctx.beginPath()
  ctx.arc(x + 20 * sizeMul, y - 26 * sizeMul + bounce, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Name tag
  const name = ch.label || `Agent ${ch.id}`
  ctx.font = "14px 'ArkPixel', monospace"
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'

  const metrics = ctx.measureText(name)
  const padX = 6
  const padY = 4
  const tagW = metrics.width + padX * 2
  const tagH = 18
  const tagX = x - tagW / 2
  const tagY = y - 40 * sizeMul + bounce

  // Tag background — pixel dark style
  ctx.fillStyle = 'rgba(0,0,0,0.85)'
  ctx.fillRect(tagX, tagY, tagW, tagH)
  // Tag border — subagents red, normal agents muted
  ctx.strokeStyle = isSub ? '#dc2626' : 'rgba(255,255,255,0.25)'
  ctx.lineWidth = 1
  ctx.strokeRect(tagX, tagY, tagW, tagH)

  // Tag text
  let nameColor = NAME_TAG_COLORS.default
  if (isSub) {
    nameColor = isActive ? '#dc2626' : '#991b1b'
  } else if (ch.isActive) {
    nameColor = NAME_TAG_COLORS.approved
  }
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 3
  ctx.strokeText(name, x, tagY + tagH - padY)
  ctx.fillStyle = nameColor
  ctx.fillText(name, x, tagY + tagH - padY)

  ctx.restore()
}

function renderPlaque(ctx: CanvasRenderingContext2D): void {
  const px = 640
  const py = STAR_H - 36

  // Background bar
  ctx.fillStyle = '#5d4037'
  ctx.strokeStyle = '#3e2723'
  ctx.lineWidth = 3
  const w = 420, h = 44
  ctx.fillRect(px - w / 2, py - h / 2, w, h)
  ctx.strokeRect(px - w / 2, py - h / 2, w, h)

  // Title
  ctx.font = "bold 18px 'ArkPixel', monospace"
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 2
  ctx.strokeText('OpenClaw 像素办公室', px, py)
  ctx.fillStyle = '#ffd700'
  ctx.fillText('OpenClaw 像素办公室', px, py)

  // ⭐ decorations
  ctx.font = '20px serif'
  ctx.fillText('⭐', px - 190, py)
  ctx.fillText('⭐', px + 190, py)
}

// ── SRE Entity Renderer ─────────────────────────────────────

function renderStarSRE(
  ctx: CanvasRenderingContext2D,
  ch: Character,
  time: number,
  guestRoles: HTMLImageElement[],
): void {
  const x = SRE_POSITION.x
  const y = SRE_POSITION.y

  ctx.save()

  // Health status color & pulse speed
  const status = ch.systemStatus ?? 'unknown'
  let statusColor = '#9CA3AF'
  let pulseSpeed = 2.0
  if (status === 'healthy') { statusColor = '#22c55e'; pulseSpeed = 1.3 }
  else if (status === 'degraded') { statusColor = '#facc15'; pulseSpeed = 4.5 }
  else if (status === 'down') { statusColor = '#991b1b'; pulseSpeed = 9.0 }

  // Draw SRE sprite (steady, use blue variant for visibility against server room)
  const roleIdx = 0  // guest_role_1 (blue) for contrast against red server LEDs
  const roleImg = guestRoles[roleIdx]
  if (roleImg) {
    const frameW = 32, frameH = 32, scale = 2.0  // 32px × 2.0 = 64px
    const dw = frameW * scale, dh = frameH * scale
    ctx.drawImage(roleImg, 0, 0, frameW, frameH, x - dw / 2, y - dh / 2, dw, dh)
  }

  const bounce = Math.sin(time * 1.5) * 3

  // Pixel-art monitor icon
  const mx = x - 26, my = y - 24 + bounce
  ctx.fillStyle = '#333'
  ctx.fillRect(mx, my, 16, 12)          // screen body
  ctx.fillStyle = statusColor
  ctx.fillRect(mx + 2, my + 2, 12, 8)   // screen face (status-colored)
  ctx.fillStyle = '#555'
  ctx.fillRect(mx + 6, my + 12, 4, 3)   // stand
  ctx.fillRect(mx + 4, my + 15, 8, 2)   // base
  // Blinking pixel on screen
  const blink = Math.sin(time * 3) > 0
  if (blink) {
    ctx.fillStyle = '#fff'
    ctx.fillRect(mx + 4, my + 4, 2, 2)
  }

  // Health status pulsing dot (gentle pulse)
  const dotAlpha = 0.7 + 0.3 * ((Math.sin(time * pulseSpeed) + 1) / 2)
  ctx.save()
  ctx.globalAlpha = dotAlpha
  ctx.fillStyle = statusColor
  ctx.beginPath()
  ctx.arc(x + 22, y - 28 + bounce, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.restore()

  // SRE name tag
  const label = ch.label || '值班SRE'
  ctx.font = "bold 14px 'ArkPixel', monospace"
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  const metrics = ctx.measureText(label)
  const padX = 6, padY = 4
  const tagW = metrics.width + padX * 2
  const tagH = 18
  const tagX = x - tagW / 2
  const tagY = y - 42 + bounce

  // Dark pixel tag with status-colored border
  ctx.fillStyle = 'rgba(0,0,0,0.85)'
  ctx.fillRect(tagX, tagY, tagW, tagH)
  ctx.strokeStyle = statusColor
  ctx.lineWidth = 1.5
  ctx.strokeRect(tagX, tagY, tagW, tagH)

  ctx.strokeStyle = '#000'
  ctx.lineWidth = 3
  ctx.strokeText(label, x, tagY + tagH - padY)
  ctx.fillStyle = statusColor
  ctx.fillText(label, x, tagY + tagH - padY)

  ctx.restore()
}

// ── Pixel-style speech bubbles ──────────────────────────────

function renderStarBubbles(
  ctx: CanvasRenderingContext2D,
  characters: Character[],
  star: StarModeState,
  time: number,
): void {
  for (const ch of characters) {
    if (!ch.bubbleType) continue

    // Find agent position in Star coords
    let bx: number, by: number
    if (ch.isSystemRole) {
      bx = SRE_POSITION.x; by = SRE_POSITION.y
    } else {
      const slotInfo = star.agentSlots.get(ch.id)
      if (!slotInfo) continue
      const slots = AREA_POSITIONS[slotInfo.area]
      if (!slots) continue
      const pos = slots[slotInfo.slot % slots.length]
      bx = pos.x; by = pos.y
    }

    const bounce = Math.sin(time * 2 + ch.id * 1.3) * 3
    const bubbleX = bx
    const bubbleY = by - 72 + bounce

    ctx.save()
    let alpha = 1.0
    if (ch.bubbleType === 'waiting' && ch.bubbleTimer < 0.5) {
      alpha = ch.bubbleTimer / 0.5
    }
    ctx.globalAlpha = alpha

    // Pixel bubble body
    const bw = 36, bh = 22
    const bLeft = bubbleX - bw / 2
    const bTop = bubbleY - bh
    const borderColor = ch.bubbleType === 'permission' ? '#f59e0b' : '#22c55e'

    ctx.fillStyle = '#141722'
    ctx.fillRect(bLeft, bTop, bw, bh)
    ctx.strokeStyle = borderColor
    ctx.lineWidth = 2
    ctx.strokeRect(bLeft, bTop, bw, bh)

    // Pixel tail
    ctx.fillStyle = '#141722'
    ctx.fillRect(bubbleX - 3, bTop + bh, 6, 4)
    ctx.fillStyle = borderColor
    ctx.fillRect(bubbleX - 4, bTop + bh, 1, 4)
    ctx.fillRect(bubbleX + 4, bTop + bh, 1, 4)
    ctx.fillRect(bubbleX - 3, bTop + bh + 4, 8, 1)

    // Content
    if (ch.bubbleType === 'permission') {
      // Animated amber dots
      const dotPhase = Math.floor(time * 3) % 4
      ctx.fillStyle = '#f59e0b'
      for (let i = 0; i < 3; i++) {
        const dy = i <= dotPhase ? 0 : 2
        ctx.fillRect(bubbleX - 8 + i * 8, bTop + bh / 2 - 2 + dy, 4, 4)
      }
    } else {
      ctx.font = "bold 14px 'ArkPixel', monospace"
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#22c55e'
      ctx.fillText('✓', bubbleX, bTop + bh / 2)
    }

    ctx.restore()
  }
}

// ── Danmaku / floating text ─────────────────────────────────

function renderStarDanmaku(
  ctx: CanvasRenderingContext2D,
  characters: Character[],
  star: StarModeState,
  time: number,
): void {
  const lifetime = 4.0

  for (const ch of characters) {
    if (ch.photoComments.length === 0 && ch.codeSnippets.length === 0) continue

    // Find agent position
    let ax: number, ay: number
    if (ch.isSystemRole) {
      ax = SRE_POSITION.x; ay = SRE_POSITION.y
    } else {
      const slotInfo = star.agentSlots.get(ch.id)
      if (!slotInfo) continue
      const slots = AREA_POSITIONS[slotInfo.area]
      if (!slots) continue
      const pos = slots[slotInfo.slot % slots.length]
      ax = pos.x; ay = pos.y
    }

    ctx.save()

    // Photo comments — floating gold text
    for (const pc of ch.photoComments) {
      const progress = pc.age / lifetime
      if (progress >= 1) continue
      let a = 1.0
      if (pc.age < 0.3) a = pc.age / 0.3
      if (progress > 0.6) a = (1 - progress) / 0.4

      const floatY = progress * 120
      const baseX = ax + pc.x * 0.5
      const baseY = ay - 80 - floatY

      ctx.globalAlpha = a * 0.9
      ctx.font = "bold 12px 'ArkPixel', monospace"
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'

      const tw = ctx.measureText(pc.text).width
      const px = 4, py = 2

      // Pixel background
      ctx.fillStyle = 'rgba(0,0,0,0.85)'
      ctx.fillRect(baseX - tw / 2 - px, baseY - 14 - py, tw + px * 2, 14 + py * 2)
      ctx.strokeStyle = '#ffd700'
      ctx.lineWidth = 1
      ctx.strokeRect(baseX - tw / 2 - px, baseY - 14 - py, tw + px * 2, 14 + py * 2)

      ctx.fillStyle = '#ffd700'
      ctx.fillText(pc.text, baseX, baseY)
    }

    // Code snippets — floating green code
    for (const cs of ch.codeSnippets) {
      const progress = cs.age / lifetime
      if (progress >= 1) continue
      let a = 1.0
      if (cs.age < 0.2) a = cs.age / 0.2
      if (progress > 0.7) a = (1 - progress) / 0.3

      const floatY = progress * 100
      const baseX = ax + cs.x * 0.5
      const baseY = ay - 70 - floatY + cs.y * 0.3

      ctx.globalAlpha = a * 0.8
      ctx.font = "10px 'ArkPixel', monospace"
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'

      const tw = ctx.measureText(cs.text).width
      ctx.fillStyle = 'rgba(20,23,34,0.9)'
      ctx.fillRect(baseX - tw / 2 - 3, baseY - 12, tw + 6, 14)
      ctx.strokeStyle = '#78a340'
      ctx.lineWidth = 1
      ctx.strokeRect(baseX - tw / 2 - 3, baseY - 12, tw + 6, 14)

      ctx.fillStyle = '#78a340'
      ctx.fillText(cs.text, baseX, baseY)
    }

    ctx.restore()
  }
}

function renderCRT(ctx: CanvasRenderingContext2D): void {
  ctx.save()
  ctx.globalAlpha = 0.06
  ctx.fillStyle = '#fff'
  // Horizontal scanlines: 1px white every 12px
  for (let y = 0; y < STAR_H; y += 12) {
    ctx.fillRect(0, y, STAR_W, 1)
  }
  ctx.restore()
}
