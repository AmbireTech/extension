import { hexToBytes } from './bytes'

describe('hexToBytes', () => {
  it('decodes hex with or without the 0x prefix', () => {
    expect(hexToBytes('0x00ff10')).toEqual(new Uint8Array([0x00, 0xff, 0x10]))
    expect(hexToBytes('ABcd')).toEqual(new Uint8Array([0xab, 0xcd]))
    expect(hexToBytes('0x')).toEqual(new Uint8Array(0))
  })

  it.each(['0xzz', '0x1g00', '0x123', '0x12 34', '0x-1'])(
    'refuses %p instead of decoding it to other bytes',
    (hex) => {
      expect(() => hexToBytes(hex)).toThrow()
    }
  )
})
