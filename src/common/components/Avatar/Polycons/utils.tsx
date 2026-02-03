/* eslint-disable no-bitwise */
import React from 'react'
import { Path, Rect } from 'react-native-svg'

export function generateSeedEthereum(address: string): number {
  // Parse the first 8 chars of the address after '0x'
  const addr = address.slice(2, 10)
  return parseInt(addr, 16)
}

// /////////////////////////////////////////////////////
// Polycon SVG Creation
// /////////////////////////////////////////////////////
// Color Palettes
const neutralPairs = [
  ['#FF5C16', '#FCFCFC'],
  ['#FF5C16', '#131416'],
  ['#D075FF', '#FCFCFC'],
  ['#D075FF', '#131416'],
  ['#BAF24A', '#FCFCFC'],
  ['#BAF24A', '#131416'],
  ['#89B0FF', '#FCFCFC'],
  ['#89B0FF', '#131416'],
  ['#FCFCFC', '#FF5C16'],
  ['#131416', '#FF5C16'],
  ['#FCFCFC', '#D075FF'],
  ['#131416', '#D075FF'],
  ['#FCFCFC', '#BAF24A'],
  ['#131416', '#BAF24A'],
  ['#FCFCFC', '#89B0FF'],
  ['#131416', '#89B0FF']
]

const tonalPairs = [
  ['#FFA680', '#FF5C16'],
  ['#661800', '#FF5C16'],
  ['#EAC2FF', '#D075FF'],
  ['#3D065F', '#D075FF'],
  ['#E5FFC3', '#BAF24A'],
  ['#013330', '#BAF24A'],
  ['#CCE7FF', '#89B0FF'],
  ['#190066', '#89B0FF'],
  ['#FF5C16', '#FFA680'],
  ['#FF5C16', '#661800'],
  ['#D075FF', '#EAC2FF'],
  ['#D075FF', '#3D065F'],
  ['#BAF24A', '#E5FFC3'],
  ['#BAF24A', '#013330'],
  ['#89B0FF', '#CCE7FF'],
  ['#89B0FF', '#190066'],
  ['#661800', '#FFA680'],
  ['#FFA680', '#661800'],
  ['#3D065F', '#EAC2FF'],
  ['#EAC2FF', '#3D065F'],
  ['#013330', '#E5FFC3'],
  ['#E5FFC3', '#013330'],
  ['#190066', '#CCE7FF'],
  ['#CCE7FF', '#190066']
]

const complementaryPairs = [
  ['#EAC2FF', '#013330'],
  ['#013330', '#EAC2FF'],
  ['#CCE7FF', '#661800'],
  ['#661800', '#CCE7FF'],
  ['#E5FFC3', '#3D065F'],
  ['#3D065F', '#E5FFC3'],
  ['#FFA680', '#190066'],
  ['#190066', '#FFA680'],
  ['#CCE7FF', '#013330'],
  ['#013330', '#CCE7FF']
]

const colorPairs = neutralPairs.concat(tonalPairs).concat(complementaryPairs)

/**
 * SDBM hash function
 *
 * @param str The string to hash
 * @returns A numeric hash value
 */
export function sdbmHash(str: string): number {
  let hash = 0

  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + (hash << 6) + (hash << 16) - hash
  }
  return hash
}

/**
 * Convert numeric/byte-array seed to a 6+ length string
 *
 * @param seed The seed value to convert (either a number or array of numbers)
 * @returns A string representation of the seed (minimum 6 characters)
 */
export function seedToString(seed: number | number[]): string {
  if (typeof seed === 'number') {
    let hex = seed.toString(16)
    if (hex.length < 6) {
      hex = hex.padEnd(6, '0')
    }
    return hex
  }
  if (Array.isArray(seed)) {
    let hex = seed.map((b) => b.toString(16).padStart(2, '0')).join('')
    if (hex.length < 6) {
      hex = hex.padEnd(6, '0')
    }
    return hex
  }
  return 'seed000'
}

interface PolyconColors {
  bgColor: string
  fgColor: string
}

/**
 * Generate colors for a polycon based on seed
 *
 * @param seed The seed value used to generate colors
 * @returns An object with bgColor and fgColor
 */
export function getPolyconColors(seed: number | number[]): PolyconColors {
  const str = seedToString(seed)
  const hashVal = sdbmHash(str)
  const colorPairIndex = Math.abs(hashVal) % colorPairs.length
  const [bgColor, fgColor] = colorPairs[colorPairIndex]! as [string, string]

  return { bgColor, fgColor }
}

/**
 * Renders the Polycon icon as React Native SVG components.
 *
 * @param seed The seed value used to generate the icon
 * @param size The size of the SVG icon in pixels
 * @returns React elements for the Polycon
 */
export function renderPolycon(seed: number | number[], size = 100): JSX.Element[] {
  // 1) Convert seed to string, then hash
  const str = seedToString(seed)
  const hashVal = sdbmHash(str)

  // 2) Pick color pair based on the hash
  const { bgColor, fgColor } = getPolyconColors(seed)

  // 3) Geometry setup
  const grid = 2
  const margin = size * 0.25
  const innerSize = size - 2 * margin
  const cellSize = innerSize / grid

  let pathData = ''
  const filledGrid: boolean[][] = Array.from({ length: grid }, () => Array(grid).fill(false))

  const startX = Math.floor(grid / 2)
  const startY = Math.floor(grid / 2)
  const stack = [[startX, startY]]
  filledGrid[startX]![startY] = true

  while (stack.length > 0) {
    // Using destructuring assignment with a non-null assertion is safe here because we've verified stack.length > 0
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [x, y] = stack.pop()!

    if (typeof x !== 'number' || typeof y !== 'number') {
      continue
    }
    const cellHash = Math.abs(hashVal >> (x * 3 + y * 5)) & 15

    const neighbors: [number, number][] = []
    const directions: [number, number][] = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0]
    ]
    for (const [dx, dy] of directions) {
      const nx = x + dx
      const ny = y + dy
      if (nx >= 0 && nx < grid && ny >= 0 && ny < grid && !filledGrid![nx]![ny]) {
        neighbors.push([nx, ny])
      }
    }
    while (neighbors.length > 0) {
      const idx = Math.abs(cellHash + neighbors.length) % neighbors.length
      const [nx, ny] = neighbors.splice(idx, 1)[0]!
      stack.push([nx, ny])
      filledGrid[nx]![ny] = true
    }

    // Determine shape: square or right triangle (with rotation)
    const rotation = (cellHash % 4) * 90
    const isSquare = cellHash % 5 === 0 // ~20% chance
    const cx = margin + x * cellSize
    const cy = margin + y * cellSize

    if (isSquare) {
      pathData += `M${cx},${cy} h${cellSize} v${cellSize} h-${cellSize}z `
    } else if (rotation === 0) {
      pathData += `M${cx},${cy} h${cellSize} v${cellSize}z `
    } else if (rotation === 90) {
      pathData += `M${cx + cellSize},${cy} v${cellSize} h-${cellSize}z `
    } else if (rotation === 180) {
      pathData += `M${cx + cellSize},${cy + cellSize} h-${cellSize} v-${cellSize}z `
    } else {
      pathData += `M${cx},${cy + cellSize} v-${cellSize} h${cellSize}z `
    }
  }

  return [
    <Rect key="bg" width={size} height={size} fill={bgColor} />,
    <Path key="fg" d={pathData} fill={fgColor} />
  ]
}
