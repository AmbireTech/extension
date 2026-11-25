import { canOwnersHereMeetThreshold, getSignAndCloseOwnerAddr } from './helpers'

const owner = (addr: string, hasSigned: boolean, isImported = true) => ({
  addr,
  hasSigned,
  isImported
})

describe('getSignAndCloseOwnerAddr', () => {
  test('returns the last unsigned imported owner when its signature will not meet the threshold', () => {
    const owners = [owner('0x1', true), owner('0x2', false), owner('0x3', false, false)]

    expect(getSignAndCloseOwnerAddr(owners, 3)).toBe('0x2')
  })

  test('returns null when more than one imported owner can still sign', () => {
    const owners = [owner('0x1', true), owner('0x2', false), owner('0x3', false)]

    expect(getSignAndCloseOwnerAddr(owners, 3)).toBeNull()
  })

  test('returns null when the last imported owner signature will meet the threshold', () => {
    const owners = [owner('0x1', true), owner('0x2', false), owner('0x3', false, false)]

    expect(getSignAndCloseOwnerAddr(owners, 2)).toBeNull()
  })
})

describe('canOwnersHereMeetThreshold', () => {
  test('is true when the imported owners reach the threshold', () => {
    const owners = [owner('0x1', false), owner('0x2', false), owner('0x3', false, false)]

    expect(canOwnersHereMeetThreshold(owners, 2)).toBe(true)
  })

  test('is false when owners elsewhere have to sign too', () => {
    const owners = [owner('0x1', false), owner('0x2', false, false), owner('0x3', false, false)]

    expect(canOwnersHereMeetThreshold(owners, 2)).toBe(false)
  })

  test('counts the owners that signed elsewhere already', () => {
    const owners = [owner('0x1', false), owner('0x2', true, false), owner('0x3', false, false)]

    expect(canOwnersHereMeetThreshold(owners, 2)).toBe(true)
  })

  test('is true while the threshold is not known yet', () => {
    expect(canOwnersHereMeetThreshold([owner('0x1', false, false)], 0)).toBe(true)
  })
})
