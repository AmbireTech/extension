export type SpeculosClientOptions = {
  baseUrl: string
  timeoutMS?: number
}

export type SpeculosEvent = {
  text: string
  x: number
  y: number
  w: number
  h: number
  clear: boolean
}

export type Button = 'left' | 'right' | 'both'

export type ButtonAction = 'press' | 'release' | 'press-and-release'
