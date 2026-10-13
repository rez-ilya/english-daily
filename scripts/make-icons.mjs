// Генерирует PNG-иконки PWA в public/ без сторонних библиотек.
// Рисунок: облачко речи с тремя точками на зелёном фоне. Запуск: npm run icons
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const BG = [0x2f, 0x6f, 0x5e]
const FG = [0xff, 0xff, 0xff]

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
function png(size, pixel) {
  const raw = Buffer.alloc(size * (size * 4 + 1))
  let o = 0
  for (let y = 0; y < size; y++) {
    raw[o++] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y)
      raw[o++] = r; raw[o++] = g; raw[o++] = b; raw[o++] = a
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const inRoundRect = (x, y, x0, y0, x1, y1, r) => {
  const cx = Math.min(Math.max(x, x0 + r), x1 - r)
  const cy = Math.min(Math.max(y, y0 + r), y1 - r)
  return x >= x0 && x <= x1 && y >= y0 && y <= y1 && (x - cx) ** 2 + (y - cy) ** 2 <= r * r
}
const inTriangle = (x, y, [ax, ay], [bx, by], [cx, cy]) => {
  const s = (px, py, qx, qy, rx, ry) => (px - rx) * (qy - ry) - (qx - rx) * (py - ry)
  const d1 = s(x, y, ax, ay, bx, by), d2 = s(x, y, bx, by, cx, cy), d3 = s(x, y, cx, cy, ax, ay)
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))
}

// Координаты в единицах 0..1. scale < 1 уменьшает рисунок (для maskable-иконки).
function shape(u, v, { rounded, scale }) {
  if (rounded && !inRoundRect(u, v, 0, 0, 1, 1, 0.22)) return null
  const x = (u - 0.5) / scale + 0.5
  const y = (v - 0.5) / scale + 0.5
  const bubble = inRoundRect(x, y, 0.2, 0.24, 0.8, 0.66, 0.12) || inTriangle(x, y, [0.3, 0.6], [0.46, 0.6], [0.28, 0.8])
  if (!bubble) return BG
  for (const dx of [0.36, 0.5, 0.64]) if ((x - dx) ** 2 + (y - 0.45) ** 2 <= 0.045 ** 2) return BG
  return FG
}

function render(size, opts) {
  const SS = 4
  return png(size, (px, py) => {
    let r = 0, g = 0, b = 0, a = 0
    for (let i = 0; i < SS; i++)
      for (let j = 0; j < SS; j++) {
        const c = shape((px + (i + 0.5) / SS) / size, (py + (j + 0.5) / SS) / size, opts)
        if (c) { r += c[0]; g += c[1]; b += c[2]; a += 255 }
      }
    const n = SS * SS
    const k = a ? n / (a / 255) : 0
    return [Math.round((r / n) * k), Math.round((g / n) * k), Math.round((b / n) * k), Math.round(a / n)]
  })
}

writeFileSync('public/pwa-192.png', render(192, { rounded: true, scale: 1 }))
writeFileSync('public/pwa-512.png', render(512, { rounded: true, scale: 1 }))
writeFileSync('public/pwa-maskable-512.png', render(512, { rounded: false, scale: 0.75 }))
writeFileSync('public/apple-touch-icon.png', render(180, { rounded: false, scale: 0.85 }))
console.log('Иконки записаны в public/')
