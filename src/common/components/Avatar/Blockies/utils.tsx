import { Rect } from 'react-native-svg'

import { AvatarColors } from '@common/utils/avatars'

function hslToHex(_h: number, _s: number, _l: number) {
  const h = _h / 360
  const s = _s / 100
  const l = _l / 100
  let r
  let g
  let b
  if (s === 0) {
    r = g = b = l // achromatic
  } else {
    const hue2rgb = (p: number, q: number, _t: number) => {
      let t = _t
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16)
    return hex.length === 1 ? `0${hex}` : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const randseed = new Array(4)

const seedrand = (seed: string) => {
  for (let i = 0; i < randseed.length; i++) {
    randseed[i] = 0
  }

  for (let i = 0; i < seed.length; i++) {
    randseed[i % 4] = (randseed[i % 4] << 5) - randseed[i % 4] + seed.charCodeAt(i)
  }
}

const rand = () => {
  const t = randseed[0] ^ (randseed[0] << 11)

  randseed[0] = randseed[1]
  randseed[1] = randseed[2]
  randseed[2] = randseed[3]
  randseed[3] = randseed[3] ^ (randseed[3] >> 19) ^ t ^ (t >> 8)

  return (randseed[3] >>> 0) / ((1 << 31) >>> 0)
}

const createColor = () => {
  const h = Math.floor(rand() * 360)
  const s = rand() * 60 + 40
  const l = (rand() + rand() + rand() + rand()) * 25

  const color = hslToHex(h, s, l)

  return color
}

const createImageData = (size: number) => {
  const width = size
  const height = size

  const dataWidth = Math.ceil(width / 2)
  const mirrorWidth = width - dataWidth

  const data = []

  for (let y = 0; y < height; y++) {
    let row = []

    for (let x = 0; x < dataWidth; x++) {
      row[x] = Math.floor(rand() * 2.3)
    }

    const r = row.slice(0, mirrorWidth)

    r.reverse()

    row = row.concat(r)

    for (let i = 0; i < row.length; i++) {
      data.push(row[i])
    }
  }

  return data
}

const renderIcon = (
  _seed: string,
  size: number,
  scale: number,
  _color?: string,
  _bgcolor?: string,
  _spotcolor?: string
) => {
  const seed = _seed || Math.floor(Math.random() * 10 ** 16).toString(16)

  seedrand(seed)

  const color = _color || createColor()
  const bgcolor = _bgcolor || createColor()
  const spotcolor = _spotcolor || createColor()

  const imageData = createImageData(size)

  return imageData.map((item, i) => {
    let fill = bgcolor

    if (item) {
      if (item === 1) {
        fill = color
      } else {
        fill = spotcolor
      }
    }

    const row = Math.floor(i / size)
    const col = i % size

    return (
      <Rect
        key={`${row}-${col}`}
        x={row * scale}
        y={col * scale}
        width={scale}
        height={scale}
        fill={fill}
      />
    )
  })
}

const blockyColors = (seed: string): AvatarColors => {
  seedrand(seed)
  const color = createColor()
  const bgcolor = createColor()
  const spotcolor = createColor()

  return [color, bgcolor, spotcolor]
}

export { renderIcon, blockyColors }
