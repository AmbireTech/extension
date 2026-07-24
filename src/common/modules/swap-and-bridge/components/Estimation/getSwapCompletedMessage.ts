type SwapCompletedMessageTemplate = {
  title: string
  titleSecondary: string
  /** When true, only shown for non-stablecoin destination tokens. */
  degenOnly?: boolean
}

// Common stable symbols — "Degen move. Respect." is skipped for these.
const STABLECOIN_SYMBOLS = [
  'USDC',
  'USDT',
  'DAI',
  'BUSD',
  'FRAX',
  'TUSD',
  'USDE',
  'GUSD',
  'LUSD',
  'USDCE',
  'USDTE',
  'USDC.E',
  'USDT.E',
  'CRVUSD',
  'PYUSD',
  'FDUSD',
  'EURC',
  'EUROC'
]

export const isStablecoinSymbol = (symbol?: string | null): boolean => {
  if (!symbol) return false

  return STABLECOIN_SYMBOLS.includes(symbol.toUpperCase().replace(/\s/g, ''))
}

export const SWAP_COMPLETED_MESSAGE_TEMPLATES: SwapCompletedMessageTemplate[] = [
  { title: 'Mission accomplished.', titleSecondary: '{{symbol}} secured.' },
  { title: 'Cha-ching!', titleSecondary: "You've got {{symbol}} in your wallet." },
  { title: 'Trade maxxed.', titleSecondary: '{{symbol}} in.' },
  { title: 'Look at you trading.', titleSecondary: 'Swap complete.' },
  { title: 'Fast in, fast out.', titleSecondary: '' },
  { title: 'Swapped. Sealed. Done.', titleSecondary: '' },
  { title: 'Mmm, that went smoothly.', titleSecondary: '' },
  { title: 'One swap richer.', titleSecondary: '' },
  { title: 'Degen move.', titleSecondary: 'Respect.', degenOnly: true }
]

/** Pure 0..1 value derived from a route id — stable across re-renders, varies per swap. */
export const getUnitIntervalFromRouteId = (routeId: string | number): number => {
  const input = String(routeId)
  let hash = 0

  for (let i = 0; i < input.length; i++) {
    hash = Math.imul(31, hash) + input.charCodeAt(i)
  }

  // >>> 0 keeps the value in the uint32 range so division stays in [0, 1).
  return (hash >>> 0) / 0x100000000
}

export const getSwapCompletedMessageTemplate = (
  toTokenSymbol: string | null | undefined,
  routeId: string | number
): SwapCompletedMessageTemplate => {
  const includeDegen = !isStablecoinSymbol(toTokenSymbol)
  const candidates = SWAP_COMPLETED_MESSAGE_TEMPLATES.filter(
    (message) => includeDegen || !message.degenOnly
  )

  const index = Math.floor(getUnitIntervalFromRouteId(routeId) * candidates.length)

  return candidates[index]!
}
